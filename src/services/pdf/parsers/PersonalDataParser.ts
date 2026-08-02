/**
 * Parser de datos personales de la Constancia de Semanas Cotizadas del IMSS.
 * Implementa el patrón Strategy para permitir agregar otros parsers de documentos.
 *
 * NOTA: El IMSS puede cambiar el formato del documento. Este parser se basa
 * en los patrones comunes observados en constancias digitales (no escaneadas).
 */
import type { DatosExtraidos, ParseResult, DocumentType, RelacionLaboral } from '../../../models';
import { calcularSbcPromedioPonderado, type PeriodoSBC } from '../../../utils/sbcPromedio';
import { round2 } from '../../../utils/format';
import { SEMANAS_PROMEDIO_SBC } from '../../../constants/ley73';

/** Interfaz común para todos los parsers de documentos. */
export interface DocumentParser<T> {
  readonly documentType: DocumentType;
  canHandle(text: string): boolean;
  parse(text: string): ParseResult<T>;
}

/** Parser de la Constancia de Semanas Cotizadas IMSS. */
export const ConstanciaIMSSParser: DocumentParser<DatosExtraidos> = {
  documentType: 'constancia_semanas_imss',

  canHandle(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('imss') &&
      (lower.includes('semanas cotizadas') || lower.includes('constancia'))
    );
  },

  parse(text: string): ParseResult<DatosExtraidos> {
    const advertencias: string[] = [];
    const camposFaltantes: string[] = [];

    const datos: DatosExtraidos = {
      relacionesLaborales: [],
    };

    // ─── Nombre ───────────────────────────────────────────
    // NOTA IMPORTANTE: el orden de texto que entrega la extracción de PDF
    // (pdfjs-dist) sigue el orden de dibujado del content stream, NO el
    // orden visual de lectura. En la Constancia de Semanas Cotizadas, el
    // nombre del asegurado puede aparecer intercalado entre otras etiquetas
    // (p. ej. entre "NSS:" y el número de NSS) en vez de justo después de
    // un rótulo "Nombre:". Por eso se prueban varias estrategias en orden
    // de confiabilidad, en vez de asumir adyacencia estricta.
    datos.nombre = extraerNombre(text) ?? undefined;
    if (!datos.nombre) {
      camposFaltantes.push('Nombre');
    }

    // ─── CURP ───────────────────────────────────────────
    const curpMatch = text.match(/\b([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d)\b/);
    if (curpMatch?.[1]) {
      datos.curp = curpMatch[1];
    } else {
      camposFaltantes.push('CURP');
    }

    // ─── NSS ───────────────────────────────────────────
    // El valor no siempre está inmediatamente después de la etiqueta (puede
    // haber otro texto intercalado por el orden de extracción); se busca en
    // una ventana posterior a la etiqueta en vez de exigir adyacencia.
    const nssValor = buscarValorTrasEtiqueta(text, /(?:nss|n\.s\.s\.|número de seguridad social)/i, /\b(\d{10,11})\b/);
    if (nssValor) {
      datos.nss = nssValor;
    } else {
      camposFaltantes.push('NSS');
    }

    // ─── Fecha de nacimiento ───────────────────────────────────────────
    const fechaNacMatch = text.match(
      /(?:fecha de nacimiento|nacimiento)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/i,
    );
    if (fechaNacMatch?.[1]) {
      const fechaStr = fechaNacMatch[1];
      const fecha = new Date(fechaStr + 'T00:00:00');
      if (!isNaN(fecha.getTime())) {
        datos.fechaNacimiento = fecha;
      }
    } else if (datos.curp) {
      // La Constancia de Semanas Cotizadas no incluye un campo explícito de
      // fecha de nacimiento, pero el CURP la codifica en sus primeros 6
      // dígitos (AAMMDD).
      const fechaDesdeCurp = fechaNacimientoDesdeCURP(datos.curp);
      if (fechaDesdeCurp) {
        datos.fechaNacimiento = fechaDesdeCurp;
        advertencias.push(
          'La fecha de nacimiento se infirió del CURP (este documento no la incluye directamente). Verifícala.',
        );
      } else {
        camposFaltantes.push('Fecha de nacimiento');
      }
    } else {
      camposFaltantes.push('Fecha de nacimiento');
    }

    // ─── Semanas cotizadas ───────────────────────────────────────────
    const semanasMatch = text.match(
      /(?:semanas\s+(?:cotizadas|reconocidas|acreditadas))[:\s]*(\d{1,5})/i,
    );
    if (semanasMatch?.[1]) {
      datos.semanasTotales = parseInt(semanasMatch[1]);
    } else {
      camposFaltantes.push('Semanas cotizadas');
    }

    // ─── Último SBC ───────────────────────────────────────────
    // No se ancla a la etiqueta "Salario Base de Cotización": el orden de
    // extracción de pdfjs-dist puede intercalar una fecha (también
    // numérica, p. ej. "16/01/2021") entre la etiqueta y su monto, y una
    // búsqueda sin el signo "$" puede capturar el día/mes de esa fecha en
    // vez del monto real. En este documento el signo "$" solo antecede a
    // montos de SBC, así que se busca directamente en todo el texto. Se
    // asume que el primer monto encontrado corresponde al registro más
    // reciente (los patrones se listan en orden reverso-cronológico).
    const sbcMatch = text.match(/\$\s*(\d{1,6}(?:[.,]\d{1,4})?)/);
    if (sbcMatch?.[1]) {
      const valor = parseFloat(sbcMatch[1].replace(',', '.'));
      if (!isNaN(valor) && valor > 0) {
        datos.ultimoSBC = valor;
      } else {
        camposFaltantes.push('Último SBC');
      }
    } else {
      camposFaltantes.push('Último SBC');
    }

    // ─── SBC promedio (últimas 250 semanas) ───────────────────────────────
    // Solo se calcula cuando la constancia trae, por cada patrón, la tabla
    // de movimientos (REINGRESO / MODIFICACIÓN DE SALARIO / BAJA) con el
    // historial completo de cambios salariales. Sin esa tabla, la única
    // alternativa sería aproximar con el último SBC de cada patrón — pero
    // eso puede diferir mucho del promedio real, así que se prefiere no
    // inventar un número y en cambio pedir la constancia correcta.
    const historialResultado = extraerHistorialLaboral(text);
    datos.relacionesLaborales = historialResultado.relaciones;
    if (historialResultado.omitioMasReciente) {
      advertencias.push(
        'No se pudo determinar cuándo terminó tu empleo más reciente (no aparece marcado como "Vigente"), ' +
          'así que no se incluyó en el cálculo del SBC promedio. Verifica el promedio manualmente.',
      );
    }
    if (historialResultado.usoDatosDetallados) {
      const promedioResultado = calcularSbcPromedioPonderado(
        historialResultado.periodos,
        new Date(),
        SEMANAS_PROMEDIO_SBC,
      );
      if (promedioResultado) {
        datos.promedioSBC = round2(promedioResultado.promedio);
        advertencias.push(
          `SBC promedio de las últimas 250 semanas: $${datos.promedioSBC.toFixed(2)} (calculado a partir del historial detallado de modificaciones salariales de tus patrones). Verifica este valor.` +
            (promedioResultado.completo
              ? ''
              : ' Tu historial laboral registrado no alcanza a cubrir las 250 semanas completas; el promedio se calculó solo con los días disponibles.') +
            (historialResultado.huboSolapamiento
              ? ' Detectamos periodos con más de un patrón simultáneo (ver aviso del IMSS sobre periodos traslapados); ' +
                'en esos días el promedio pondera cada SBC por separado, lo cual puede no coincidir con cómo el IMSS combina cotizaciones simultáneas. ' +
                'Verifica manualmente si tuviste empleos simultáneos.'
              : ''),
        );
      } else {
        camposFaltantes.push('SBC promedio (250 semanas)');
        advertencias.push(
          'El historial detallado de modificaciones salariales de tus patrones no alcanza a cubrir ninguna parte de las últimas 250 semanas; ' +
            'no fue posible calcular el SBC promedio. Complétalo manualmente.',
        );
      }
    } else {
      camposFaltantes.push('SBC promedio (250 semanas)');
      advertencias.push(
        'Esta constancia no incluye el historial detallado de modificaciones salariales por patrón (solo el último SBC de cada uno), ' +
          'así que no es posible calcular tu SBC promedio de las últimas 250 semanas de forma confiable. ' +
          'Para obtenerlo automáticamente, descarga la "Constancia de Semanas Cotizadas en el IMSS e Historial de Registros Afiliatorios de la Persona Asegurada" ' +
          'desde los servicios digitales del IMSS: ' +
          'https://www.gob.mx/imss/prensa/el-imss-te-invita-a-obtener-tu-constancia-de-semanas-cotizadas-a-traves-de-sus-servicios-digitales-sin-salir-de-casa ' +
          'Mientras tanto, completa este campo manualmente.',
      );
    }

    // ─── Último patrón ───────────────────────────────────────────
    const patronMatch = text.match(/(?:último patrón|patrón)[:\s]+([^\n\r]{5,80})/i);
    if (patronMatch?.[1]) {
      datos.ultimoPatron = patronMatch[1].trim();
    }

    // ─── Sexo ───────────────────────────────────────────
    if (datos.curp) {
      // El 11° carácter de la CURP (índice 10) indica el sexo: H=masculino, M=femenino
      const sexoChar = datos.curp[10];
      if (sexoChar === 'H') datos.sexo = 'masculino';
      else if (sexoChar === 'M') datos.sexo = 'femenino';
    }

    const camposEncontrados = Object.values(datos).filter(
      (v) => v !== undefined && v !== '' && v !== null && (Array.isArray(v) ? v.length > 0 : true),
    ).length;

    if (camposFaltantes.length > 0) {
      advertencias.push(
        `No se pudieron extraer automáticamente: ${camposFaltantes.join(', ')}. Por favor completa estos campos manualmente.`,
      );
    }

    if (camposEncontrados < 3) {
      advertencias.push(
        'El PDF puede estar escaneado o en formato no compatible con la extracción automática. ' +
          'Por favor completa todos los campos manualmente.',
      );
    }

    return {
      ok: true,
      data: datos,
      advertencias,
      camposFaltantes,
    };
  },
};

/**
 * Busca la primera ocurrencia de `etiquetaRegex` y, dentro de una ventana de
 * texto posterior a ella (no necesariamente adyacente), busca `valorRegex`.
 * Necesario porque el orden de extracción de pdfjs-dist sigue el orden de
 * dibujado del PDF, que puede intercalar texto no relacionado entre una
 * etiqueta y su valor.
 */
function buscarValorTrasEtiqueta(
  text: string,
  etiquetaRegex: RegExp,
  valorRegex: RegExp,
  ventana = 200,
): string | null {
  const etiquetaMatch = text.match(etiquetaRegex);
  if (!etiquetaMatch || etiquetaMatch.index === undefined) return null;

  const inicio = etiquetaMatch.index + etiquetaMatch[0].length;
  const ventanaTexto = text.slice(inicio, inicio + ventana);
  return ventanaTexto.match(valorRegex)?.[1]?.trim() ?? null;
}

/**
 * Deriva la fecha de nacimiento a partir de los primeros 6 dígitos del CURP
 * (AAMMDD). El siglo no está codificado en el CURP, así que se infiere
 * comparando los 2 dígitos del año con el año actual (heurística estándar
 * de validadores de CURP): si son mayores al año actual de 2 dígitos, se
 * asume 19XX; si no, 20XX.
 */
function fechaNacimientoDesdeCURP(curp: string): Date | null {
  const match = curp.match(/^[A-Z]{4}(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;

  const anio2d = parseInt(match[1] as string, 10);
  const mes = parseInt(match[2] as string, 10);
  const dia = parseInt(match[3] as string, 10);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  const anioActual2d = new Date().getFullYear() % 100;
  const siglo = anio2d > anioActual2d ? 1900 : 2000;
  const fecha = new Date(siglo + anio2d, mes - 1, dia);

  // new Date hace "rollover" de días inválidos (ej. 30 de febrero); si el
  // mes resultante no coincide, la fecha original no era válida.
  if (isNaN(fecha.getTime()) || fecha.getMonth() !== mes - 1) return null;
  return fecha;
}

interface HistorialLaboralResultado {
  relaciones: RelacionLaboral[];
  /** Periodos (con su propio SBC) listos para calcularSbcPromedioPonderado. */
  periodos: PeriodoSBC[];
  /** Si el empleo más reciente no se pudo incluir por no saber su fecha de baja. */
  omitioMasReciente: boolean;
  /** Si al menos un patrón usó su tabla de movimientos (cálculo preciso) en vez de la aproximación. */
  usoDatosDetallados: boolean;
  /** Si se detectaron periodos de más de un patrón traslapados en el tiempo. */
  huboSolapamiento: boolean;
}

interface MovimientoSalarial {
  tipo: 'REINGRESO' | 'MODIFICACION' | 'BAJA';
  fecha: Date;
  salario: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Agrupa las filas de la tabla "Tipo de movimiento / Fecha de movimiento /
 * Salario Base" (REINGRESO, MODIFICACIÓN DE SALARIO, BAJA) por patrón,
 * asignando cada fila al patrón cuyo "Nombre del patrón" la antecede más de
 * cerca en el texto. No se asume que las 3 columnas de una fila queden
 * adyacentes por posición de columna vs. fila (el orden de dibujado del PDF
 * puede variar); en cambio, cada fila "TIPO FECHA $MONTO" sí se observa
 * consistentemente junta, igual que "Nombre del patrón NOMBRE".
 */
const MOVIMIENTO_REGEX =
  /(REINGRESO|MODIFICACION DE SALARIO|BAJA)\s+(\d{2})\/(\d{2})\/(\d{4})\s+\$\s*(\d{1,6}(?:[.,]\d{1,4})?)/gi;

/** Extrae las filas crudas de la tabla de movimientos en todo el documento. */
function extraerMovimientosRaw(text: string): RegExpMatchArray[] {
  return [...text.matchAll(MOVIMIENTO_REGEX)];
}

function agruparMovimientosPorPatron(
  movimientos: RegExpMatchArray[],
  patrones: RegExpMatchArray[],
): MovimientoSalarial[][] {
  const grupos: MovimientoSalarial[][] = patrones.map(() => []);

  for (const mov of movimientos) {
    if (mov.index === undefined) continue;

    let empleadorIdx = -1;
    for (const [i, p] of patrones.entries()) {
      if (p.index !== undefined && p.index <= mov.index) {
        empleadorIdx = i;
      } else {
        break;
      }
    }
    if (empleadorIdx === -1) continue;

    const tipoRaw = (mov[1] ?? '').toUpperCase();
    const tipo: MovimientoSalarial['tipo'] = tipoRaw.startsWith('REINGRESO')
      ? 'REINGRESO'
      : tipoRaw.startsWith('BAJA')
        ? 'BAJA'
        : 'MODIFICACION';
    const fecha = new Date(
      parseInt(mov[4] as string, 10),
      parseInt(mov[3] as string, 10) - 1,
      parseInt(mov[2] as string, 10),
    );
    const salario = parseFloat((mov[5] as string).replace(',', '.'));
    if (isNaN(salario) || salario <= 0) continue;

    grupos[empleadorIdx]?.push({ tipo, fecha, salario });
  }

  for (const grupo of grupos) {
    grupo.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }

  return grupos;
}

/**
 * Construye los periodos de SBC de un patrón a partir de su tabla de
 * movimientos (ya ordenada cronológicamente). Cada evento de tipo
 * REINGRESO/MODIFICACIÓN abre un periodo que termina donde empieza el
 * siguiente; el último periodo termina en la fecha de la fila BAJA (si
 * existe) o "hoy" (si el patrón está vigente). Devuelve [] si no hay
 * eventos utilizables o si no se puede determinar cuándo termina el último
 * periodo (sin BAJA y sin estar vigente).
 */
function periodosDesdeMovimientos(movimientos: MovimientoSalarial[], esVigente: boolean, hoy: Date): PeriodoSBC[] {
  const eventos = movimientos.filter((m) => m.tipo !== 'BAJA');
  if (eventos.length === 0) return [];

  const filaBaja = movimientos.find((m) => m.tipo === 'BAJA');
  const periodos: PeriodoSBC[] = [];

  for (const [i, actual] of eventos.entries()) {
    const siguiente = eventos[i + 1];
    let fin: Date;
    if (siguiente) {
      fin = new Date(siguiente.fecha.getTime() - DIA_MS);
    } else if (filaBaja) {
      fin = filaBaja.fecha;
    } else if (esVigente) {
      fin = hoy;
    } else {
      // Sin evento siguiente, sin fila BAJA y sin estar vigente: no se sabe
      // cuándo terminó este último periodo salarial. Se omite por seguridad
      // en vez de adivinar.
      continue;
    }
    if (fin.getTime() < actual.fecha.getTime()) continue;
    periodos.push({ fechaInicio: actual.fecha, fechaFin: fin, sbc: actual.salario });
  }

  return periodos;
}

/** Detecta si algún par de periodos (de distintos patrones) se traslapa en el tiempo. */
function detectarSolapamiento(periodos: PeriodoSBC[]): boolean {
  const ordenados = [...periodos].sort((a, b) => a.fechaInicio.getTime() - b.fechaInicio.getTime());
  let finMax = -Infinity;
  for (const p of ordenados) {
    if (p.fechaInicio.getTime() < finMax) return true;
    finMax = Math.max(finMax, p.fechaFin.getTime());
  }
  return false;
}

/**
 * Reconstruye el historial laboral (patrón, fechas, SBC) a partir de la
 * Constancia de Semanas Cotizadas, y los periodos de SBC para el promedio
 * ponderado de las últimas 250 semanas.
 *
 * Para cada patrón se intenta primero la reconstrucción PRECISA a partir de
 * su tabla de movimientos (REINGRESO / MODIFICACIÓN DE SALARIO / BAJA),
 * cuando el documento la incluye. Si no está disponible, se cae a una
 * APROXIMACIÓN de un solo periodo con el SBC del encabezado del patrón (ese
 * encabezado solo trae el ÚLTIMO SBC registrado, no el historial completo).
 *
 * Estrategia para el encabezado de cada patrón: "Fecha de alta", los montos
 * "$" y "Nombre del patrón" quedan de forma fiable en el mismo orden
 * relativo en el texto extraído (a diferencia de "Fecha de baja", cuyo
 * valor puede quedar intercalado en cualquier parte por el orden de
 * dibujado del PDF). Se toman esas listas en orden y se emparejan por
 * posición; en la aproximación, la fecha de baja de cada patrón (salvo el
 * más reciente) se infiere como el día anterior al alta del patrón
 * siguiente, asumiendo que no hubo huecos entre empleos. El patrón más
 * reciente se considera vigente (baja = hoy) solo si el texto contiene la
 * palabra "Vigente"; si no, se omite del historial reconstruido por no
 * poder determinar cuándo terminó.
 */
function extraerHistorialLaboral(text: string): HistorialLaboralResultado {
  const altas = [...text.matchAll(/fecha de alta\s+(\d{2})\/(\d{2})\/(\d{4})/gi)];
  const patrones = [...text.matchAll(/nombre del patr[oó]n\s+([^\n\r]{2,80})/gi)];
  const registros = [...text.matchAll(/registro patronal\s+(\S+)/gi)];

  const movimientosRaw = extraerMovimientosRaw(text);
  const rangosMovimientos = movimientosRaw
    .filter((m): m is RegExpMatchArray & { index: number } => m.index !== undefined)
    .map((m) => [m.index, m.index + m[0].length] as const);
  const dentroDeMovimiento = (idx: number) => rangosMovimientos.some(([ini, fin]) => idx >= ini && idx < fin);

  // Los montos "$" de la tabla de movimientos (REINGRESO/MODIFICACIÓN/BAJA)
  // no cuentan como el SBC de encabezado de cada patrón.
  const sbcs = [...text.matchAll(/\$\s*(\d{1,6}(?:[.,]\d{1,4})?)/g)].filter(
    (m) => m.index === undefined || !dentroDeMovimiento(m.index),
  );

  const n = altas.length;
  if (n === 0 || sbcs.length !== n || patrones.length !== n) {
    // Las listas no cuadran: el documento no sigue la estructura esperada
    // (o hay más/menos patrones de los detectados). Evitar adivinar.
    return { relaciones: [], periodos: [], omitioMasReciente: false, usoDatosDetallados: false, huboSolapamiento: false };
  }

  const movimientosPorPatron = agruparMovimientosPorPatron(movimientosRaw, patrones);
  const esVigenteGlobal = /\bvigente\b/i.test(text);
  const hoy = new Date();
  const fechaAltaDe = (m: RegExpMatchArray) =>
    new Date(parseInt(m[3] as string, 10), parseInt(m[2] as string, 10) - 1, parseInt(m[1] as string, 10));

  const relaciones: RelacionLaboral[] = [];
  const periodos: PeriodoSBC[] = [];
  let omitioMasReciente = false;
  let usoDatosDetallados = false;

  for (let i = 0; i < n; i++) {
    const altaMatch = altas[i];
    const sbcMatch = sbcs[i];
    const patronMatch = patrones[i];
    if (!altaMatch || !sbcMatch || !patronMatch) continue;

    const fechaAlta = fechaAltaDe(altaMatch);
    const esVigente = i === 0 && esVigenteGlobal;
    const sbcHeader = parseFloat((sbcMatch[1] as string).replace(',', '.'));

    const periodosDetallados = periodosDesdeMovimientos(movimientosPorPatron[i] ?? [], esVigente, hoy);

    let periodosEmpleador: PeriodoSBC[];
    let fechaBaja: Date | undefined;

    if (periodosDetallados.length > 0) {
      usoDatosDetallados = true;
      periodosEmpleador = periodosDetallados;
      fechaBaja = periodosDetallados[periodosDetallados.length - 1]?.fechaFin;
    } else {
      if (esVigente) {
        fechaBaja = hoy;
      } else if (i === 0) {
        omitioMasReciente = true;
        continue;
      } else {
        const altaAnterior = altas[i - 1];
        if (!altaAnterior) continue;
        fechaBaja = new Date(fechaAltaDe(altaAnterior).getTime() - DIA_MS);
      }
      if (isNaN(sbcHeader) || sbcHeader <= 0) continue;
      periodosEmpleador = [{ fechaInicio: fechaAlta, fechaFin: fechaBaja, sbc: sbcHeader }];
    }

    periodos.push(...periodosEmpleador);

    const registroMatch = registros[i];
    relaciones.push({
      nombrePatron: patronMatch[1]?.trim() ?? '',
      registroPatronal: registroMatch?.[1] ?? '',
      fechaAlta,
      fechaBaja,
      salarioBaseCotizacion: !isNaN(sbcHeader) && sbcHeader > 0 ? sbcHeader : periodosEmpleador[periodosEmpleador.length - 1]!.sbc,
      tipoMovimiento: '',
      diasCotizados: fechaBaja ? Math.max(0, Math.round((fechaBaja.getTime() - fechaAlta.getTime()) / DIA_MS)) : 0,
    });
  }

  return {
    relaciones,
    periodos,
    omitioMasReciente,
    usoDatosDetallados,
    huboSolapamiento: detectarSolapamiento(periodos),
  };
}

/** Normaliza un candidato a nombre y descarta los que claramente no lo son. */
function limpiarCandidatoNombre(candidato: string | undefined): string | null {
  if (!candidato) return null;
  const limpio = candidato.split('\n')[0]?.trim().replace(/\s+/g, ' ') ?? '';
  if (limpio.length < 5 || limpio.length > 80) return null;
  if (/patr[oó]n|registro|entidad|federativa/i.test(limpio)) return null;
  return limpio.toUpperCase();
}

/**
 * Extrae el nombre del asegurado probando varias estrategias en orden de
 * confiabilidad, ya que el orden de texto extraído no es fiable como
 * indicador de adyacencia visual (ver nota en el llamador).
 */
function extraerNombre(text: string): string | null {
  // 1. Campos estructurados de la "cadena original" del sello digital
  //    (Apellido Paterno / Apellido Materno / Nombre del Asegurado).
  //    Es la fuente más confiable cuando está presente.
  const apPaterno = text.match(/apellido\s*paterno\s*:\s*([a-záéíóúñ]+)/i)?.[1];
  const apMaterno = text.match(/apellido\s*materno\s*:\s*([a-záéíóúñ]+)/i)?.[1];
  const nombreAsegurado = text.match(/nombre\s*del\s*asegurado\s*:\s*([a-záéíóúñ]+)/i)?.[1];
  if (nombreAsegurado || apPaterno || apMaterno) {
    const completo = [nombreAsegurado, apPaterno, apMaterno].filter(Boolean).join(' ');
    const limpio = limpiarCandidatoNombre(completo);
    if (limpio) return limpio;
  }

  // 2. El nombre puede aparecer intercalado entre la etiqueta "NSS:" y su
  //    valor numérico (ver nota en el llamador sobre el orden de extracción).
  const entreNssYValor = text.match(/nss[:\s]*\n?\s*([a-záéíóúñü ]{5,60})\n?\s*\d{10,11}/i)?.[1];
  const candidatoNss = limpiarCandidatoNombre(entreNssYValor);
  if (candidatoNss) return candidatoNss;

  // 3. Saludo "Estimado(a), NOMBRE" (formato de constancia de semanas).
  const saludo = text.match(/estimado\(a\)[,:]?\s*([a-záéíóúñü ]{5,60})/i)?.[1];
  const candidatoSaludo = limpiarCandidatoNombre(saludo);
  if (candidatoSaludo) return candidatoSaludo;

  // 4. Etiqueta explícita "Nombre:" / "Trabajador:" (otros tipos de
  //    documento). Se excluye "Nombre del patrón" para no confundir el
  //    nombre del asegurado con el de un empleador.
  const etiqueta = text.match(/\b(?:nombre|trabajador)\b(?!\s*del\s*patr)[:\s]+([a-záéíóúñü ]{5,60})/i)?.[1];
  const candidatoEtiqueta = limpiarCandidatoNombre(etiqueta);
  if (candidatoEtiqueta) return candidatoEtiqueta;

  return null;
}

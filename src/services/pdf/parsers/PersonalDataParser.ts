/**
 * Parser de datos personales de la Constancia de Semanas Cotizadas del IMSS.
 * Implementa el patrón Strategy para permitir agregar otros parsers de documentos.
 *
 * NOTA: El IMSS puede cambiar el formato del documento. Este parser se basa
 * en los patrones comunes observados en constancias digitales (no escaneadas).
 */
import type { DatosExtraidos, ParseResult, DocumentType } from '../../../models';

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

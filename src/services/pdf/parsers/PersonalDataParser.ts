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
    const nombreMatch = text.match(/(?:nombre[:\s]+|trabajador[:\s]+)([A-ZÁÉÍÓÚÑÜ ]{5,60})/i);
    if (nombreMatch?.[1]) {
      datos.nombre = nombreMatch[1].trim();
    } else {
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
    const nssMatch = text.match(/(?:nss|n\.s\.s\.|número de seguridad social)[:\s]*(\d{10,11})/i);
    if (nssMatch?.[1]) {
      datos.nss = nssMatch[1].trim();
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
    const sbcMatch = text.match(
      /(?:salario base de cotización|sbc|último salario)[:\s]*\$?\s*(\d{1,6}(?:[.,]\d{1,4})?)/i,
    );
    if (sbcMatch?.[1]) {
      const valor = parseFloat(sbcMatch[1].replace(',', '.'));
      if (!isNaN(valor) && valor > 0) {
        datos.ultimoSBC = valor;
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
      // El 10° carácter de la CURP indica el sexo: H=masculino, M=femenino
      const sexoChar = datos.curp[9];
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

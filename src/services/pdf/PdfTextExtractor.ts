/**
 * PdfTextExtractor (nativo) — extracción heurística de texto de un PDF.
 *
 * No hay parser real de PDF disponible en Expo Go sin development build,
 * así que se hace un escaneo de cadenas de texto legibles sobre los bytes
 * del PDF. NO decodifica streams comprimidos (FlateDecode), por lo que
 * solo encuentra texto en PDFs sin comprimir o texto suelto fuera de
 * streams (metadatos). La contraparte web (PdfTextExtractor.web.ts) usa
 * pdfjs-dist y sí decodifica streams comprimidos correctamente.
 */
export async function extractPdfText(base64: string): Promise<string> {
  try {
    const binary = atob(base64);

    const visibleText = binary.match(/[\x20-\x7E\xC0-\xFF]{4,}/g);
    if (!visibleText) return '';

    return visibleText
      .filter(
        (s) =>
          /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]{2,}/.test(s) &&
          !s.startsWith('/') && // Operadores PDF
          s.length < 200,
      )
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

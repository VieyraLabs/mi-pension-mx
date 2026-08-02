/**
 * PdfTextExtractor (web) — extracción real de texto de un PDF con pdfjs-dist.
 *
 * A diferencia del fallback nativo (PdfTextExtractor.ts), aquí sí se
 * decodifican streams comprimidos (FlateDecode) y fuentes embebidas, por lo
 * que funciona con PDFs generados por herramientas estándar como las
 * constancias del IMSS.
 *
 * El worker de pdfjs-dist se sirve como archivo estático desde /public
 * (public/pdfjs/pdf.worker.min.js) para no depender de un CDN externo.
 */
// pdfjs-dist v5+ es ESM-only (ya no publica un build "legacy" CJS).
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function extractPdfText(base64: string): Promise<string> {
  const bytes = base64ToUint8Array(base64);
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

  const textByPage: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    textByPage.push(text);
  }

  return textByPage.join('\n').replace(/[ \t]+/g, ' ').trim();
}

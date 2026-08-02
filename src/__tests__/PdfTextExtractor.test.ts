/**
 * Pruebas del extractor de texto nativo (heurístico, sin pdfjs-dist).
 * Solo encuentra texto legible fuera de streams comprimidos — ver el
 * comentario de cabecera de PdfTextExtractor.ts.
 *
 * Para ejecutar: npm test
 */
import { extractPdfText } from '../services/pdf/PdfTextExtractor';

function toBase64(text: string): string {
  return btoa(text);
}

describe('extractPdfText (nativo)', () => {
  test('extrae texto legible suelto (no comprimido) del PDF', async () => {
    const raw = 'Nombre del asegurado JUAN PEREZ LOPEZ /Type /Catalog';
    const result = await extractPdfText(toBase64(raw));

    expect(result).toContain('Nombre del asegurado JUAN PEREZ LOPEZ');
  });

  test('descarta tokens que empiezan con "/" (operadores PDF)', async () => {
    // El salto de línea separa el operador PDF de el texto legible en
    // tokens distintos — la regex de extracción no cruza saltos de línea.
    const raw = '/Type /Catalog\nConstancia IMSS';
    const result = await extractPdfText(toBase64(raw));

    expect(result).not.toContain('/Type');
    expect(result).toContain('Constancia IMSS');
  });

  test('devuelve cadena vacía si no hay texto legible', async () => {
    const raw = '\x00\x01\x02\x03';
    const result = await extractPdfText(toBase64(raw));

    expect(result).toBe('');
  });

  test('devuelve cadena vacía ante un base64 inválido, sin lanzar', async () => {
    await expect(extractPdfText('no-es-base64-válido-!!!')).resolves.toBe('');
  });
});

/**
 * Pruebas de PdfImporter (selección de archivo + extracción de texto).
 * Mockea expo-document-picker, expo-file-system/legacy y PdfTextExtractor
 * para no depender de un dispositivo real.
 *
 * Para ejecutar: npm test
 */
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('../services/pdf/PdfTextExtractor', () => ({
  extractPdfText: jest.fn(),
}));

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { extractPdfText } from '../services/pdf/PdfTextExtractor';
import { importPdf } from '../services/pdf/PdfImporter';

const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const mockGetInfoAsync = FileSystem.getInfoAsync as jest.Mock;
const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
const mockExtractPdfText = extractPdfText as jest.Mock;

const LONG_TEXT = 'A'.repeat(60);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('importPdf', () => {
  test('devuelve error si el selector de archivos falla', async () => {
    mockGetDocumentAsync.mockRejectedValue(new Error('boom'));

    const result = await importPdf();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('No se pudo abrir el selector de archivos.');
  });

  test('devuelve error si el usuario cancela la selección', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    const result = await importPdf();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('No se seleccionó ningún archivo.');
  });

  test('pide explícitamente base64 al selector de archivos (necesario en web)', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    await importPdf();

    expect(mockGetDocumentAsync).toHaveBeenCalledWith(
      expect.objectContaining({ base64: true }),
    );
  });

  test('extrae el texto de una data: URL (flujo web) y lo devuelve cuando es suficiente', async () => {
    const base64 = 'Y29udGVuaWRvLWRlLXBydWViYQ==';
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: `data:application/pdf;base64,${base64}` }],
    });
    mockExtractPdfText.mockResolvedValue(LONG_TEXT);

    const result = await importPdf();

    expect(result.ok).toBe(true);
    expect(result.data?.extractedText).toBe(LONG_TEXT);
    expect(result.missingFields).toEqual([]);
    expect(mockExtractPdfText).toHaveBeenCalledWith(base64);
  });

  test('en web, lee el contenido de asset.base64 aunque asset.uri sea un blob: URL', async () => {
    // Regresión: expo-document-picker@57 en web devuelve `uri` como
    // blob:... (URL.createObjectURL) sin el contenido del archivo; el
    // data: URL real solo llega en `asset.base64` cuando se pide
    // explícitamente `base64: true`.
    const base64 = 'Y29udGVuaWRvLWRlLXBydWViYQ==';
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'blob:http://localhost:8081/1234-5678',
          base64: `data:application/pdf;base64,${base64}`,
        },
      ],
    });
    mockExtractPdfText.mockResolvedValue(LONG_TEXT);

    const result = await importPdf();

    expect(result.ok).toBe(true);
    expect(result.data?.extractedText).toBe(LONG_TEXT);
    expect(mockExtractPdfText).toHaveBeenCalledWith(base64);
  });

  test('pide captura manual cuando el texto extraído es demasiado corto', async () => {
    const base64 = 'eA==';
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: `data:application/pdf;base64,${base64}` }],
    });
    mockExtractPdfText.mockResolvedValue('muy corto');

    const result = await importPdf();

    expect(result.ok).toBe(true);
    expect(result.data?.extractedText).toBe('');
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/escaneado/i);
  });

  test('reporta error de lectura si el archivo nativo no se descargó por completo', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/constancia.pdf' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 0 });

    const result = await importPdf();

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no se descargó por completo/i);
    expect(mockReadAsStringAsync).not.toHaveBeenCalled();
  });

  test('lee el archivo nativo y extrae el texto cuando todo sale bien', async () => {
    const base64 = 'Y29udGVuaWRvLW5hdGl2bw==';
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/constancia.pdf' }],
    });
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1234 });
    mockReadAsStringAsync.mockResolvedValue(base64);
    mockExtractPdfText.mockResolvedValue(LONG_TEXT);

    const result = await importPdf();

    expect(result.ok).toBe(true);
    expect(result.data?.extractedText).toBe(LONG_TEXT);
    expect(mockReadAsStringAsync).toHaveBeenCalledWith('file:///tmp/constancia.pdf', {
      encoding: 'base64',
    });
  });
});

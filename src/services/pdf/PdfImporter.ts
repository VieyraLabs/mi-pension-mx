/**
 * PdfImporter — Servicio de importación de documentos PDF.
 * Coordina la selección del archivo, extracción de texto y parsing.
 *
 * Estrategia de extracción:
 * 1. Seleccionar el archivo PDF desde el dispositivo (expo-document-picker)
 * 2. Intentar extracción de texto digital directo (PdfTextExtractor — real
 *    con pdfjs-dist en web, heurístico en nativo sin development build)
 * 3. Si el texto es vacío/insuficiente → informar que el PDF puede estar
 *    escaneado o requerir entrada manual
 * 4. Devolver resultado con texto extraído o solicitar entrada manual
 */
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
// Se usa explícitamente la API "legacy" (async, basada en URIs): expo-file-system
// v57+ cambió su export principal a una API nueva basada en clases (File/Directory).
import * as FileSystem from 'expo-file-system/legacy';
import type { ParseResult } from '../../models';
import { extractPdfText } from './PdfTextExtractor';

export interface ImportResult {
  extractedText: string;
  isOCR: boolean;
  warnings: string[];
}

/**
 * Abre el selector de archivos y extrae el texto del PDF.
 * Para PDFs digitales con texto seleccionable intenta extracción directa.
 * Para PDFs escaneados informa la limitación y permite entrada manual.
 */
export async function importPdf(): Promise<ParseResult<ImportResult>> {
  // 1. Seleccionar el archivo PDF
  let fileResult: DocumentPicker.DocumentPickerResult;
  try {
    fileResult = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      // En web, expo-document-picker@57 solo llena `asset.base64` (como
      // data: URL) cuando se pide explícitamente; sin esto, `asset.uri`
      // es un blob: URL (URL.createObjectURL) que no trae el contenido
      // del archivo de forma legible.
      base64: true,
    });
  } catch {
    return {
      ok: false,
      error: 'No se pudo abrir el selector de archivos.',
      warnings: [],
      missingFields: [],
    };
  }

  if (fileResult.canceled || !fileResult.assets?.[0]) {
    return {
      ok: false,
      error: 'No se seleccionó ningún archivo.',
      warnings: [],
      missingFields: [],
    };
  }

  const asset = fileResult.assets[0];
  const uri = asset.uri;
  // En web, expo-document-picker@57 entrega el contenido como data: URL en
  // `asset.base64` (solicitado explícitamente arriba con `base64: true`);
  // `asset.uri` en web es un blob: URL (URL.createObjectURL) sin el
  // contenido del archivo. En nativo, `asset.base64` no existe.
  const dataUrl = asset.base64 ?? (uri.startsWith('data:') ? uri : undefined);

  // 2. Leer el contenido del archivo como base64.
  // En web no se usa expo-file-system (es un shim sin acceso real al
  // filesystem), por lo que ahí se extrae el base64 directamente del
  // data: URL en vez de usar FileSystem.
  let base64Content: string;
  if (Platform.OS === 'web' || dataUrl) {
    const match = dataUrl?.match(/^data:[^;]*;base64,(.*)$/);
    if (!match?.[1]) {
      return {
        ok: false,
        error: 'No se pudo leer el archivo PDF. Verifica que el archivo sea válido.',
        warnings: [],
        missingFields: [],
      };
    }
    base64Content = match[1];
  } else {
    // Verificar que el archivo exista localmente y tenga contenido.
    // Nota: si el PDF se eligió desde iCloud Drive / Google Drive y aún no se
    // descargó al dispositivo, copyToCacheDirectory puede devolver un archivo
    // de 0 bytes en lugar de lanzar un error.
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || info.size === 0) {
        return {
          ok: false,
          error:
            'El archivo no se descargó por completo al dispositivo (frecuente con PDFs en iCloud Drive u otro almacenamiento en la nube). ' +
            'Ábrelo primero en la app Archivos para descargarlo y vuelve a intentarlo.',
          warnings: [],
          missingFields: [],
        };
      }
    } catch (e) {
      console.error('[PdfImporter] Error al verificar el archivo:', e);
    }

    try {
      base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } catch (e) {
      console.error('[PdfImporter] Error al leer el archivo PDF:', e);
      const detail = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        error: `No se pudo leer el archivo PDF. Verifica que el archivo sea válido. (${detail})`,
        warnings: [],
        missingFields: [],
      };
    }
  }

  // 3. Extraer texto del PDF digital.
  // En web se usa pdfjs-dist (decodifica streams comprimidos y fuentes
  // embebidas). En nativo (sin development build) se usa un fallback
  // heurístico que solo funciona con PDFs no comprimidos.
  let extractedText: string;
  try {
    extractedText = await extractPdfText(base64Content);
  } catch (e) {
    console.error('[PdfImporter] Error al extraer texto del PDF:', e);
    extractedText = '';
  }
  const warnings: string[] = [];

  if (!extractedText || extractedText.trim().length < 50) {
    warnings.push(
      Platform.OS === 'web'
        ? 'El PDF parece estar escaneado (imagen) o no contiene texto seleccionable. ' +
          'Por favor ingresa los datos manualmente.'
        : 'El PDF parece estar escaneado o no contiene texto seleccionable. ' +
          'La extracción automática completa no está disponible para este tipo de PDF en Expo Go. ' +
          'Por favor ingresa los datos manualmente.',
    );
    // Devolver texto vacío pero con advertencia — el usuario ingresará manualmente
    return {
      ok: true,
      data: {
        extractedText: '',
        isOCR: false,
        warnings,
      },
      warnings,
      missingFields: ['Nombre', 'CURP', 'NSS', 'Semanas cotizadas', 'SBC'],
    };
  }

  return {
    ok: true,
    data: {
      extractedText,
      isOCR: false,
      warnings,
    },
    warnings,
    missingFields: [],
  };
}

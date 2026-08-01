/**
 * PdfImporter — Servicio de importación de documentos PDF.
 * Coordina la selección del archivo, extracción de texto y parsing.
 *
 * Estrategia de extracción:
 * 1. Seleccionar el archivo PDF desde el dispositivo (expo-document-picker)
 * 2. Intentar extracción de texto digital directo (PdfTextExtractor)
 * 3. Si el texto es vacío/insuficiente → informar que OCR requiere development build
 * 4. Devolver resultado con texto extraído o solicitar entrada manual
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import type { ParseResult } from '../../models';

export interface ImportResult {
  textoExtraido: string;
  esOCR: boolean;
  advertencias: string[];
}

/**
 * Abre el selector de archivos y extrae el texto del PDF.
 * Para PDFs digitales con texto seleccionable intenta extracción directa.
 * Para PDFs escaneados informa la limitación y permite entrada manual.
 */
export async function importarPDF(): Promise<ParseResult<ImportResult>> {
  // 1. Seleccionar el archivo PDF
  let fileResult: DocumentPicker.DocumentPickerResult;
  try {
    fileResult = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
  } catch {
    return {
      ok: false,
      error: 'No se pudo abrir el selector de archivos.',
      advertencias: [],
      camposFaltantes: [],
    };
  }

  if (fileResult.canceled || !fileResult.assets?.[0]) {
    return {
      ok: false,
      error: 'No se seleccionó ningún archivo.',
      advertencias: [],
      camposFaltantes: [],
    };
  }

  const asset = fileResult.assets[0];
  const uri = asset.uri;

  // 2. Leer el contenido del archivo como base64
  let contenidoBase64: string;
  try {
    contenidoBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return {
      ok: false,
      error: 'No se pudo leer el archivo PDF. Verifica que el archivo sea válido.',
      advertencias: [],
      camposFaltantes: [],
    };
  }

  // 3. Extraer texto del PDF digital
  // En Expo Go sin módulos nativos, intentamos extracción básica de texto
  // de PDFs que contienen texto embebido (no escaneados)
  const textoExtraido = extraerTextoBasico(contenidoBase64);
  const advertencias: string[] = [];

  if (!textoExtraido || textoExtraido.trim().length < 50) {
    advertencias.push(
      'El PDF parece estar escaneado o no contiene texto seleccionable. ' +
        'La extracción automática no está disponible para este tipo de PDF en Expo Go. ' +
        'Por favor ingresa los datos manualmente.',
    );
    // Devolver texto vacío pero con advertencia — el usuario ingresará manualmente
    return {
      ok: true,
      data: {
        textoExtraido: '',
        esOCR: false,
        advertencias,
      },
      advertencias,
      camposFaltantes: ['Nombre', 'CURP', 'NSS', 'Semanas cotizadas', 'SBC'],
    };
  }

  return {
    ok: true,
    data: {
      textoExtraido,
      esOCR: false,
      advertencias,
    },
    advertencias,
    camposFaltantes: [],
  };
}

/**
 * Extracción básica de texto de un PDF en base64.
 * Solo funciona para PDFs digitales (no escaneados) que tienen texto embebido.
 * Busca cadenas de texto legibles decodificando el base64 a texto.
 *
 * NOTA: Esta implementación es una aproximación simplificada.
 * Para extracción completa se requiere pdfjs-dist (via WebView) o un dev build.
 */
function extraerTextoBasico(base64: string): string {
  try {
    // Decodificar base64 a string binario
    const binario = atob(base64);

    // Extraer texto legible usando regex que busca cadenas ASCII imprimibles
    // en el contenido del PDF (texto embebido en PDFs digitales)
    const textoVisible = binario.match(/[\x20-\x7E\xC0-\xFF]{4,}/g);
    if (!textoVisible) return '';

    return textoVisible
      .filter(
        (s) =>
          // Filtrar cadenas que parecen texto real (no datos binarios)
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

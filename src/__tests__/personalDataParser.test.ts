/**
 * Pruebas del parser de datos personales de la Constancia de Semanas
 * Cotizadas del IMSS.
 *
 * El texto de prueba replica el orden real de extracción de pdfjs-dist
 * para este documento (orden de dibujado del content stream, NO el orden
 * visual de lectura): el nombre aparece intercalado entre "NSS:" y su
 * valor, y "Entidad federativa" se intercala entre la etiqueta de SBC y su
 * monto. Los datos (nombre, CURP, NSS) son sintéticos.
 */
import { ConstanciaIMSSParser } from '../services/pdf/parsers/PersonalDataParser';

const TEXTO_CONSTANCIA = `Instituto Mexicano del Seguro Social
DD MM YYYY
Tu detalle de semanas cotizadas
Constancia de Semanas Cotizadas en el IMSS e
historial de registros afiliatorios de la persona asegurada
800
NSS:
PEREZ LOPEZ JUAN
12345678901
CURP: XEXX010101HNEXXX04
Semanas Reintegradas (+) Semanas Descontadas
(por disposición de recursos) (-)
800 0 0
Semanas cotizadas IMSS
Estimado(a),
Total de semanas cotizadas
Fecha de emisión del reporte
29 / 05 / 2025
Tu historia laboral
Vigente
CIUDAD DE MÉXICO
Fecha de alta 16/01/2021 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 500.0
Nombre del patrón EMPRESA DE PRUEBA SA DE CV
Registro Patronal Y549999940
/* Valor del último salario base de cotización diario en pesos.
15/01/2021
CIUDAD DE MÉXICO
Fecha de alta 01/07/2018 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 200.0
Nombre del patrón OTRA EMPRESA SA DE CV
Registro Patronal Y584460910

|||Origen de Trámite:Móvil (M)|Tipo Trámite:CONSTANCIA DE SEMANAS COTIZADAS|Fecha:29 de mayo 2025, 09:45:29|Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Folio:17485335292831411793011|Número total de semanas cotizadas:800||`;

describe('ConstanciaIMSSParser', () => {
  test('extrae el nombre desde los campos de la cadena original, no desde "Nombre del patrón"', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.nombre).toBe('JUAN PEREZ LOPEZ');
  });

  test('extrae el NSS aunque el nombre esté intercalado antes del valor', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.nss).toBe('12345678901');
  });

  test('extrae el CURP', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.curp).toBe('XEXX010101HNEXXX04');
  });

  test('extrae las semanas cotizadas totales', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.semanasTotales).toBe(800);
  });

  test('extrae el último SBC (el del registro más reciente) aunque "Entidad federativa" se intercale antes del monto', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.ultimoSBC).toBe(500);
  });

  test('extrae el sexo desde el 10° carácter del CURP', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.sexo).toBe('masculino');
  });

  test('marca Fecha de nacimiento como faltante cuando el documento no la incluye', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.camposFaltantes).toContain('Fecha de nacimiento');
  });

  test('no confunde "Nombre del patrón" con el nombre del asegurado cuando no hay cadena original', () => {
    const sinCadenaOriginal = TEXTO_CONSTANCIA.split('|||Origen de Trámite')[0] ?? '';
    const result = ConstanciaIMSSParser.parse(sinCadenaOriginal);
    expect(result.data?.nombre).not.toMatch(/patrón|EMPRESA/i);
  });
});

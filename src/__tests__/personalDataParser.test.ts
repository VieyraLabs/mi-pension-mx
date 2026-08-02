/**
 * Pruebas del parser de datos personales de la Constancia de Semanas
 * Cotizadas del IMSS.
 *
 * El texto de prueba replica el orden real de extracción de pdfjs-dist
 * para este documento (orden de dibujado del content stream, NO el orden
 * visual de lectura): el nombre aparece intercalado entre "NSS:" y su
 * valor, y texto no relacionado (incluyendo fechas) puede intercalarse
 * entre la etiqueta de SBC y su monto — por eso el SBC se busca anclado al
 * signo "$" en vez de a la etiqueta. Los datos (nombre, CURP, NSS) son
 * sintéticos.
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
    expect(result.data?.name).toBe('JUAN PEREZ LOPEZ');
  });

  test('extrae un "Nombre del Asegurado" de más de una palabra completo (no solo la primera)', () => {
    const conNombreCompuesto = TEXTO_CONSTANCIA.replace(
      'Nombre del Asegurado:JUAN',
      'Nombre del Asegurado:ALAN FERNANDO',
    );
    const result = ConstanciaIMSSParser.parse(conNombreCompuesto);
    expect(result.data?.name).toBe('ALAN FERNANDO PEREZ LOPEZ');
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
    expect(result.data?.totalWeeks).toBe(800);
  });

  test('extrae el último SBC (el del registro más reciente) aunque "Entidad federativa" se intercale antes del monto', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.lastSBC).toBe(500);
  });

  test('extrae el último SBC aunque una fecha quede entre la etiqueta y el monto (no confunde el día con el SBC)', () => {
    // Orden en el que la etiqueta antecede a la fecha (en vez de sucederla),
    // como ocurrió en un caso real: sin anclar al signo "$", una búsqueda
    // "primer número después de la etiqueta" capturaría "16" de la fecha.
    const textoConFechaTrasEtiqueta = `Vigente
CIUDAD DE MÉXICO
Salario Base de Cotización */
Fecha de alta 16/01/2021 Fecha de baja
Entidad federativa
$ 2172.0
Nombre del patrón EMPRESA DE PRUEBA SA DE CV`;
    const result = ConstanciaIMSSParser.parse(textoConFechaTrasEtiqueta);
    expect(result.data?.lastSBC).toBe(2172);
  });

  test('extrae el sexo desde el 10° carácter del CURP', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.sex).toBe('masculino');
  });

  test('deriva la fecha de nacimiento del CURP cuando el documento no la incluye directamente', () => {
    // CURP de prueba "XEXX010101...": los primeros 6 dígitos (AAMMDD) son
    // 01/01/01 → como este documento no trae un campo explícito de fecha de
    // nacimiento, se deriva del CURP en vez de quedar como faltante.
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.missingFields).not.toContain('Fecha de nacimiento');
    expect(result.data?.birthDate?.getFullYear()).toBe(2001);
    expect(result.data?.birthDate?.getMonth()).toBe(0);
    expect(result.data?.birthDate?.getDate()).toBe(1);
    expect(result.warnings.some((a) => /fecha de nacimiento.*curp/i.test(a))).toBe(true);
  });

  test('marca Fecha de nacimiento como faltante cuando tampoco hay CURP para derivarla', () => {
    const sinCurp = TEXTO_CONSTANCIA.replace('CURP: XEXX010101HNEXXX04', '');
    const result = ConstanciaIMSSParser.parse(sinCurp);
    expect(result.missingFields).toContain('Fecha de nacimiento');
  });

  test('no confunde "Nombre del patrón" con el nombre del asegurado cuando no hay cadena original', () => {
    const sinCadenaOriginal = TEXTO_CONSTANCIA.split('|||Origen de Trámite')[0] ?? '';
    const result = ConstanciaIMSSParser.parse(sinCadenaOriginal);
    expect(result.data?.name).not.toMatch(/patrón|EMPRESA/i);
  });
});

// ─────────────────────────────────────────────
// Historial laboral y SBC promedio (aproximado)
// ─────────────────────────────────────────────
//
// Nota sobre determinismo: estas pruebas usan una fecha de alta fija muy en
// el pasado (16/01/2021) para el patrón "Vigente", cuya antigüedad ya supera
// las 250 semanas y seguirá superándolas siempre (el pasado no cambia), así
// que el resultado no depende de la fecha real en la que corra la prueba.

describe('ConstanciaIMSSParser — historial laboral y SBC promedio', () => {
  test('reconstruye el historial laboral infiriendo la fecha de baja de cada patrón', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    const relaciones = result.data?.employmentRelations ?? [];
    expect(relaciones).toHaveLength(2);

    expect(relaciones[0]?.employerName).toBe('EMPRESA DE PRUEBA SA DE CV');
    expect(relaciones[0]?.contributionBaseSalary).toBe(500);
    expect(relaciones[0]?.startDate.toISOString().split('T')[0]).toBe('2021-01-16');
    // Vigente: sin patrón más reciente después, la fecha de baja es "hoy".

    expect(relaciones[1]?.employerName).toBe('OTRA EMPRESA SA DE CV');
    expect(relaciones[1]?.contributionBaseSalary).toBe(200);
    expect(relaciones[1]?.startDate.toISOString().split('T')[0]).toBe('2018-07-01');
    // Inferida como un día antes del alta del siguiente patrón (16/01/2021).
    expect(relaciones[1]?.endDate?.toISOString().split('T')[0]).toBe('2021-01-15');
  });

  test('no calcula ningún SBC promedio cuando la constancia no trae el historial detallado de modificaciones', () => {
    // Sin la tabla de movimientos (REINGRESO/MODIFICACIÓN/BAJA) por patrón,
    // no se debe inventar un número aproximado: se deja en blanco y se pide
    // la constancia correcta.
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.data?.averageSBC).toBeUndefined();
    expect(result.missingFields).toContain('SBC promedio (250 semanas)');
    expect(
      result.warnings.some((a) => /no incluye el historial detallado de modificaciones salariales/i.test(a)),
    ).toBe(true);
    expect(
      result.warnings.some((a) =>
        a.includes('Constancia de Semanas Cotizadas e Historial de Registros Afiliatorios'),
      ),
    ).toBe(true);
    // El aviso no debe incrustar una URL cruda — solo el nombre del documento a solicitar.
    expect(result.warnings.some((a) => a.includes('http'))).toBe(false);
  });

  test('omite el patrón más reciente del cálculo si no está marcado "Vigente" (no se sabe cuándo terminó)', () => {
    const sinVigente = TEXTO_CONSTANCIA.replace('Vigente\n', '');
    const result = ConstanciaIMSSParser.parse(sinVigente);
    const relaciones = result.data?.employmentRelations ?? [];

    expect(relaciones).toHaveLength(1);
    expect(relaciones[0]?.employerName).toBe('OTRA EMPRESA SA DE CV');
    expect(
      result.warnings.some((a) => /no se pudo determinar cuándo terminó tu empleo más reciente/i.test(a)),
    ).toBe(true);
  });

  test('no reconstruye el historial si las etiquetas no cuadran en cantidad (evita adivinar)', () => {
    // Un "$" de más (p. ej. un monto que no es un SBC) rompe el supuesto de
    // que cada patrón tiene exactamente un alta, un monto y un nombre.
    const textoConMontoExtra = TEXTO_CONSTANCIA.replace('$ 500.0', '$ 500.0\n$ 999.0');
    const result = ConstanciaIMSSParser.parse(textoConMontoExtra);
    expect(result.data?.employmentRelations).toEqual([]);
    expect(result.data?.averageSBC).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// Historial detallado (tabla de modificaciones salariales)
// ─────────────────────────────────────────────
//
// Algunas constancias traen, por patrón, una tabla "Tipo de movimiento /
// Fecha de movimiento / Salario Base" (REINGRESO / MODIFICACIÓN DE SALARIO /
// BAJA) con el historial completo de cambios de SBC. Cuando está disponible,
// se usa para un cálculo más preciso en vez de la aproximación de un solo
// SBC por patrón.

describe('ConstanciaIMSSParser — historial detallado de modificaciones salariales', () => {
  test('usa el SBC de la última modificación (no el del encabezado) cuando ya cubre las 250 semanas', () => {
    // El encabezado trae un SBC ($999, deliberadamente distinto) que NO debe
    // usarse: la tabla de movimientos indica que el SBC vigente desde
    // 01/01/2018 es $200, y esa fecha ya es lo bastante antigua para cubrir
    // por sí sola las 250 semanas — las modificaciones anteriores (2010,
    // 2012) quedan fuera de la ventana y no deben afectar el promedio.
    const texto = `Instituto Mexicano del Seguro Social
NSS:
JUAN PEREZ LOPEZ
98765432101
CURP: XEXX010101HNEXXX04
Semanas cotizadas IMSS
Estimado(a),
Tu historia laboral
Vigente
CIUDAD DE MÉXICO
Fecha de alta 01/01/2010 Fecha de baja Salario Base de Cotización *
Entidad federativa
$ 999.0
Nombre del patrón EMPRESA DE PRUEBA SA DE CV
Registro Patronal Y549999940
Fecha de movimiento Tipo de movimiento Salario Base
01/01/2018 MODIFICACION DE SALARIO $ 200.0
01/01/2012 MODIFICACION DE SALARIO $ 75.0
01/01/2010 REINGRESO $ 50.0
* Valor del último salario base de cotización diario en pesos.

|||Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Número total de semanas cotizadas:500||`;

    const result = ConstanciaIMSSParser.parse(texto);
    expect(result.data?.averageSBC).toBe(200);
    expect(result.warnings.some((a) => /historial detallado de modificaciones salariales/i.test(a))).toBe(true);
    expect(result.warnings.some((a) => /APROXIMADO/i.test(a))).toBe(false);
  });

  test('detecta periodos traslapados entre dos patrones distintos y lo advierte', () => {
    // PATRON B (vigente, alta 01/06/2015) por sí solo ya cubre las 250
    // semanas, así que domina el promedio — pero PATRON A (01/01/2015 a
    // 01/06/2016) se traslapa con él (01/06/2015–01/06/2016), como el caso
    // real de empleos simultáneos que el propio IMSS reconoce como válido.
    const texto = `Instituto Mexicano del Seguro Social
NSS:
JUAN PEREZ LOPEZ
98765432101
CURP: XEXX010101HNEXXX04
Semanas cotizadas IMSS
Estimado(a),
Tu historia laboral
Vigente
CIUDAD DE MÉXICO
Fecha de alta 01/06/2015 Fecha de baja Salario Base de Cotización *
Entidad federativa
$ 999.0
Nombre del patrón PATRON B SA DE CV
Registro Patronal Y549999940
Fecha de movimiento Tipo de movimiento Salario Base
01/06/2015 REINGRESO $ 999.0
* Valor del último salario base de cotización diario en pesos.
01/01/2015
CIUDAD DE MÉXICO
Fecha de alta 01/01/2015 Fecha de baja Salario Base de Cotización *
Entidad federativa
$ 500.0
Nombre del patrón PATRON A SA DE CV
Registro Patronal Y584460910
Fecha de movimiento Tipo de movimiento Salario Base
01/06/2016 BAJA $ 500.0
01/01/2015 REINGRESO $ 500.0
* Valor del último salario base de cotización diario en pesos.

|||Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Número total de semanas cotizadas:500||`;

    const result = ConstanciaIMSSParser.parse(texto);
    expect(result.data?.averageSBC).toBe(999);
    expect(
      result.warnings.some((a) => /periodos con más de un patrón simultáneo/i.test(a)),
    ).toBe(true);
  });

  test('no advierte traslape cuando los patrones son contiguos', () => {
    const result = ConstanciaIMSSParser.parse(TEXTO_CONSTANCIA);
    expect(result.warnings.some((a) => /patrón simultáneo/i.test(a))).toBe(false);
  });
});

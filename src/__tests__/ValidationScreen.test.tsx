/**
 * Pruebas de ValidationScreen: humo general + desglose auditable del SBC
 * promedio reconstruido desde el PDF (US-001 / CHG-20261024-001).
 *
 * Los fixtures replican el orden real de extracción de pdfjs-dist (mismo
 * criterio que personalDataParser.test.ts; los datos son sintéticos).
 *
 * Para ejecutar: npm test
 */
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// El texto se define por prueba (la variable empieza con "mock" para poder
// referenciarse desde la factoría de jest.mock).
let mockExtractedText = '';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: { extractedText: mockExtractedText } }),
}));

import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderScreen } from '../test-utils/renderScreen';
import ValidationScreen from '../screens/ValidationScreen';

// Constancia SIN tabla de movimientos (solo último SBC por patrón).
const TEXTO_SIN_DETALLE =
  'CURP: PEPJ600101HDFRRN01 NSS 12345678901 Semanas cotizadas: 520 $ 300.00';

// Historial detallado completo: patrón vigente, 2 movimientos → 2 periodos,
// más de 250 semanas cotizadas, sin huecos. Determinista (alta de 2018).
const TEXTO_DETALLE_COMPLETO = `Instituto Mexicano del Seguro Social
NSS:
JUAN PEREZ LOPEZ
98765432101
CURP: XEXX010101HNEXXX04
Semanas cotizadas IMSS
Estimado(a),
Tu historia laboral
Vigente
DISTRITO FEDERAL
Fecha de alta 01/07/2018 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 999.0
Nombre del patrón EMPRESA DE PRUEBA SA DE CV
Registro Patronal Y584460910
Tipo de movimiento Fecha de movimiento Salario Base
MODIFICACION DE SALARIO 01/01/2021 $ 148.1
REINGRESO 01/07/2018 $ 103.23

|||Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Número total de semanas cotizadas:1048||`;

// Historial detallado pero CORTO: ~31 semanas cotizadas (< 250) →
// reconstrucción parcial.
const TEXTO_PARCIAL = `Instituto Mexicano del Seguro Social
NSS:
JUAN PEREZ LOPEZ
98765432101
CURP: XEXX010101HNEXXX04
Semanas cotizadas IMSS
Estimado(a),
Tu historia laboral
DISTRITO FEDERAL
Fecha de alta 01/06/2019 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 250.0
Nombre del patrón EMPRESA CORTA SA DE CV
Registro Patronal Y500000001
Tipo de movimiento Fecha de movimiento Salario Base
BAJA 01/01/2020 $ 250.0
REINGRESO 01/06/2019 $ 250.0

|||Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Número total de semanas cotizadas:82||`;

// Dos patrones con un hueco sin cotización entre ambos (~2004-06 → 2005-01):
// las 250 semanas se completan pero hay semanas omitidas.
const TEXTO_HUECOS = `Instituto Mexicano del Seguro Social
NSS:
JUAN PEREZ LOPEZ
98765432101
CURP: XEXX010101HNEXXX04
Semanas cotizadas IMSS
Estimado(a),
Tu historia laboral
DISTRITO FEDERAL
Fecha de alta 01/01/2005 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 600.0
Nombre del patrón PATRON A SA DE CV
Registro Patronal Y500000001
Tipo de movimiento Fecha de movimiento Salario Base
BAJA 01/12/2005 $ 600.0
REINGRESO 01/01/2005 $ 600.0
* Valor del último salario base de cotización diario en pesos.
01/01/2000
DISTRITO FEDERAL
Fecha de alta 01/01/2000 Fecha de baja Salario Base de Cotización */
Entidad federativa
$ 200.0
Nombre del patrón PATRON B SA DE CV
Registro Patronal Y500000002
Tipo de movimiento Fecha de movimiento Salario Base
BAJA 01/06/2004 $ 200.0
REINGRESO 01/01/2000 $ 200.0
* Valor del último salario base de cotización diario en pesos.

|||Apellido Paterno:PEREZ|Apellido Materno:LOPEZ|Nombre del Asegurado:JUAN|Número total de semanas cotizadas:312||`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ValidationScreen', () => {
  test('renderiza sin crashear y precarga los campos detectados', () => {
    mockExtractedText = TEXTO_SIN_DETALLE;
    renderScreen(<ValidationScreen />);

    expect(screen.getByText('Datos personales extraídos')).toBeTruthy();
    expect(screen.getByDisplayValue('520')).toBeTruthy();
    expect(screen.getByDisplayValue('PEPJ600101HDFRRN01')).toBeTruthy();
  });

  test('muestra los campos no encontrados como faltantes', () => {
    mockExtractedText = TEXTO_SIN_DETALLE;
    renderScreen(<ValidationScreen />);

    expect(screen.getByText(/Campos no encontrados en el PDF/i)).toBeTruthy();
  });
});

describe('ValidationScreen — desglose del SBC promedio (US-001)', () => {
  test('con historial detallado: tarjeta colapsada por defecto y, al expandirla, periodos y resumen', () => {
    mockExtractedText = TEXTO_DETALLE_COMPLETO;
    renderScreen(<ValidationScreen />);

    // Colapsada por defecto: el título está visible, el contenido no.
    expect(screen.getByText('Cómo se calculó tu SBC promedio (2 periodos)')).toBeTruthy();
    expect(screen.queryByText('Periodos SBC por patrón')).toBeNull();
    // Resumen de una línea bajo el título (mismo promedio que el parser).
    expect(screen.getByText(/\$148\.10\/día · 250 de 250 semanas/)).toBeTruthy();
    // Hint bajo el input del SBC promedio apuntando a la sección.
    expect(screen.getByText(/Despliega «Cómo se calculó tu SBC promedio»/)).toBeTruthy();

    fireEvent.press(screen.getByText('Cómo se calculó tu SBC promedio (2 periodos)'));

    // Periodos SBC por patrón (fechas es-MX + $SBC/día).
    expect(screen.getByText('Periodos SBC por patrón')).toBeTruthy();
    expect(screen.getByText('01/07/2018 – 31/12/2020')).toBeTruthy();
    expect(screen.getByText('$103.23/día')).toBeTruthy();
    // El periodo vigente termina "hoy" (fecha no determinista): solo el rango.
    expect(screen.getByText(/01\/01\/2021 – \d{2}\/\d{2}\/\d{4}/)).toBeTruthy();

    // Resumen de las últimas 250 semanas cotizadas.
    expect(screen.getByText('Resumen de las últimas 250 semanas cotizadas')).toBeTruthy();
    expect(screen.getByText('Semanas usadas en el promedio')).toBeTruthy();
    expect(screen.getByText('250 de 250')).toBeTruthy();
    expect(screen.getByText('Semanas cotizadas del historial')).toBeTruthy();
    expect(screen.getByText('Semanas omitidas (huecos sin patrón)')).toBeTruthy();
    expect(screen.getByText('Ventana de fechas usada')).toBeTruthy();

    // Historial completo y sin huecos: sin marca de parcialidad.
    expect(screen.queryByText(/Reconstrucción parcial/)).toBeNull();
    expect(screen.queryByText(/Se omitieron/)).toBeNull();
  });

  test('muestra la marca de reconstrucción parcial cuando el historial no alcanza las 250 semanas', () => {
    mockExtractedText = TEXTO_PARCIAL;
    renderScreen(<ValidationScreen />);

    expect(screen.getByText('Cómo se calculó tu SBC promedio (1 periodo)')).toBeTruthy();
    fireEvent.press(screen.getByText('Cómo se calculó tu SBC promedio (1 periodo)'));

    expect(screen.getByText(/Reconstrucción parcial: tu historial solo registra \d+ semanas cotizadas/)).toBeTruthy();
    // Sin huecos en este caso: no debe aparecer la nota de semanas omitidas.
    expect(screen.queryByText(/Se omitieron/)).toBeNull();
  });

  test('marca las semanas omitidas cuando hay huecos sin patrón aunque las 250 semanas estén completas', () => {
    mockExtractedText = TEXTO_HUECOS;
    renderScreen(<ValidationScreen />);

    expect(screen.getByText('Cómo se calculó tu SBC promedio (2 periodos)')).toBeTruthy();
    fireEvent.press(screen.getByText('Cómo se calculó tu SBC promedio (2 periodos)'));

    // Nota del banner (el warning del parser usa una redacción distinta:
    // "...que no cuentan").
    expect(screen.getByText(/\(periodos sin patrón\); no cuentan para el promedio/)).toBeTruthy();
    // Las 250 semanas sí se completaron: sin marca de parcialidad.
    expect(screen.queryByText(/Reconstrucción parcial/)).toBeNull();
    expect(screen.getByText('250 de 250')).toBeTruthy();
  });

  test('sin historial detallado: la sección no se muestra y se conserva el aviso de captura manual', () => {
    mockExtractedText = TEXTO_SIN_DETALLE;
    renderScreen(<ValidationScreen />);

    expect(screen.queryByText(/Cómo se calculó tu SBC promedio/)).toBeNull();
    expect(screen.queryByText(/Despliega «Cómo se calculó tu SBC promedio»/)).toBeNull();
    expect(screen.getByText(/no incluye el historial de modificaciones salariales/i)).toBeTruthy();
    // La corrección manual sigue disponible.
    expect(screen.getByDisplayValue('520')).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue('520'), '530');
    expect(screen.getByDisplayValue('530')).toBeTruthy();
  });
});

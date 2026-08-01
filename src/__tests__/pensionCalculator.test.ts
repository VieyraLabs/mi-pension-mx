/**
 * Pruebas unitarias del motor de cálculo de pensión Ley 73.
 * Validan los escenarios principales y casos límite.
 *
 * Para ejecutar: npm test
 */
import {
  calcularPension,
  validarInput,
  calcularEscenarioSimple,
} from '../services/pension/PensionCalculator';
import type { PensionInput } from '../models';
import { DIAS_ANIO_UMA, DIAS_PROMEDIO_MES, MESES_POR_ANIO } from '../constants/ley73';

// ─────────────────────────────────────────────
// Helpers para construir inputs de prueba
// ─────────────────────────────────────────────

const UMA_2025 = 113.14;
const SMG_2025 = 278.8;

function buildInput(overrides: Partial<{
  semanas: number;
  salarioDiario: number;
  edadRetiro: number;
  tieneConyuge: boolean;
  tieneHijosMenores: boolean;
  numeroHijos: number;
  tienePadres: boolean;
  modalidad40Activa: boolean;
  m40Salario: number;
  m40Meses: number;
  umaDiaria: number;
  smgCdmx: number;
}>): PensionInput {
  const {
    semanas = 500,
    salarioDiario = 200,
    edadRetiro = 65,
    tieneConyuge = false,
    tieneHijosMenores = false,
    numeroHijos = 0,
    tienePadres = false,
    modalidad40Activa = false,
    m40Salario = 0,
    m40Meses = 0,
    umaDiaria = UMA_2025,
    smgCdmx = SMG_2025,
  } = overrides;

  return {
    datosPersonales: {
      sexo: 'masculino',
      fechaNacimiento: new Date(1960, 0, 1),
      edad: edadRetiro,
      fechaRetiroEstimada: new Date(2025, 0, 1),
      edadRetiro,
    },
    historialLaboral: {
      semanasTotales: semanas,
      relacionesLaborales: [],
    },
    salarioPromedio: {
      salarioDiario,
      salarioMensual: parseFloat((salarioDiario * DIAS_PROMEDIO_MES).toFixed(2)),
      esManual: true,
    },
    uma: {
      umaDiaria,
      umaMensual: parseFloat((umaDiaria * DIAS_PROMEDIO_MES).toFixed(2)),
      umaAnual: parseFloat((umaDiaria * DIAS_ANIO_UMA).toFixed(2)),
      smgCdmx,
      anio: 2025,
      esPersonalizada: false,
    },
    modalidad40: {
      activa: modalidad40Activa,
      salarioCotizacion: m40Salario || undefined,
      mesesEsperados: m40Meses || undefined,
    },
    beneficiarios: {
      tieneConyuge,
      tieneHijosMenores,
      numeroHijosMenores: numeroHijos,
      tienePadresDependientes: tienePadres,
      numeroPadresDependientes: tienePadres ? 1 : 0,
    },
  };
}

// ─────────────────────────────────────────────
// Validaciones de entrada
// ─────────────────────────────────────────────

describe('validarInput', () => {
  test('rechaza semanas menores a 500', () => {
    const input = buildInput({ semanas: 499 });
    const result = validarInput(input);
    expect(result.valido).toBe(false);
    expect(result.errores.some((e) => e.includes('500'))).toBe(true);
  });

  test('acepta exactamente 500 semanas', () => {
    const input = buildInput({ semanas: 500 });
    const result = validarInput(input);
    expect(result.valido).toBe(true);
  });

  test('rechaza edad de retiro menor a 60', () => {
    const input = buildInput({ edadRetiro: 59 });
    const result = validarInput(input);
    expect(result.valido).toBe(false);
    expect(result.errores.some((e) => e.includes('60'))).toBe(true);
  });

  test('acepta edad de retiro 60 (Cesantía)', () => {
    const input = buildInput({ edadRetiro: 60 });
    const result = validarInput(input);
    expect(result.valido).toBe(true);
  });

  test('rechaza salario cero', () => {
    const input = buildInput({ salarioDiario: 0 });
    const result = validarInput(input);
    expect(result.valido).toBe(false);
  });

  test('genera advertencia con semanas entre 500 y 519', () => {
    const input = buildInput({ semanas: 510 });
    const result = validarInput(input);
    expect(result.valido).toBe(true);
    expect(result.advertencias.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Cálculo de pensión — Casos principales
// ─────────────────────────────────────────────

describe('calcularPension — Pensión de Vejez (65 años)', () => {
  test('calcula pensión básica con 500 semanas y salario bajo (≤1 UMA)', () => {
    // Salario = 1 UMA diaria → cuantía básica 80% (Art. 167 LSS 1973)
    const input = buildInput({
      semanas: 500,
      salarioDiario: UMA_2025, // exactamente 1 UMA
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    expect(result.tipoPension).toBe('vejez');
    expect(result.factorEdad).toBe(1.0);
    expect(result.pensionMensual).toBeGreaterThan(0);
    // Fórmula: Cuantía Básica Anual = Salario Diario × 365 × Porcentaje
    // Cuantía Básica Mensual = Cuantía Básica Anual / 12
    const esperado = (UMA_2025 * 365 * 0.8) / 12; // 80% del SBC anual / 12
    expect(result.cuantiaBasica).toBeCloseTo(esperado, 0);
    expect(result.incrementosAnuales).toBe(0); // sin excedentes
    expect(result.esEstimacion).toBe(true);
  });

  test('cuantía básica correcta con salario en el hueco entre rangos (1.005x UMA)', () => {
    // vecesSMG = 1.005 cae entre rangoMax 1.0 y rangoMin 1.01 de la tabla original.
    // Con el matcher antiguo (find con rangoMax) se asignaba el último rango (37.5%).
    // Con el fix debe asignarse el rango 1.01–1.25 (77.11%).
    const salario1005UMA = UMA_2025 * 1.005;
    const input = buildInput({
      semanas: 500,
      salarioDiario: salario1005UMA,
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    // 77.11% del SBC anual / 12 (rango 1.01–1.25), NO 13% (último rango)
    const esperado7711 = (salario1005UMA * 365 * 0.7711) / 12;
    const incorrecto13 = (salario1005UMA * 365 * 0.13) / 12;
    expect(result.cuantiaBasica).toBeCloseTo(esperado7711, 0);
    expect(result.cuantiaBasica).not.toBeCloseTo(incorrecto13, 0);
  });

  test('calcula incrementos anuales correctamente', () => {
    // 552 semanas = 500 + 52 → 1 año adicional
    const input = buildInput({
      semanas: 552,
      salarioDiario: UMA_2025,
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    expect(result.incrementosAnuales).toBeGreaterThan(0);
    // 1 año excedente = 0.563% del SBC anual / 12 (primer rango)
    const incrementoEsperado = (UMA_2025 * 365 * 0.00563) / 12;
    expect(result.incrementosAnuales).toBeCloseTo(incrementoEsperado, 0);
  });

  test('mayor cantidad de semanas produce pensión mayor', () => {
    const input500 = buildInput({ semanas: 500, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });
    const input1000 = buildInput({ semanas: 1000, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });

    const result500 = calcularPension(input500);
    const result1000 = calcularPension(input1000);

    expect(result1000.incrementosAnuales).toBeGreaterThan(result500.incrementosAnuales);
    expect(result1000.pensionMensual).toBeGreaterThan(result500.pensionMensual);
  });

  test('mayor salario produce pensión mayor (mismo número de semanas)', () => {
    const inputBajo = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 5, edadRetiro: 65 });
    const inputAlto = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });

    const resultBajo = calcularPension(inputBajo);
    const resultAlto = calcularPension(inputAlto);

    expect(resultAlto.aplicoPMG).toBe(false);
    expect(resultBajo.aplicoPMG).toBe(false);
    expect(resultAlto.pensionMensual).toBeGreaterThan(resultBajo.pensionMensual);
  });

  test('la pensión anual es 12 veces la mensual', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);

    expect(result.pensionAnual).toBeCloseTo(result.pensionMensual * MESES_POR_ANIO, 1);
  });

  test('el monto diario es la mensual / días promedio del mes', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);

    expect(result.montoDiario).toBeCloseTo(result.pensionMensual / DIAS_PROMEDIO_MES, 1);
  });
});

// ─────────────────────────────────────────────
// Cesantía en Edad Avanzada — factores de edad
// ─────────────────────────────────────────────

describe('calcularPension — Cesantía en Edad Avanzada', () => {
  test('retiro a 60 años aplica factor 75%', () => {
    const inputVejez = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });
    const inputCesantia60 = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 60 });

    const resultVejez = calcularPension(inputVejez);
    const resultCesantia60 = calcularPension(inputCesantia60);

    expect(resultCesantia60.tipoPension).toBe('cesantia_edad_avanzada');
    expect(resultCesantia60.factorEdad).toBe(0.75);
    // La pensión a 60 debe ser ~75% de la de 65 (antes de asignaciones/límites)
    expect(resultCesantia60.pensionMensual).toBeLessThan(resultVejez.pensionMensual);
  });

  test('retiro a 65 años aplica factor 100%', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);

    expect(result.tipoPension).toBe('vejez');
    expect(result.factorEdad).toBe(1.0);
  });

  test('factores de edad de 60 a 65 aumentan progresivamente', () => {
    const factoresEsperados = [0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
    factoresEsperados.forEach((factor, i) => {
      const edad = 60 + i;
      const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: edad });
      const result = calcularPension(input);
      expect(result.factorEdad).toBe(factor);
    });
  });
});

// ─────────────────────────────────────────────
// Asignaciones familiares
// ─────────────────────────────────────────────

describe('calcularPension — Asignaciones familiares', () => {
  test('sin beneficiarios aplica ayuda asistencial 15%', () => {
    const input = buildInput({
      semanas: 800,
      salarioDiario: 300,
      edadRetiro: 65,
      tieneConyuge: false,
      tieneHijosMenores: false,
    });
    const result = calcularPension(input);

    expect(result.asignacionesFamiliares).toBe(0);
    expect(result.ayudaAsistencial).toBeGreaterThan(0);
    // 15% de la cuantía con factor (básica + incrementos) según Art. 165 LSS 1973
    const cuantiaConFactor = (result.cuantiaBasica + result.incrementosAnuales) * result.factorEdad;
    expect(result.ayudaAsistencial).toBeCloseTo(cuantiaConFactor * 0.15, 0);
  });

  test('con cónyuge suma 15% de asignación familiar', () => {
    const inputSin = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65, tieneConyuge: false });
    const inputCon = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65, tieneConyuge: true });

    const resultSin = calcularPension(inputSin);
    const resultCon = calcularPension(inputCon);

    expect(resultCon.asignacionesFamiliares).toBeGreaterThan(0);
    expect(resultCon.pensionMensual).toBeGreaterThan(resultSin.pensionMensual);
  });

  test('cada hijo suma 10% de asignación familiar', () => {
    const input1hijo = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65, tieneHijosMenores: true, numeroHijos: 1 });
    const input2hijos = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65, tieneHijosMenores: true, numeroHijos: 2 });

    const result1 = calcularPension(input1hijo);
    const result2 = calcularPension(input2hijos);

    expect(result2.asignacionesFamiliares).toBeGreaterThan(result1.asignacionesFamiliares);
    // La diferencia debe ser ~10% de la cuantía con factor (básica + incrementos) según Art. 164 LSS 1973
    const diff = result2.asignacionesFamiliares - result1.asignacionesFamiliares;
    const cuantiaConFactor1 = (result1.cuantiaBasica + result1.incrementosAnuales) * result1.factorEdad;
    expect(diff).toBeCloseTo(cuantiaConFactor1 * 0.1, 0);
  });
});

// ─────────────────────────────────────────────
// Tope de 25 UMA
// ─────────────────────────────────────────────

describe('calcularPension — Tope 25 UMA', () => {
  test('SBC mayor a 25 UMA se topa', () => {
    const salarioExcesivo = UMA_2025 * 30; // 30 UMA — superior al tope
    const input = buildInput({
      semanas: 800,
      salarioDiario: salarioExcesivo,
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    expect(result.aplicoTope).toBe(true);
  });

  test('SBC igual a 25 UMA NO se topa', () => {
    const salario25UMA = UMA_2025 * 25; // exactamente el tope
    const input = buildInput({
      semanas: 800,
      salarioDiario: salario25UMA,
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    // No se topa (está en el límite exacto)
    expect(result.aplicoTope).toBe(false);
  });

  test('SBC menor a 25 UMA no se topa', () => {
    const input = buildInput({
      semanas: 800,
      salarioDiario: 200, // menor a 25 UMA
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    expect(result.aplicoTope).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Pensión Mínima Garantizada
// ─────────────────────────────────────────────

describe('calcularPension — Pensión Mínima Garantizada', () => {
  test('salario muy bajo activa la PMG', () => {
    const input = buildInput({
      semanas: 500,
      salarioDiario: 1, // salario irreal
      edadRetiro: 65,
    });
    const result = calcularPension(input);

    expect(result.aplicoPMG).toBe(true);
    expect(result.pensionMensual).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Desglose de pasos
// ─────────────────────────────────────────────

describe('calcularPension — Desglose', () => {
  test('el desglose contiene los pasos esperados', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);

    const ids = result.pasos.map((p) => p.id);
    expect(ids).toContain('salario_promedio');
    expect(ids).toContain('cuantia_basica');
    expect(ids).toContain('incrementos_anuales');
    expect(ids).toContain('factor_edad');
    expect(ids).toContain('resultado_final');
  });

  test('todas las advertencias son strings no vacíos', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);

    result.advertencias.forEach((adv) => {
      expect(typeof adv).toBe('string');
      expect(adv.length).toBeGreaterThan(0);
    });
  });

  test('el resultado siempre marca esEstimacion: true', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calcularPension(input);
    expect(result.esEstimacion).toBe(true);
  });
});

// ─────────────────────────────────────────────
// calcularEscenarioSimple
// ─────────────────────────────────────────────

describe('calcularEscenarioSimple', () => {
  test('devuelve 0 con semanas insuficientes', () => {
    const resultado = calcularEscenarioSimple({
      semanasCotizadas: 499,
      salarioDiario: 300,
      umaDiaria: UMA_2025,
      edadRetiro: 65,
    });
    expect(resultado).toBe(0);
  });

  test('devuelve un número positivo con datos válidos', () => {
    const resultado = calcularEscenarioSimple({
      semanasCotizadas: 800,
      salarioDiario: 300,
      umaDiaria: UMA_2025,
      edadRetiro: 65,
    });
    expect(resultado).toBeGreaterThan(0);
  });
});

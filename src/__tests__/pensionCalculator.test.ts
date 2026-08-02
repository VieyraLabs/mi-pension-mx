/**
 * Pruebas unitarias del motor de cálculo de pensión Ley 73.
 * Validan los escenarios principales y casos límite.
 *
 * Para ejecutar: npm test
 */
import {
  calculatePension,
  validateInput,
  calculateSimpleScenario,
} from '../services/pension/PensionCalculator';
import type { PensionInput } from '../models';
import { DAYS_PER_YEAR_UMA, AVERAGE_DAYS_PER_MONTH, MONTHS_PER_YEAR } from '../constants/ley73';

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
    personalData: {
      sex: 'masculino',
      birthDate: new Date(1960, 0, 1),
      age: edadRetiro,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: edadRetiro,
    },
    workHistory: {
      totalWeeks: semanas,
      employmentRelations: [],
    },
    averageSalary: {
      dailySalary: salarioDiario,
      monthlySalary: parseFloat((salarioDiario * AVERAGE_DAYS_PER_MONTH).toFixed(2)),
      isManual: true,
    },
    uma: {
      dailyUMA: umaDiaria,
      monthlyUMA: parseFloat((umaDiaria * AVERAGE_DAYS_PER_MONTH).toFixed(2)),
      annualUMA: parseFloat((umaDiaria * DAYS_PER_YEAR_UMA).toFixed(2)),
      smgCdmx,
      year: 2025,
      isCustom: false,
    },
    modalidad40: {
      active: modalidad40Activa,
      contributionSalary: m40Salario || undefined,
      expectedMonths: m40Meses || undefined,
    },
    beneficiaries: {
      hasSpouse: tieneConyuge,
      hasMinorChildren: tieneHijosMenores,
      numberOfMinorChildren: numeroHijos,
      hasDependentParents: tienePadres,
      numberOfDependentParents: tienePadres ? 1 : 0,
    },
  };
}

// ─────────────────────────────────────────────
// Validaciones de entrada
// ─────────────────────────────────────────────

describe('validateInput', () => {
  test('rechaza semanas menores a 500', () => {
    const input = buildInput({ semanas: 499 });
    const result = validateInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('500'))).toBe(true);
  });

  test('acepta exactamente 500 semanas', () => {
    const input = buildInput({ semanas: 500 });
    const result = validateInput(input);
    expect(result.valid).toBe(true);
  });

  test('rechaza edad de retiro menor a 60', () => {
    const input = buildInput({ edadRetiro: 59 });
    const result = validateInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('60'))).toBe(true);
  });

  test('acepta edad de retiro 60 (Cesantía)', () => {
    const input = buildInput({ edadRetiro: 60 });
    const result = validateInput(input);
    expect(result.valid).toBe(true);
  });

  test('rechaza salario cero', () => {
    const input = buildInput({ salarioDiario: 0 });
    const result = validateInput(input);
    expect(result.valid).toBe(false);
  });

  test('genera advertencia con semanas entre 500 y 519', () => {
    const input = buildInput({ semanas: 510 });
    const result = validateInput(input);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('rechaza semanas menores a 500 aunque falte poco, si Modalidad 40 no está activa', () => {
    const input = buildInput({ semanas: 480 });
    const result = validateInput(input);
    expect(result.valid).toBe(false);
  });

  test('acepta semanas menores a 500 cuando Modalidad 40 planeada completa el mínimo', () => {
    // 480 semanas ya cotizadas + 24 meses de M40 (~104 semanas) = 584, sí alcanza el mínimo.
    const input = buildInput({ semanas: 480, modalidad40Activa: true, m40Salario: 300, m40Meses: 24 });
    const result = validateInput(input);
    expect(result.valid).toBe(true);
  });

  test('rechaza semanas menores a 500 si ni con Modalidad 40 planeada se alcanza el mínimo', () => {
    // 400 semanas + 6 meses de M40 (~26 semanas) = 426, no alcanza.
    const input = buildInput({ semanas: 400, modalidad40Activa: true, m40Salario: 300, m40Meses: 6 });
    const result = validateInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('planeadas en Modalidad 40'))).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Modalidad 40 — semanas proyectadas
// ─────────────────────────────────────────────
//
// Los meses de Modalidad 40 que el usuario planea contratar a futuro
// (`expectedMonths`) no están incluidos en `workHistory.totalWeeks` — deben
// sumarse al total de semanas usado para el mínimo de 500 y los incrementos
// anuales, no solo usarse para el promedio ponderado del SBC.

describe('calculatePension — Modalidad 40 (semanas proyectadas)', () => {
  test('las semanas planeadas de Modalidad 40 se suman a las semanas excedentes', () => {
    // 500 semanas ya cotizadas (0 excedentes por sí solas) + 52 semanas
    // proyectadas por 12 meses de M40 = 552 → 52 excedentes → 1 año completo.
    // Se compara el paso de incrementos directamente (no la pensión final)
    // para no depender de si la Pensión Mínima Garantizada u otro tope
    // termina dominando el resultado con un salario de prueba dado.
    const sinM40 = calculatePension(buildInput({ semanas: 500 }));
    const conM40 = calculatePension(
      buildInput({ semanas: 500, modalidad40Activa: true, m40Salario: 200, m40Meses: 12 }),
    );

    const pasoSinM40 = sinM40.steps.find((p) => p.id === 'incrementos_anuales');
    const pasoConM40 = conM40.steps.find((p) => p.id === 'incrementos_anuales');

    expect(pasoSinM40?.description).not.toMatch(/Modalidad 40/i);
    expect(pasoSinM40?.value).toBe(0);
    expect(pasoConM40?.description).toMatch(/552/);
    expect(pasoConM40?.description).toMatch(/Modalidad 40/i);
    // 52 semanas excedentes = 1 año completo de incremento, en vez de 0.
    expect(pasoConM40?.value).toBeGreaterThan(0);
  });

  test('sin Modalidad 40 activa, las semanas proyectadas no se suman', () => {
    const input = buildInput({ semanas: 500, modalidad40Activa: false, m40Meses: 12 });
    const result = calculatePension(input);
    const paso = result.steps.find((p) => p.id === 'incrementos_anuales');
    expect(paso?.description).not.toMatch(/Modalidad 40/i);
  });
});

// ─────────────────────────────────────────────
// Cálculo de pensión — Casos principales
// ─────────────────────────────────────────────

describe('calculatePension — Pensión de Vejez (65 años)', () => {
  test('calcula pensión básica con 500 semanas y salario bajo (≤1 UMA)', () => {
    // Salario = 1 UMA diaria → cuantía básica 80% (Art. 167 LSS 1973)
    const input = buildInput({
      semanas: 500,
      salarioDiario: UMA_2025, // exactamente 1 UMA
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    expect(result.pensionType).toBe('vejez');
    expect(result.ageFactor).toBe(1.0);
    expect(result.monthlyPension).toBeGreaterThan(0);
    // Fórmula: Cuantía Básica Anual = Salario Diario × 365 × Porcentaje
    // Cuantía Básica Mensual = Cuantía Básica Anual / 12
    const esperado = (UMA_2025 * 365 * 0.8) / 12; // 80% del SBC anual / 12
    expect(result.basicAmount).toBeCloseTo(esperado, 0);
    expect(result.annualIncrements).toBe(0); // sin excedentes
    expect(result.isEstimate).toBe(true);
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
    const result = calculatePension(input);

    // 77.11% del SBC anual / 12 (rango 1.01–1.25), NO 13% (último rango)
    const esperado7711 = (salario1005UMA * 365 * 0.7711) / 12;
    const incorrecto13 = (salario1005UMA * 365 * 0.13) / 12;
    expect(result.basicAmount).toBeCloseTo(esperado7711, 0);
    expect(result.basicAmount).not.toBeCloseTo(incorrecto13, 0);
  });

  test('calcula incrementos anuales correctamente', () => {
    // 552 semanas = 500 + 52 → 1 año adicional
    const input = buildInput({
      semanas: 552,
      salarioDiario: UMA_2025,
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    expect(result.annualIncrements).toBeGreaterThan(0);
    // 1 año excedente = 0.563% del SBC anual / 12 (primer rango)
    const incrementoEsperado = (UMA_2025 * 365 * 0.00563) / 12;
    expect(result.annualIncrements).toBeCloseTo(incrementoEsperado, 0);
  });

  test('mayor cantidad de semanas produce pensión mayor', () => {
    const input500 = buildInput({ semanas: 500, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });
    const input1000 = buildInput({ semanas: 1000, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });

    const result500 = calculatePension(input500);
    const result1000 = calculatePension(input1000);

    expect(result1000.annualIncrements).toBeGreaterThan(result500.annualIncrements);
    expect(result1000.monthlyPension).toBeGreaterThan(result500.monthlyPension);
  });

  test('mayor salario produce pensión mayor (mismo número de semanas)', () => {
    const inputBajo = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 5, edadRetiro: 65 });
    const inputAlto = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });

    const resultBajo = calculatePension(inputBajo);
    const resultAlto = calculatePension(inputAlto);

    expect(resultAlto.pmgApplied).toBe(false);
    expect(resultBajo.pmgApplied).toBe(false);
    expect(resultAlto.monthlyPension).toBeGreaterThan(resultBajo.monthlyPension);
  });

  test('la pensión anual es 12 veces la mensual', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    expect(result.annualPension).toBeCloseTo(result.monthlyPension * MONTHS_PER_YEAR, 1);
  });

  test('el monto diario es la mensual / días promedio del mes', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    expect(result.dailyAmount).toBeCloseTo(result.monthlyPension / AVERAGE_DAYS_PER_MONTH, 1);
  });
});

// ─────────────────────────────────────────────
// Cesantía en Edad Avanzada — factores de edad
// ─────────────────────────────────────────────

describe('calculatePension — Cesantía en Edad Avanzada', () => {
  test('retiro a 60 años aplica factor 75%', () => {
    const inputVejez = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65 });
    const inputCesantia60 = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 60 });

    const resultVejez = calculatePension(inputVejez);
    const resultCesantia60 = calculatePension(inputCesantia60);

    expect(resultCesantia60.pensionType).toBe('cesantia_edad_avanzada');
    expect(resultCesantia60.ageFactor).toBe(0.75);
    // La pensión a 60 debe ser ~75% de la de 65 (antes de asignaciones/límites)
    expect(resultCesantia60.monthlyPension).toBeLessThan(resultVejez.monthlyPension);
  });

  test('retiro a 65 años aplica factor 100%', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    expect(result.pensionType).toBe('vejez');
    expect(result.ageFactor).toBe(1.0);
  });

  test('factores de edad de 60 a 65 aumentan progresivamente', () => {
    const factoresEsperados = [0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
    factoresEsperados.forEach((factor, i) => {
      const edad = 60 + i;
      const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: edad });
      const result = calculatePension(input);
      expect(result.ageFactor).toBe(factor);
    });
  });
});

// ─────────────────────────────────────────────
// Asignaciones familiares
// ─────────────────────────────────────────────

describe('calculatePension — Asignaciones familiares', () => {
  test('sin beneficiarios aplica ayuda asistencial 15%', () => {
    const input = buildInput({
      semanas: 800,
      salarioDiario: 300,
      edadRetiro: 65,
      tieneConyuge: false,
      tieneHijosMenores: false,
    });
    const result = calculatePension(input);

    expect(result.familyAllowances).toBe(0);
    expect(result.assistanceAid).toBeGreaterThan(0);
    // 15% de la cuantía con factor (básica + incrementos + decreto 11%) según Art. 165 LSS 1973
    const cuantiaConFactor =
      (result.basicAmount + result.annualIncrements + result.decree11Increment) * result.ageFactor;
    expect(result.assistanceAid).toBeCloseTo(cuantiaConFactor * 0.15, 0);
  });

  test('con cónyuge suma 15% de asignación familiar', () => {
    const inputSin = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65, tieneConyuge: false });
    const inputCon = buildInput({ semanas: 1200, salarioDiario: UMA_2025 * 10, edadRetiro: 65, tieneConyuge: true });

    const resultSin = calculatePension(inputSin);
    const resultCon = calculatePension(inputCon);

    expect(resultCon.familyAllowances).toBeGreaterThan(0);
    expect(resultCon.monthlyPension).toBeGreaterThan(resultSin.monthlyPension);
  });

  test('cada hijo suma 10% de asignación familiar', () => {
    const input1hijo = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65, tieneHijosMenores: true, numeroHijos: 1 });
    const input2hijos = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65, tieneHijosMenores: true, numeroHijos: 2 });

    const result1 = calculatePension(input1hijo);
    const result2 = calculatePension(input2hijos);

    expect(result2.familyAllowances).toBeGreaterThan(result1.familyAllowances);
    // La diferencia debe ser ~10% de la cuantía con factor (básica + incrementos + decreto 11%) según Art. 164 LSS 1973
    const diff = result2.familyAllowances - result1.familyAllowances;
    const cuantiaConFactor1 =
      (result1.basicAmount + result1.annualIncrements + result1.decree11Increment) * result1.ageFactor;
    expect(diff).toBeCloseTo(cuantiaConFactor1 * 0.1, 0);
  });
});

// ─────────────────────────────────────────────
// Tope de 25 UMA
// ─────────────────────────────────────────────

describe('calculatePension — Tope 25 UMA', () => {
  test('SBC mayor a 25 UMA se topa', () => {
    const salarioExcesivo = UMA_2025 * 30; // 30 UMA — superior al tope
    const input = buildInput({
      semanas: 800,
      salarioDiario: salarioExcesivo,
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    expect(result.capApplied).toBe(true);
  });

  test('SBC igual a 25 UMA NO se topa', () => {
    const salario25UMA = UMA_2025 * 25; // exactamente el tope
    const input = buildInput({
      semanas: 800,
      salarioDiario: salario25UMA,
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    // No se topa (está en el límite exacto)
    expect(result.capApplied).toBe(false);
  });

  test('SBC menor a 25 UMA no se topa', () => {
    const input = buildInput({
      semanas: 800,
      salarioDiario: 200, // menor a 25 UMA
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    expect(result.capApplied).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Pensión Mínima Garantizada
// ─────────────────────────────────────────────

describe('calculatePension — Pensión Mínima Garantizada', () => {
  test('salario muy bajo activa la PMG', () => {
    const input = buildInput({
      semanas: 500,
      salarioDiario: 1, // salario irreal
      edadRetiro: 65,
    });
    const result = calculatePension(input);

    expect(result.pmgApplied).toBe(true);
    expect(result.monthlyPension).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// Desglose de pasos
// ─────────────────────────────────────────────

describe('calculatePension — Desglose', () => {
  test('el desglose contiene los pasos esperados', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    const ids = result.steps.map((p) => p.id);
    expect(ids).toContain('salario_promedio');
    expect(ids).toContain('cuantia_basica');
    expect(ids).toContain('incrementos_anuales');
    expect(ids).toContain('incremento_decreto_11');
    expect(ids).toContain('factor_edad');
    expect(ids).toContain('resultado_final');
  });

  test('todas las advertencias son strings no vacíos', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    result.warnings.forEach((adv) => {
      expect(typeof adv).toBe('string');
      expect(adv.length).toBeGreaterThan(0);
    });
  });

  test('el resultado siempre marca esEstimacion: true', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);
    expect(result.isEstimate).toBe(true);
  });
});

// ─────────────────────────────────────────────
// Incremento del 11% (Decreto DOF 2001/2004)
// ─────────────────────────────────────────────

describe('calculatePension — Incremento del 11% (Decreto DOF 2001/2004)', () => {
  test('el incremento equivale al 11% de cuantía básica + incrementos anuales', () => {
    const input = buildInput({ semanas: 800, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    const cuantiaAntesDecreto = result.basicAmount + result.annualIncrements;
    expect(result.decree11Increment).toBeCloseTo(cuantiaAntesDecreto * 0.11, 1);
  });

  test('con salario 0 el incremento es 0', () => {
    const input = buildInput({ semanas: 500, salarioDiario: 0, edadRetiro: 65 });
    const result = calculatePension(input);
    expect(result.decree11Increment).toBe(0);
  });

  test('el incremento se refleja en la pensión final (comparado sin el paso)', () => {
    const input = buildInput({ semanas: 500, salarioDiario: 300, edadRetiro: 65 });
    const result = calculatePension(input);

    const cuantiaAntesDecreto = result.basicAmount + result.annualIncrements;
    const pensionSinDecretoAprox = cuantiaAntesDecreto * result.ageFactor;
    expect(result.monthlyPension).toBeGreaterThan(pensionSinDecretoAprox);
  });
});

// ─────────────────────────────────────────────
// calculateSimpleScenario
// ─────────────────────────────────────────────

describe('calculateSimpleScenario', () => {
  test('devuelve 0 con semanas insuficientes', () => {
    const resultado = calculateSimpleScenario({
      semanasCotizadas: 499,
      salarioDiario: 300,
      umaDiaria: UMA_2025,
      edadRetiro: 65,
    });
    expect(resultado).toBe(0);
  });

  test('devuelve un número positivo con datos válidos', () => {
    const resultado = calculateSimpleScenario({
      semanasCotizadas: 800,
      salarioDiario: 300,
      umaDiaria: UMA_2025,
      edadRetiro: 65,
    });
    expect(resultado).toBeGreaterThan(0);
  });
});

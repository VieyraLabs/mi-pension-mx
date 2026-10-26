/**
 * Pruebas del helper de proyección de semanas hasta la edad de retiro.
 *
 * El helper es compartido por el motor de cálculo, el esquema de validación
 * y el formulario: es la única fuente de verdad sobre cuántas semanas se
 * tienen hoy y cuántas se proyectan hasta jubilarse.
 *
 * Para ejecutar: npm test
 */
import {
  calculateWeeksProjection,
  estimateMonthsToRetirement,
  describeWeeksProjection,
} from '../utils/weeksProjection';
import { WEEKS_PER_YEAR } from '../constants/ley73';

describe('calculateWeeksProjection', () => {
  test('proyecta las semanas que faltan cotizar hasta la edad de retiro', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 500,
      age: 30,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    expect(projection.yearsToRetirement).toBe(35);
    expect(projection.projectedWeeks).toBe(35 * WEEKS_PER_YEAR);
    expect(projection.targetWeeks).toBe(500 + 35 * WEEKS_PER_YEAR);
  });

  test('si ya está en la edad de retiro no proyecta semanas', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 800,
      age: 65,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    expect(projection.yearsToRetirement).toBe(0);
    expect(projection.projectedWeeks).toBe(0);
    expect(projection.targetWeeks).toBe(800);
  });

  test('si la edad actual supera la edad de retiro no proyecta semanas', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 800,
      age: 70,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    expect(projection.yearsToRetirement).toBe(0);
    expect(projection.projectedWeeks).toBe(0);
    expect(projection.targetWeeks).toBe(800);
  });

  test('las semanas de Modalidad 40 dentro del horizonte NO se suman dos veces', () => {
    // 35 años proyectados = 1820 semanas; la M40 (52 semanas) cae dentro de
    // ese horizonte, así que el total NO es 500 + 1820 + 52.
    const projection = calculateWeeksProjection({
      currentWeeks: 500,
      age: 30,
      retirementAge: 65,
      m40PlannedWeeks: 52,
    });

    expect(projection.projectedWeeks).toBe(35 * WEEKS_PER_YEAR);
    expect(projection.targetWeeks).toBe(500 + 35 * WEEKS_PER_YEAR);
  });

  test('las semanas de Modalidad 40 fuera del horizonte sustituyen a la proyección', () => {
    // A 60 años solo faltan 5 años (260 semanas) para el retiro, pero la M40
    // planeada son 300 semanas: mandan ellas sobre la proyección.
    const projection = calculateWeeksProjection({
      currentWeeks: 500,
      age: 60,
      retirementAge: 65,
      m40PlannedWeeks: 300,
    });

    expect(projection.projectedWeeks).toBe(5 * WEEKS_PER_YEAR);
    expect(projection.targetWeeks).toBe(500 + 300);
  });

  test('con Modalidad 40 dentro del horizonte el objetivo no se duplica', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 100,
      age: 40,
      retirementAge: 65,
      m40PlannedWeeks: 100,
    });

    expect(projection.targetWeeks).toBe(100 + 25 * WEEKS_PER_YEAR);
  });
});

describe('estimateMonthsToRetirement', () => {
  test('calcula los meses que faltan hasta la edad de retiro', () => {
    expect(estimateMonthsToRetirement(30, 65)).toBe(35 * 12);
  });

  test('devuelve 0 si ya está en la edad de retiro', () => {
    expect(estimateMonthsToRetirement(65, 65)).toBe(0);
  });

  test('devuelve 0 si la edad actual supera la edad de retiro', () => {
    expect(estimateMonthsToRetirement(70, 65)).toBe(0);
  });
});

describe('describeWeeksProjection', () => {
  test('narra las tres cifras: cotizadas, proyectadas y total', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 100,
      age: 30,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    const narrative = describeWeeksProjection(projection);
    expect(narrative.parts).toEqual([
      '100 cotizadas',
      '1820 proyectadas hasta la edad de retiro',
    ]);
    expect(narrative.breakdown).toBe(
      '100 cotizadas + 1820 proyectadas hasta la edad de retiro = 1920',
    );
    expect(narrative.m40ExtraWeeks).toBe(0);
  });

  test('con edad de retiro nombra el horizonte con los años', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 100,
      age: 30,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    const narrative = describeWeeksProjection(projection, 65);
    expect(narrative.parts).toEqual([
      '100 cotizadas',
      '1820 proyectadas hasta los 65 años',
    ]);
  });

  test('menciona las semanas de Modalidad 40 que exceden el horizonte', () => {
    // A 60 años el horizonte es de 260 semanas, pero la M40 planeada son 300:
    // solo 40 semanas de M40 caen FUERA del horizonte (las otras 260 ya
    // están contadas en la proyección y no se cuentan dos veces).
    const projection = calculateWeeksProjection({
      currentWeeks: 500,
      age: 60,
      retirementAge: 65,
      m40PlannedWeeks: 300,
    });

    const narrative = describeWeeksProjection(projection);
    expect(narrative.m40ExtraWeeks).toBe(40);
    expect(narrative.breakdown).toBe(
      '500 cotizadas + 260 proyectadas hasta la edad de retiro + 40 planeadas en Modalidad 40 = 800',
    );
  });

  test('sin horizonte a futuro narra solo las semanas cotizadas', () => {
    const projection = calculateWeeksProjection({
      currentWeeks: 800,
      age: 65,
      retirementAge: 65,
      m40PlannedWeeks: 0,
    });

    const narrative = describeWeeksProjection(projection);
    expect(narrative.parts).toEqual(['800 cotizadas']);
    expect(narrative.breakdown).toBe('800 cotizadas = 800');
  });
});

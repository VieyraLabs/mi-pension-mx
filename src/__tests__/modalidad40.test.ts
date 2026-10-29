import {
  calculateM40PlannedWeeks,
  calculateM40Summary,
  estimateM40Months,
} from '../utils/modalidad40';

describe('Modalidad 40 por fechas', () => {
  test('cuenta desde el próximo mes hasta el mes de retiro inclusive', () => {
    const referenceDate = new Date(2025, 5, 1);
    const retirementDate = new Date(2025, 6, 15);

    expect(estimateM40Months(referenceDate, retirementDate)).toBe(1);
    expect(calculateM40PlannedWeeks(referenceDate, retirementDate)).toBe(4);
  });

  test('no proyecta meses ni semanas si el retiro ocurre antes del mes siguiente', () => {
    const referenceDate = new Date(2025, 5, 30);
    const retirementDate = new Date(2025, 5, 30);

    expect(estimateM40Months(referenceDate, retirementDate)).toBe(0);
    expect(calculateM40PlannedWeeks(referenceDate, retirementDate)).toBe(0);
  });

  test('cuenta el mes contractual completo aunque el retiro sea el día 1', () => {
    const referenceDate = new Date(2025, 5, 30);
    const retirementDate = new Date(2025, 6, 1);

    expect(estimateM40Months(referenceDate, retirementDate)).toBe(1);
    expect(calculateM40PlannedWeeks(referenceDate, retirementDate)).toBe(4);
  });

  test('limita meses y semanas planeadas al fin del mes 600', () => {
    const referenceDate = new Date(2025, 5, 1);
    const retirementDate = new Date(2080, 0, 15);

    expect(estimateM40Months(referenceDate, retirementDate)).toBe(600);
    expect(calculateM40PlannedWeeks(referenceDate, retirementDate)).toBe(2609);
  });

  test('pondera el promedio M40 con semanas planeadas por fecha y conserva el fallback histórico', () => {
    const modalidad40 = {
      active: true,
      contributionSalary: 300,
      expectedMonths: 7,
    };

    const dateBased = calculateM40Summary(modalidad40, 500, 200, 113.14, 31);
    expect(dateBased.referenceWeeks).toBe(31);
    expect(dateBased.baseWeeks).toBe(219);
    expect(dateBased.estimatedAverageDailySalary).toBe(212.4);

    const legacy = calculateM40Summary(modalidad40, 500, 200, 113.14);
    expect(legacy.referenceWeeks).toBe(30);
    expect(legacy.baseWeeks).toBe(220);
    expect(legacy.estimatedAverageDailySalary).toBe(212.13);

    const exactZero = calculateM40Summary(modalidad40, 500, 200, 113.14, 0);
    expect(exactZero.referenceWeeks).toBe(0);
    expect(exactZero.baseWeeks).toBe(250);
    expect(exactZero.estimatedTotalWeeks).toBe(500);
  });

  test('M40 inactiva deja intactos el salario base y las métricas del resumen', () => {
    const summary = calculateM40Summary(
      { active: false, contributionSalary: 300, expectedMonths: 7 },
      500,
      200,
      113.14,
      31,
    );

    expect(summary.referenceWeeks).toBe(0);
    expect(summary.baseWeeks).toBe(0);
    expect(summary.estimatedAverageDailySalary).toBe(200);
    expect(summary.estimatedTotalWeeks).toBe(500);
  });
});

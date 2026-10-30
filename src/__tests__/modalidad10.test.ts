import {
  buildM10ContributionPeriod,
  calculateM10MonthlyBreakdown,
  calculateM10MonthlyCost,
  calculateM10PlannedWeeks,
  clampM10Salary,
  estimateM10Months,
  getM10StartDate,
  m10SalaryFromUMAs,
  m10SalaryInUMAs,
  m10SalaryRange,
} from '../utils/modalidad10';

const UMA = 113.14;
const SMG = 278.8;

describe('Modalidad 10 por fechas', () => {
  test('cuenta desde el próximo mes hasta el mes de retiro inclusive', () => {
    const referenceDate = new Date(2025, 5, 1);
    const retirementDate = new Date(2025, 6, 15);

    expect(estimateM10Months(referenceDate, retirementDate)).toBe(1);
    expect(calculateM10PlannedWeeks(referenceDate, retirementDate)).toBe(4);
  });

  test('no proyecta meses ni semanas si el retiro ocurre antes del mes siguiente', () => {
    const referenceDate = new Date(2025, 5, 30);
    const retirementDate = new Date(2025, 5, 30);

    expect(estimateM10Months(referenceDate, retirementDate)).toBe(0);
    expect(calculateM10PlannedWeeks(referenceDate, retirementDate)).toBe(0);
  });

  test('cuenta el mes contractual completo aunque el retiro sea el día 1', () => {
    const referenceDate = new Date(2025, 5, 30);
    const retirementDate = new Date(2025, 6, 1);

    expect(estimateM10Months(referenceDate, retirementDate)).toBe(1);
    expect(calculateM10PlannedWeeks(referenceDate, retirementDate)).toBe(4);
  });

  test('limita meses y semanas planeadas al fin del mes 600', () => {
    const referenceDate = new Date(2025, 5, 1);
    const retirementDate = new Date(2080, 0, 15);

    expect(estimateM10Months(referenceDate, retirementDate)).toBe(600);
    expect(calculateM10PlannedWeeks(referenceDate, retirementDate)).toBe(2609);
  });

  test('el primer día cotizable es el 1º del mes siguiente a la referencia', () => {
    expect(getM10StartDate(new Date(2025, 5, 1))).toEqual(new Date(2025, 6, 1));
    expect(getM10StartDate(new Date(2025, 5, 30))).toEqual(new Date(2025, 6, 1));
  });
});

describe('Modalidad 10 — SBC en UMAs', () => {
  test('convierte el SBC a UMAs y de vuelta', () => {
    expect(m10SalaryInUMAs(2262.8, UMA)).toBe(20);
    expect(m10SalaryFromUMAs(20, UMA)).toBe(2262.8);
  });

  test('el rango legal va del salario mínimo de la zona a 25 UMA', () => {
    const range = m10SalaryRange(UMA, SMG);

    expect(range.minimumDailySalary).toBe(SMG);
    expect(range.minimumUMAs).toBe(2.46);
    expect(range.maximumUMAs).toBe(25);
    expect(range.maximumDailySalary).toBe(2828.5);
  });

  test('acota un SBC fuera del rango legal', () => {
    expect(clampM10Salary(100, UMA, SMG)).toBe(SMG);
    expect(clampM10Salary(99999, UMA, SMG)).toBe(2828.5);
    expect(clampM10Salary(1000, UMA, SMG)).toBe(1000);
  });
});

describe('Modalidad 10 — periodo de cotización', () => {
  const referenceDate = new Date(2025, 5, 1);
  const retirementDate = new Date(2030, 5, 30);

  test('sin seguir trabajando el SBC del periodo es el de la Modalidad 10', () => {
    const period = buildM10ContributionPeriod({
      referenceDate,
      retirementDate,
      m10DailySalary: 2000,
      ordinaryDailySalary: 500,
      continuesWorking: false,
      dailyUMA: UMA,
    });

    expect(period?.dailySalary).toBe(2000);
    expect(period?.months).toBe(60);
    expect(period?.startDate).toEqual(new Date(2025, 6, 1));
    expect(period?.endDate).toEqual(retirementDate);
  });

  test('si sigue trabajando, su último salario registrado se suma al de M10', () => {
    const period = buildM10ContributionPeriod({
      referenceDate,
      retirementDate,
      m10DailySalary: 2000,
      ordinaryDailySalary: 500,
      continuesWorking: true,
      dailyUMA: UMA,
    });

    expect(period?.dailySalary).toBe(2500);
  });

  test('el SBC combinado se topa a 25 UMA', () => {
    const period = buildM10ContributionPeriod({
      referenceDate,
      retirementDate,
      m10DailySalary: 2800,
      ordinaryDailySalary: 500,
      continuesWorking: true,
      dailyUMA: UMA,
    });

    expect(period?.dailySalary).toBe(2828.5);
  });

  test('sin un mes contractual por delante no hay periodo', () => {
    const period = buildM10ContributionPeriod({
      referenceDate: new Date(2025, 5, 30),
      retirementDate: new Date(2025, 5, 30),
      m10DailySalary: 2000,
      ordinaryDailySalary: 500,
      continuesWorking: true,
      dailyUMA: UMA,
    });

    expect(period).toBeNull();
  });
});

describe('Modalidad 10 — costo mensual', () => {
  test('se calcula como cuota base + prima de riesgo de la clase', () => {
    // 25 UMA de 2025: $2,828.50/día × 30.4 = $85,986.40/mes.
    // Clase III: base 18.30% ($15,735.51) + prima RT 2.5984% ($2,234.27).
    expect(calculateM10MonthlyCost(2828.5, 3)).toBe(17969.78);
    expect(calculateM10MonthlyCost(2828.5, 1)).toBe(16202.89);
  });

  test('el desglose separa cuota base y prima de Riesgos de Trabajo', () => {
    const b = calculateM10MonthlyBreakdown(2828.5, 3);
    expect(b.monthlySalary).toBe(85986.4);
    expect(b.baseCuotaAmount).toBe(15735.51);
    expect(b.riskPrimaAmount).toBe(2234.27);
    expect(b.total).toBe(17969.78);
    expect(b.baseCuotaAmount + b.riskPrimaAmount).toBeCloseTo(b.total, 2);
  });

  test('un SBC menor cuesta menos', () => {
    expect(calculateM10MonthlyCost(1131.4, 3)).toBeLessThan(calculateM10MonthlyCost(2828.5, 3));
  });
});

import { calculateProjectedSBC } from '../services/pension/history/projectedSBC';
import type { SBCPeriodSegment } from '../services/pension/history/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REFERENCE_DATE = new Date(2025, 0, 1);

function segment(startDate: Date, endDate: Date, sbc: number): SBCPeriodSegment {
  return {
    startDate,
    endDate,
    sbc,
    employerNames: [],
    employers: [],
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function historicalSegments(): SBCPeriodSegment[] {
  return [
    segment(addDays(REFERENCE_DATE, -300 * 7 + 1), addDays(REFERENCE_DATE, -50 * 7), 100),
    segment(addDays(REFERENCE_DATE, -50 * 7 + 1), REFERENCE_DATE, 300),
  ];
}

describe('calculateProjectedSBC', () => {
  test('mezcla semanas históricas que siguen en la ventana con semanas futuras', () => {
    const retirementDate = addDays(REFERENCE_DATE, 100 * 7);

    // De las 250 semanas: 100 futuras a $300, 50 históricas a $300 y 100 a $100.
    expect(calculateProjectedSBC(historicalSegments(), 250, retirementDate, REFERENCE_DATE)).toBe(220);
  });

  test('con al menos 250 semanas futuras usa completamente el último SBC', () => {
    const retirementDate = addDays(REFERENCE_DATE, 260 * 7);

    expect(calculateProjectedSBC(historicalSegments(), 250, retirementDate, REFERENCE_DATE)).toBe(300);
  });

  test('sin historial detallado conserva el SBC actual, no un último importe aislado', () => {
    expect(calculateProjectedSBC([], 250, addDays(REFERENCE_DATE, 300), REFERENCE_DATE)).toBe(250);
  });

  test('extiende el SBC agregado de patrones concurrentes, sin volver a sumarlo', () => {
    const periods = [
      segment(addDays(REFERENCE_DATE, -300 * 7 + 1), REFERENCE_DATE, 900),
    ];
    const retirementDate = addDays(REFERENCE_DATE, 260 * 7);

    expect(calculateProjectedSBC(periods, 250, retirementDate, REFERENCE_DATE)).toBe(900);
  });

  test('el límite entre historial y futuro no deja huecos ni duplica el día de referencia', () => {
    const periods = [segment(REFERENCE_DATE, REFERENCE_DATE, 100)];
    const retirementDate = addDays(REFERENCE_DATE, 6);

    // El día actual cuenta una vez y los días siguientes continúan al último SBC ($100).
    expect(calculateProjectedSBC(periods, 250, retirementDate, REFERENCE_DATE)).toBe(100);
  });
});

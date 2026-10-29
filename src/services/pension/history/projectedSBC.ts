import { SBC_AVERAGE_WEEKS } from '../../../constants/ley73';
import { buildContributionHistory, calculateContributionSummary } from './contributionHistory';
import type { SBCPeriod, SBCPeriodSegment } from './types';

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Proyecta el promedio de las últimas semanas cotizadas al retiro.
 * Los segmentos históricos conservan su SBC efectivo y las cotizaciones desde
 * el día siguiente a la referencia hasta el retiro usan el SBC del último tramo.
 */
export function calculateProjectedSBC(
  segments: readonly SBCPeriodSegment[],
  currentSBC: number,
  retirementDate: Date,
  referenceDate: Date = new Date(),
  count: number = SBC_AVERAGE_WEEKS,
): number {
  const referenceDay = startOfLocalDay(referenceDate);
  const retirementDay = startOfLocalDay(retirementDate);
  const historyEnd = retirementDay.getTime() < referenceDay.getTime() ? retirementDay : referenceDay;

  const historicalPeriods: SBCPeriod[] = segments.flatMap((segment) => {
    if (!Number.isFinite(segment.sbc) || segment.sbc <= 0) return [];
    const startDate = startOfLocalDay(segment.startDate);
    const endDate = new Date(Math.min(startOfLocalDay(segment.endDate).getTime(), historyEnd.getTime()));
    return startDate.getTime() <= endDate.getTime()
      ? [{ startDate, endDate, sbc: segment.sbc }]
      : [];
  });

  if (historicalPeriods.length === 0) return currentSBC;

  const lastHistoricalPeriod = historicalPeriods.reduce((latest, period) =>
    period.endDate.getTime() > latest.endDate.getTime() ? period : latest,
  );
  const projectedPeriods = [...historicalPeriods];
  if (retirementDay.getTime() > referenceDay.getTime()) {
    projectedPeriods.push({
      startDate: addLocalDays(referenceDay, 1),
      endDate: retirementDay,
      sbc: lastHistoricalPeriod.sbc,
    });
  }

  // Contribution history treats its reference as the exclusive end of its
  // final week; add one calendar day to include the retirement date itself.
  const summary = calculateContributionSummary(
    buildContributionHistory(projectedPeriods, addLocalDays(retirementDay, 1)),
    count,
  );
  return summary?.averageSalary ?? currentSBC;
}

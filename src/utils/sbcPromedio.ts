/**
 * Cálculo del SBC promedio ponderado por días sobre una ventana de semanas
 * (Art. 167 LSS 1973: últimas 250 semanas).
 *
 * Genérico respecto a la fuente: sirve tanto para una aproximación
 * construida a partir de "último SBC por patrón" (Constancia de Semanas
 * Cotizadas) como para un cálculo exacto si la fuente trae el historial
 * completo de cambios de SBC dentro de cada patrón.
 */
import { round2 } from './format';

export interface SBCPeriod {
  startDate: Date;
  /** Fin del periodo (inclusive). Si el empleo sigue vigente, usar la fecha de referencia. */
  endDate: Date;
  /** Salario Base de Cotización diario vigente durante este periodo. */
  sbc: number;
}

export interface SBCAverageResult {
  /** SBC promedio ponderado por días dentro de la ventana. */
  average: number;
  /** Días de la ventana efectivamente cubiertos por los periodos dados. */
  daysCovered: number;
  /** Días totales de la ventana solicitada (semanas × 7). */
  expectedDays: number;
  /** Si los periodos cubren la ventana completa (con un margen pequeño). */
  isComplete: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calcula el SBC promedio ponderado por días dentro de la ventana de
 * `weeks` semanas previas a `referenceDate`.
 *
 * @returns null si no hay periodos o ninguno se traslapa con la ventana.
 */
export function calculateWeightedAverageSBC(
  periods: SBCPeriod[],
  referenceDate: Date,
  weeks: number,
): SBCAverageResult | null {
  if (periods.length === 0) return null;

  const expectedDays = weeks * 7;
  const windowEnd = referenceDate.getTime();
  const windowStart = windowEnd - expectedDays * MS_PER_DAY;

  let weightedSum = 0;
  let daysCovered = 0;

  for (const period of periods) {
    const start = Math.max(period.startDate.getTime(), windowStart);
    // +1 día porque endDate es inclusiva.
    const end = Math.min(period.endDate.getTime() + MS_PER_DAY, windowEnd);
    if (end <= start) continue;

    const days = (end - start) / MS_PER_DAY;
    weightedSum += days * period.sbc;
    daysCovered += days;
  }

  if (daysCovered <= 0) return null;

  return {
    average: round2(weightedSum / daysCovered),
    daysCovered: Math.round(daysCovered),
    expectedDays,
    isComplete: daysCovered >= expectedDays * 0.98,
  };
}

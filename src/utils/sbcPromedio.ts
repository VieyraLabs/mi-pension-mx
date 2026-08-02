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
 * Si dos o más periodos se traslapan (más de un patrón simultáneo), cada
 * día de traslape se cuenta UNA sola vez — nunca una vez por patrón — y se
 * usa el SBC más alto entre los patrones activos ese día. De lo contrario
 * los días simultáneos se contarían de más (inflando `daysCovered` más
 * allá de los días reales de la ventana) y el promedio quedaría subestimado
 * al dividir entre más días de los que en realidad hay.
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

  // Recorta cada periodo a la ventana solicitada (+1 día porque endDate es inclusiva).
  const clipped = periods
    .map((period) => ({
      start: Math.max(period.startDate.getTime(), windowStart),
      end: Math.min(period.endDate.getTime() + MS_PER_DAY, windowEnd),
      sbc: period.sbc,
    }))
    .filter((p) => p.end > p.start);

  if (clipped.length === 0) return null;

  // Barrido de intervalos: entre cada par de fronteras consecutivas (inicio
  // o fin de algún periodo recortado), se determina qué periodos siguen
  // activos y se toma el SBC más alto entre ellos para ese tramo.
  const boundaries = [...new Set(clipped.flatMap((p) => [p.start, p.end]))].sort((a, b) => a - b);

  let weightedSum = 0;
  let daysCovered = 0;

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segmentStart = boundaries[i]!;
    const segmentEnd = boundaries[i + 1]!;
    const activeSbcs = clipped
      .filter((p) => p.start <= segmentStart && p.end >= segmentEnd)
      .map((p) => p.sbc);
    if (activeSbcs.length === 0) continue;

    const days = (segmentEnd - segmentStart) / MS_PER_DAY;
    weightedSum += days * Math.max(...activeSbcs);
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

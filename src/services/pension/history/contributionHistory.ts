/**
 * Cálculo del SBC promedio de las ÚLTIMAS 250 SEMANAS COTIZADAS
 * (Art. 167 LSS 1973).
 *
 * REGLA LEGAL CENTRAL: son las últimas 250 semanas **cotizadas**, no las
 * últimas 250 semanas **calendario**. Si el asegurado dejó de trabajar por
 * un tiempo, esas semanas sin cotización no cuentan ni entran al promedio:
 * el recorrido sigue hacia atrás en el historial hasta reunir 250 semanas
 * con cotización registrada. Suponer "250 semanas = ~4.8 años calendario"
 * es incorrecto en cuanto existe cualquier hueco laboral.
 *
 * Funciones puras: no tocan UI, navegación ni formularios.
 */
import { SBC_AVERAGE_WEEKS } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';
import type {
  ContributionHistory,
  ContributionSummary,
  SBCPeriod,
  WeeklyContribution,
} from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const MS_PER_WEEK = DAYS_PER_WEEK * MS_PER_DAY;

/** Semana con cotización confirmada — su SBC es un número utilizable. */
type ContributedWeek = WeeklyContribution & { salaryBaseContribution: number };

function isContributedWeek(week: WeeklyContribution): week is ContributedWeek {
  return (
    week.contributed &&
    typeof week.salaryBaseContribution === 'number' &&
    week.salaryBaseContribution > 0
  );
}

/**
 * Suma del SBC ponderada por días dentro de la ventana `[windowStart, windowEnd)`.
 *
 * Los días con más de un patrón simultáneo suman los SBC de todos los
 * patrones activos ese día (integración de salarios por empleo simultáneo),
 * pero se cuentan UNA sola vez: las semanas cotizadas no se duplican por
 * tener varios patrones a la vez.
 */
function accumulateDailySBC(
  periods: readonly SBCPeriod[],
  windowStart: number,
  windowEnd: number,
): { days: number; weightedSum: number } {
  // Recorta cada periodo a la ventana (+1 día porque endDate es inclusiva).
  const clipped = periods
    .map((period) => ({
      start: Math.max(period.startDate.getTime(), windowStart),
      end: Math.min(period.endDate.getTime() + MS_PER_DAY, windowEnd),
      sbc: period.sbc,
    }))
    .filter((p) => p.end > p.start);

  if (clipped.length === 0) return { days: 0, weightedSum: 0 };

  // Barrido de intervalos: se parte la ventana en tramos por cada frontera
  // de inicio/fin, y en cada tramo se suman los SBC de los patrones activos.
  const boundaries = [...new Set(clipped.flatMap((p) => [p.start, p.end]))].sort((a, b) => a - b);

  let days = 0;
  let weightedSum = 0;

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segmentStart = boundaries[i]!;
    const segmentEnd = boundaries[i + 1]!;
    const activeSBCs = clipped
      .filter((p) => p.start <= segmentStart && p.end >= segmentEnd)
      .map((p) => p.sbc);
    if (activeSBCs.length === 0) continue;

    const segmentDays = (segmentEnd - segmentStart) / MS_PER_DAY;
    days += segmentDays;
    weightedSum += segmentDays * activeSBCs.reduce((sum, sbc) => sum + sbc, 0);
  }

  return { days, weightedSum };
}

/**
 * Expande los periodos de cotización a un historial semana por semana,
 * anclando las semanas a `referenceDate` y contando hacia atrás hasta el
 * inicio del periodo más antiguo.
 *
 * Las semanas sin cotización se conservan en el historial (marcadas con
 * `contributed: false`) — no se eliminan, porque sirven para el análisis
 * del historial laboral, conservación de derechos y reportes al usuario.
 */
export function buildContributionHistory(
  periods: readonly SBCPeriod[],
  referenceDate: Date,
): ContributionHistory {
  if (periods.length === 0) return { weeks: [] };

  const earliestStart = Math.min(...periods.map((p) => p.startDate.getTime()));
  const historyEnd = referenceDate.getTime();
  if (historyEnd <= earliestStart) return { weeks: [] };

  const weeks: WeeklyContribution[] = [];
  for (let weekEnd = historyEnd; weekEnd > earliestStart; weekEnd -= MS_PER_WEEK) {
    const weekStart = weekEnd - MS_PER_WEEK;
    const { days, weightedSum } = accumulateDailySBC(periods, weekStart, weekEnd);
    weeks.push(
      days > 0
        ? {
            date: new Date(weekStart),
            contributed: true,
            salaryBaseContribution: round2(weightedSum / days),
          }
        : { date: new Date(weekStart), contributed: false },
    );
  }

  // Se construyó de la más reciente a la más antigua; se devuelve en orden
  // cronológico ascendente.
  weeks.reverse();
  return { weeks };
}

/** Semanas del historial que sí tienen cotización registrada. */
export function getContributedWeeks(history: ContributionHistory): ContributedWeek[] {
  return history.weeks.filter(isContributedWeek);
}

/**
 * Las últimas `count` semanas COTIZADAS (250 por defecto, Art. 167 LSS 1973),
 * recorriendo el historial hacia atrás y saltándose los huecos sin
 * cotización. Devuelve menos de `count` si el historial no alcanza.
 */
export function getLastContributionWeeks(
  history: ContributionHistory,
  count: number = SBC_AVERAGE_WEEKS,
): ContributedWeek[] {
  return getContributedWeeks(history).slice(-count);
}

/** Promedio simple del SBC de las semanas dadas. Ignora las no cotizadas. */
export function calculateAverageSalary(weeks: readonly WeeklyContribution[]): number {
  const contributed = weeks.filter(isContributedWeek);
  if (contributed.length === 0) return 0;

  const total = contributed.reduce((sum, week) => sum + week.salaryBaseContribution, 0);
  return round2(total / contributed.length);
}

/**
 * Desglose completo del cálculo de las últimas `count` semanas cotizadas.
 *
 * @returns null si el historial no tiene ninguna semana cotizada.
 */
export function calculateContributionSummary(
  history: ContributionHistory,
  count: number = SBC_AVERAGE_WEEKS,
): ContributionSummary | null {
  const contributedWeeks = getContributedWeeks(history);
  if (contributedWeeks.length === 0) return null;

  const selected = contributedWeeks.slice(-count);
  const firstWeekUsed = selected[0]!.date;
  const lastWeekUsed = selected[selected.length - 1]!.date;

  return {
    totalWeeksInHistory: history.weeks.length,
    contributedWeeks: contributedWeeks.length,
    skippedWeeks: history.weeks.length - contributedWeeks.length,
    selectedWeeks: selected.length,
    averageSalary: calculateAverageSalary(selected),
    firstWeekUsed,
    lastWeekUsed,
    isComplete: selected.length >= count,
  };
}

/**
 * Atajo de un solo paso: de los periodos reconstruidos del historial al
 * desglose de las últimas 250 semanas cotizadas.
 */
export function summarizeLastContributedWeeks(
  periods: readonly SBCPeriod[],
  referenceDate: Date,
  count: number = SBC_AVERAGE_WEEKS,
): ContributionSummary | null {
  return calculateContributionSummary(buildContributionHistory(periods, referenceDate), count);
}

/**
 * Inicio del día (medianoche local) de la fecha dada, en milisegundos.
 * Se usa para comparar fechas por DÍA COMPLETO y no por instante.
 */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Inicio del día que queda `days` días después del día de `date`.
 * Se usa aritmética de calendario local para no desviarse por cambios de
 * horario de verano.
 */
function startOfDayPlusDays(date: Date, days: number): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days).getTime();
}

/**
 * Periodos que SOLAPAN la ventana de semanas usada en el promedio.
 *
 * El promedio del Art. 167 LSS 1973 se calcula sobre las últimas 250 semanas
 * COTIZADAS: un empleo anterior a esa ventana no pesa en el resultado (p. ej.
 * un trabajo de 2000 cuando el promedio usa 2018-2026). Esta función deja
 * explícito qué periodos entran al cálculo, para que la interfaz pueda
 * mostrar exactamente lo que se está considerando y no el historial completo.
 *
 * La ventana va de `firstWeekUsed` (inicio de la semana cotizada más antigua
 * usada) hasta `lastWeekUsed + 7 días` (fin de la semana más reciente usada);
 * `endDate` de un periodo es inclusiva.
 *
 * La comparación es por DÍA COMPLETO, no por instante: `firstWeekUsed` hereda
 * la hora de la fecha de referencia (p. ej. 13:03:06) mientras que las fechas
 * de los periodos son de medianoche. Un periodo que termina a medianoche del
 * mismo día calendario en que arranca la semana usada sí aporta días al
 * promedio, así que también debe aparecer en esta lista.
 *
 * NO cambia el cálculo: el promedio sigue usando el historial completo, que
 * es lo que permite saltar los huecos laborales y alcanzar las 250 semanas.
 */
export function selectPeriodsInAverageWindow(
  periods: readonly SBCPeriod[],
  summary: ContributionSummary,
): SBCPeriod[] {
  // Inicio del día de la semana más antigua usada.
  const windowStart = startOfDay(summary.firstWeekUsed);
  // `lastWeekUsed` es el INICIO de la última semana usada: esa semana cubre
  // 7 días, así que la ventana cierra al FINAL del día de `lastWeekUsed + 7`
  // (límite exclusivo = inicio del día siguiente).
  const windowEnd = startOfDayPlusDays(summary.lastWeekUsed, DAYS_PER_WEEK + 1);

  return periods.filter(
    (period) =>
      period.endDate.getTime() >= windowStart && period.startDate.getTime() < windowEnd,
  );
}

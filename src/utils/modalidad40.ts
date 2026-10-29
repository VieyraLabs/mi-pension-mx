/**
 * Utilidades de Modalidad 40 compartidas por el motor de cálculo y la
 * validación del formulario.
 */
import {
  MODALIDAD_40_CAP_TIMES_UMA,
  SBC_AVERAGE_WEEKS,
  WEEKS_PER_MONTH,
  WEEKS_PER_YEAR,
} from '../constants/ley73';
import { round2 } from './format';
import { countCotizedWeeksInDateRange } from './weeksProjection';

/**
 * Subconjunto de `Modalidad40` (más laxo en nulabilidad) que necesita
 * `calculateM40PlannedWeeks` — así también acepta la forma que produce el
 * parseo de `Modalidad40Schema` (Zod), donde los opcionales admiten `null`.
 */
interface Modalidad40WeeksInput {
  active: boolean;
  expectedMonths?: number | null;
}

const M40_MAX_MONTHS = 600;

/**
 * Meses contractuales de Modalidad 40 desde el mes siguiente a la referencia
 * hasta el mes de retiro inclusive.
 */
export function estimateM40Months(referenceDate: Date, retirementDate: Date): number {
  const firstM40Month = referenceDate.getFullYear() * 12 + referenceDate.getMonth() + 1;
  const retirementMonth = retirementDate.getFullYear() * 12 + retirementDate.getMonth();
  return Math.min(M40_MAX_MONTHS, Math.max(0, retirementMonth - firstM40Month + 1));
}

export function calculateM40PlannedWeeks(
  referenceDate: Date,
  retirementDate: Date,
): number {
  if (estimateM40Months(referenceDate, retirementDate) === 0) return 0;

  const startDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    1,
  );
  const months = estimateM40Months(referenceDate, retirementDate);
  const endDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + months + 1,
    0,
  );
  return countCotizedWeeksInDateRange(startDate, endDate);
}

export interface Modalidad40Summary {
  /** Semanas M40 que caen dentro de las 250 semanas de referencia (topadas). */
  referenceWeeks: number;
  /** Semanas previas al inicio de M40 que se conservan en el promedio (250 - referenceWeeks). */
  baseWeeks: number;
  /** SBC de M40 topado a 25 UMA, ya ajustado por el incremento anual esperado. */
  adjustedDailyM40Salary: number;
  /** Salario promedio ponderado estimado (250 sem.) — antes del tope 25 UMA. */
  estimatedAverageDailySalary: number;
  /** Total de semanas cotizadas = semanas existentes + semanas M40 planeadas. */
  estimatedTotalWeeks: number;
}

interface FullModalidad40Input extends Modalidad40WeeksInput {
  contributionSalary?: number | null;
  annualSalaryIncrease?: number | null;
}

/**
 * Cálculo espejo del bloque Modalidad 40 dentro de `AverageSalaryStep`,
 * expuesto para que las pantallas (Resumen / Resultados) puedan mostrar
 * los mismos números sin reimplementar la fórmula.
 *
 * Devuelve ceros / el salario base sin cambios si M40 no está activa o
 * faltan campos requeridos.
 */
export function calculateM40Summary(
  modalidad40: FullModalidad40Input,
  totalExistingWeeks: number,
  baseDailySalary: number,
  dailyUMA: number,
  plannedWeeks?: number,
): Modalidad40Summary {
  const empty: Modalidad40Summary = {
    referenceWeeks: 0,
    baseWeeks: 0,
    adjustedDailyM40Salary: 0,
    estimatedAverageDailySalary: baseDailySalary,
    estimatedTotalWeeks: totalExistingWeeks,
  };

  if (
    !modalidad40.active ||
    !modalidad40.contributionSalary ||
    modalidad40.expectedMonths == null
  ) {
    return empty;
  }

  const sbcM40Topado = Math.min(
    modalidad40.contributionSalary,
    MODALIDAD_40_CAP_TIMES_UMA * dailyUMA,
  );

  const referenceWeeks = SBC_AVERAGE_WEEKS;
  const m40Weeks = Math.min(
    plannedWeeks ?? modalidad40.expectedMonths * WEEKS_PER_MONTH,
    referenceWeeks,
  );
  const baseWeeks = referenceWeeks - m40Weeks;

  let adjustedDailyM40Salary = sbcM40Topado;
  if (modalidad40.annualSalaryIncrease && modalidad40.annualSalaryIncrease > 0) {
    const m40Years = m40Weeks / WEEKS_PER_YEAR;
    const increaseFactor = 1 + (modalidad40.annualSalaryIncrease / 100) * (m40Years / 2);
    adjustedDailyM40Salary = Math.min(
      sbcM40Topado * increaseFactor,
      MODALIDAD_40_CAP_TIMES_UMA * dailyUMA,
    );
  }

  const weightedAverage =
    (baseDailySalary * baseWeeks + adjustedDailyM40Salary * m40Weeks) / referenceWeeks;

  const estimatedTotalWeeks =
    totalExistingWeeks + (plannedWeeks ?? Math.round(modalidad40.expectedMonths * WEEKS_PER_MONTH));

  return {
    referenceWeeks: Math.round(m40Weeks),
    baseWeeks: Math.round(baseWeeks),
    adjustedDailyM40Salary: round2(adjustedDailyM40Salary),
    estimatedAverageDailySalary: round2(weightedAverage),
    estimatedTotalWeeks,
  };
}

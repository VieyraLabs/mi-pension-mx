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

/**
 * Subconjunto de `Modalidad40` (más laxo en nulabilidad) que necesita
 * `calculateM40PlannedWeeks` — así también acepta la forma que produce el
 * parseo de `Modalidad40Schema` (Zod), donde los opcionales admiten `null`.
 */
interface Modalidad40WeeksInput {
  active: boolean;
  expectedMonths?: number | null;
}

/**
 * Semanas que se sumarán al total de semanas cotizadas por los meses de
 * Modalidad 40 que el usuario planea contratar a futuro. `expectedMonths`
 * representa meses TODAVÍA NO cotizados (una proyección hacia adelante),
 * no meses ya incluidos en el historial laboral capturado — por eso se
 * suman al total en vez de solo usarse para el promedio del SBC.
 */
export function calculateM40PlannedWeeks(modalidad40: Modalidad40WeeksInput): number {
  if (!modalidad40.active || !modalidad40.expectedMonths) return 0;
  return Math.round(modalidad40.expectedMonths * WEEKS_PER_MONTH);
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
    !modalidad40.expectedMonths
  ) {
    return empty;
  }

  const sbcM40Topado = Math.min(
    modalidad40.contributionSalary,
    MODALIDAD_40_CAP_TIMES_UMA * dailyUMA,
  );

  const referenceWeeks = SBC_AVERAGE_WEEKS;
  const m40Weeks = Math.min(
    modalidad40.expectedMonths * WEEKS_PER_MONTH,
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

  const estimatedTotalWeeks = totalExistingWeeks + Math.round(modalidad40.expectedMonths * WEEKS_PER_MONTH);

  return {
    referenceWeeks: Math.round(m40Weeks),
    baseWeeks: Math.round(baseWeeks),
    adjustedDailyM40Salary: round2(adjustedDailyM40Salary),
    estimatedAverageDailySalary: round2(weightedAverage),
    estimatedTotalWeeks,
  };
}

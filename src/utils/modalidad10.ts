/**
 * Utilidades de Modalidad 10 compartidas por el motor de cálculo, el
 * formulario y la validación.
 *
 * La Modalidad 10 es la incorporación voluntaria al régimen obligatorio
 * (capítulo IX de la LSS vigente, Arts. 222 a 233): la base de cotización son
 * los ingresos declarados por la persona asegurada, acotados por los límites
 * del Art. 28 —el salario mínimo del área geográfica como piso y 25 UMA como
 * techo— y la cuota se calcula sin la aportación a INFONAVIT.
 *
 * Todo es función pura: aquí no hay UI ni estado.
 */
import {
  AVERAGE_DAYS_PER_MONTH,
  MODALIDAD_10_CAP_TIMES_UMA,
  MODALIDAD_10_CUOTA_PCT,
} from '../constants/ley73';
import { round2 } from './format';
import { countCotizedWeeksInDateRange } from './weeksProjection';

/**
 * Máximo de meses contractuales que admite el esquema de validación.
 * Es el horizonte máximo que el IMSS admite para la continuación voluntaria.
 */
export const M10_MAX_MONTHS = 600;

/**
 * Meses contractuales de Modalidad 10 desde el mes siguiente a la fecha de
 * referencia hasta el mes de retiro inclusive.
 */
export function estimateM10Months(referenceDate: Date, retirementDate: Date): number {
  const firstM10Month = referenceDate.getFullYear() * 12 + referenceDate.getMonth() + 1;
  const retirementMonth = retirementDate.getFullYear() * 12 + retirementDate.getMonth();
  return Math.min(M10_MAX_MONTHS, Math.max(0, retirementMonth - firstM10Month + 1));
}

/**
 * Semanas estimadas del periodo contractual de Modalidad 10 (por días
 * calendario, del primer día cotizable al último día del mes de retiro).
 */
export function calculateM10PlannedWeeks(
  referenceDate: Date,
  retirementDate: Date,
): number {
  if (estimateM10Months(referenceDate, retirementDate) === 0) return 0;

  const startDate = getM10StartDate(referenceDate);
  const months = estimateM10Months(referenceDate, retirementDate);
  const endDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + months + 1,
    0,
  );
  return countCotizedWeeksInDateRange(startDate, endDate);
}

/**
 * Primer día cotizable de la Modalidad 10: el 1º del mes calendario
 * siguiente a la fecha de referencia. No hay meses retroactivos (Art. 224 de
 * la LSS vigente).
 */
export function getM10StartDate(referenceDate: Date): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
}

/** Equivalente en UMAs de un SBC diario. */
export function m10SalaryInUMAs(dailySalary: number, dailyUMA: number): number {
  if (!dailyUMA || dailyUMA <= 0) return 0;
  return round2(dailySalary / dailyUMA);
}

/** SBC diario que corresponde a un número de UMAs. */
export function m10SalaryFromUMAs(umas: number, dailyUMA: number): number {
  return round2(umas * dailyUMA);
}

/** Rango legal del SBC que se puede declarar en la Modalidad 10. */
export interface M10SalaryRange {
  /** Piso: salario mínimo general del área geográfica. */
  minimumDailySalary: number;
  /** Piso expresado en UMAs (puede ser fraccionario). */
  minimumUMAs: number;
  /** Techo: 25 UMA. */
  maximumUMAs: number;
  /** Techo expresado en pesos diarios. */
  maximumDailySalary: number;
}

/**
 * Rango legal del SBC declarado (Art. 28 LSS vigente): el piso es el salario
 * mínimo del área geográfica y el techo son 25 UMA.
 *
 * @param dailyUMA UMA diaria vigente.
 * @param minimumDailySalary Salario mínimo de referencia (Zona A / CDMX).
 */
export function m10SalaryRange(
  dailyUMA: number,
  minimumDailySalary: number,
): M10SalaryRange {
  return {
    minimumDailySalary: round2(minimumDailySalary),
    minimumUMAs: m10SalaryInUMAs(minimumDailySalary, dailyUMA),
    maximumUMAs: MODALIDAD_10_CAP_TIMES_UMA,
    maximumDailySalary: round2(MODALIDAD_10_CAP_TIMES_UMA * dailyUMA),
  };
}

/** Acota un SBC al rango legal de la Modalidad 10. */
export function clampM10Salary(
  dailySalary: number,
  dailyUMA: number,
  minimumDailySalary: number,
): number {
  const range = m10SalaryRange(dailyUMA, minimumDailySalary);
  return round2(
    Math.min(Math.max(dailySalary, range.minimumDailySalary), range.maximumDailySalary),
  );
}

/**
 * Periodo de cotización de la Modalidad 10 dentro de la línea temporal del
 * SBC promedio (Art. 167 LSS 1973).
 */
export interface M10ContributionPeriod {
  /** Primer día cotizable (1º del mes siguiente a la fecha de referencia). */
  startDate: Date;
  /** Último día cotizable (fecha de retiro). */
  endDate: Date;
  /** SBC diario efectivo del periodo (ya combinado y topado). */
  dailySalary: number;
  /** SBC diario declarado en la Modalidad 10, sin combinar. */
  declaredDailySalary: number;
  /** SBC ordinario que se suma cuando la persona sigue trabajando. */
  ordinaryDailySalary: number;
  /** Si la persona sigue trabajando mientras cotiza en la Modalidad 10. */
  continuesWorking: boolean;
  /** Meses contractuales del periodo. */
  months: number;
}

/**
 * Construye el periodo de cotización de la Modalidad 10.
 *
 * El SBC efectivo del periodo es:
 * - `último salario registrado + salario de M10` si la persona sigue
 *   trabajando (las dos cotizaciones conviven en el mismo mes, como dos
 *   patrones simultáneos); o
 * - `salario de M10` solamente si ya no trabaja.
 *
 * En ambos casos se topa a 25 UMA (Art. 28 LSS vigente) y, si se declara un
 * incremento salarial anual esperado, se aplica como factor de punto medio
 * sobre el horizonte completo (aproximación declarada como estimación).
 *
 * Devuelve `null` cuando no hay un mes contractual completo por delante.
 */
export function buildM10ContributionPeriod(params: {
  referenceDate: Date;
  retirementDate: Date;
  /** SBC diario declarado en la Modalidad 10. */
  m10DailySalary: number;
  /** SBC ordinario vigente (último registrado o el capturado). */
  ordinaryDailySalary: number;
  /** Si la persona sigue trabajando mientras cotiza en la Modalidad 10. */
  continuesWorking: boolean;
  /** Incremento salarial anual esperado (%). */
  annualSalaryIncreasePct?: number;
  /** UMA diaria vigente (para el tope). */
  dailyUMA: number;
}): M10ContributionPeriod | null {
  const months = estimateM10Months(params.referenceDate, params.retirementDate);
  if (months === 0) return null;

  const startDate = getM10StartDate(params.referenceDate);
  const endDate = params.retirementDate;

  const combined =
    params.continuesWorking
      ? params.ordinaryDailySalary + params.m10DailySalary
      : params.m10DailySalary;

  let dailySalary = combined;
  const increasePct = params.annualSalaryIncreasePct ?? 0;
  if (increasePct > 0) {
    // El incremento se aplica en el punto medio del horizonte (aproximación).
    const years = months / 12;
    dailySalary = combined * (1 + (increasePct / 100) * (years / 2));
  }

  dailySalary = Math.min(dailySalary, MODALIDAD_10_CAP_TIMES_UMA * params.dailyUMA);

  return {
    startDate,
    endDate,
    dailySalary: round2(dailySalary),
    declaredDailySalary: round2(params.m10DailySalary),
    ordinaryDailySalary: round2(params.ordinaryDailySalary),
    continuesWorking: params.continuesWorking,
    months,
  };
}

/**
 * Costo mensual estimado de la Modalidad 10, SIN la aportación a INFONAVIT
 * (que es un ahorro adicional y no una prima de financiamiento; Art. 228 de
 * la LSS vigente).
 */
export function calculateM10MonthlyCost(
  dailySalary: number,
  cuotaPct: number = MODALIDAD_10_CUOTA_PCT,
): number {
  const monthlySalary = round2(dailySalary * AVERAGE_DAYS_PER_MONTH);
  return round2(monthlySalary * cuotaPct);
}

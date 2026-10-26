/**
 * Utilidades de proyección de semanas compartidas por el motor de cálculo,
 * el esquema de validación y el formulario.
 *
 * Una persona que todavía no llega a la edad de retiro seguirá cotizando: el
 * horizonte de semanas hasta la edad de retiro es el supuesto que permite
 * estimar si se alcanzará el mínimo legal de 500 semanas (Arts. 138 y 145
 * LSS 1973) y cuántos años excedentes habría al jubilarse (Art. 167 LSS 1973).
 *
 * NOTA: la edad actual se toma del dato de entrada (`personalData.age`), nunca
 * de `new Date()` — el motor debe ser determinista (mismo input → mismo
 * resultado).
 */
import { MONTHS_PER_YEAR, WEEKS_PER_YEAR } from '../constants/ley73';

export interface WeeksProjection {
  /** Semanas ya cotizadas a la fecha. */
  currentWeeks: number;
  /** Semanas proyectadas entre hoy y la edad de retiro. */
  projectedWeeks: number;
  /** Semanas con las que se calcula (currentWeeks + futuro). */
  targetWeeks: number;
  /** Años que faltan hasta la edad de retiro. */
  yearsToRetirement: number;
}

/** Desglose narrado de una proyección de semanas. */
export interface WeeksNarrative {
  /** Semanas ya cotizadas. */
  currentWeeks: number;
  /** Semanas proyectadas hasta la edad de retiro. */
  projectedWeeks: number;
  /** Semanas de Modalidad 40 que exceden el horizonte (0 si no las hay). */
  m40ExtraWeeks: number;
  /** Semanas con las que se jubila el asegurado. */
  targetWeeks: number;
  /**
   * Partes del desglose, en el orden en que se narran:
   * "100 cotizadas", "1820 proyectadas hasta la edad de retiro", ...
   */
  parts: string[];
  /**
   * Desglose completo: "100 cotizadas + 1820 proyectadas hasta la edad de
   * retiro = 1920". Mismo texto para el motor y para la validación.
   */
  breakdown: string;
}

/**
 * Calcula la proyección de semanas hasta la edad de retiro.
 *
 * Las semanas de Modalidad 40 planeadas caen DENTRO del horizonte hasta la
 * fecha de retiro, así que se toma el mayor de los dos (proyección vs. M40)
 * y nunca la suma: de otro modo las semanas de M40 se contarían dos veces.
 */
export function calculateWeeksProjection(params: {
  currentWeeks: number;
  age: number;
  retirementAge: number;
  m40PlannedWeeks: number;
}): WeeksProjection {
  const yearsToRetirement = Math.max(0, params.retirementAge - params.age);
  const projectedWeeks = yearsToRetirement * WEEKS_PER_YEAR;
  const targetWeeks = params.currentWeeks + Math.max(projectedWeeks, params.m40PlannedWeeks);

  return {
    currentWeeks: params.currentWeeks,
    projectedWeeks,
    targetWeeks,
    yearsToRetirement,
  };
}

/**
 * Meses que faltan hasta la edad de retiro — horizonte sugerido para los
 * meses esperados de Modalidad 40.
 */
export function estimateMonthsToRetirement(age: number, retirementAge: number): number {
  return Math.max(0, retirementAge - age) * MONTHS_PER_YEAR;
}

/**
 * Narra una proyección de semanas con las MISMAS cifras que usa el motor.
 *
 * La comparten el paso de incrementos anuales (Art. 167 LSS 1973) y el
 * esquema de validación del mínimo de 500 semanas (Arts. 138 y 145 LSS 1973):
 * así el desglose que ve la persona usuaria y el error de validación no
 * pueden contradecirse.
 *
 * @param retirementAge Si se indica, el horizonte se nombra con la edad de
 * retiro ("proyectadas hasta los 65 años"); si no, se nombra en general
 * ("proyectadas hasta la edad de retiro").
 */
export function describeWeeksProjection(
  projection: WeeksProjection,
  retirementAge?: number,
): WeeksNarrative {
  const { currentWeeks, projectedWeeks, targetWeeks } = projection;

  // Las semanas de Modalidad 40 que exceden el horizonte hasta la edad de
  // retiro son el único horizonte que puede sumar semanas por encima de la
  // proyección (no se cuentan dos veces).
  const m40ExtraWeeks = Math.max(0, targetWeeks - (currentWeeks + projectedWeeks));

  const horizonte =
    retirementAge !== undefined
      ? `proyectadas hasta los ${retirementAge} años`
      : 'proyectadas hasta la edad de retiro';

  const parts: string[] = [`${currentWeeks} cotizadas`];
  if (projectedWeeks > 0) {
    parts.push(`${projectedWeeks} ${horizonte}`);
  }
  if (m40ExtraWeeks > 0) {
    parts.push(`${m40ExtraWeeks} planeadas en Modalidad 40`);
  }

  return {
    currentWeeks,
    projectedWeeks,
    m40ExtraWeeks,
    targetWeeks,
    parts,
    breakdown: `${parts.join(' + ')} = ${targetWeeks}`,
  };
}

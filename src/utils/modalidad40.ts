/**
 * Utilidades de Modalidad 40 compartidas por el motor de cálculo y la
 * validación del formulario.
 */
import { WEEKS_PER_MONTH } from '../constants/ley73';

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

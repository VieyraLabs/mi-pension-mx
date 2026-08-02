/**
 * Paso 3: Cálculo de incrementos anuales por semanas excedentes.
 * Por cada 52 semanas cotizadas adicionales a las 500 mínimas,
 * se aplica un porcentaje de incremento según la tabla Art. 167.
 *
 * Fuente: Art. 167 LSS 1973 — párrafo de incrementos anuales.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DAYS_PER_YEAR_UMA, MINIMUM_WEEKS_VEJEZ, WEEKS_PER_YEAR } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AnnualIncrementsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, basicAmount, annualIncrementPct, effectiveDailySalary } = ctx;
  const totalWeeks = input.workHistory.totalWeeks;
  const steps = [...ctx.steps];

  // Semanas excedentes sobre el mínimo
  const excessWeeks = Math.max(0, totalWeeks - MINIMUM_WEEKS_VEJEZ);
  // Años completos excedentes (cada 52 semanas = 1 año de incremento)
  const excessYears = Math.floor(excessWeeks / WEEKS_PER_YEAR);

  // El incremento se calcula sobre el SBC anual y luego se divide entre 12 para obtener el mensual
  // Fuente: Art. 167 LSS 1973 — cada año adicional incrementa en annualIncrementPct% del SBC
  // Fórmula: Incremento Anual = Salario Diario × 365 × Porcentaje
  // Incremento Mensual = Incremento Anual / 12
  const annualIncrement = round2(effectiveDailySalary * DAYS_PER_YEAR_UMA * (annualIncrementPct / 100));
  const annualIncrements = round2(annualIncrement / 12 * excessYears);
  const subtotalBeforeFactor = round2(basicAmount + annualIncrements);

  steps.push({
    id: 'incrementos_anuales',
    title: '3. Incrementos Anuales por Semanas Excedentes',
    description:
      `Semanas totales: ${totalWeeks} − 500 mínimas = ${excessWeeks} excedentes → ` +
      `${excessYears} años completos × ${annualIncrementPct}% × $${effectiveDailySalary.toFixed(2)}/día × 365 días = ` +
      `$${annualIncrement.toFixed(2)}/año → $${annualIncrements.toFixed(2)}/mes adicionales`,
    value: annualIncrements,
    formula: `floor((semanas − 500) / 52) × ${annualIncrementPct}% × SBC_diario × 365 ÷ 12`,
    legalBasis: 'Art. 167 LSS 1973 — incrementos anuales por semanas adicionales',
    isEstimate: false,
  });

  steps.push({
    id: 'subtotal_cuantia',
    title: '4. Cuantía Total (Básica + Incrementos)',
    description:
      `Cuantía básica $${basicAmount.toFixed(2)} + Incrementos $${annualIncrements.toFixed(2)} = $${subtotalBeforeFactor.toFixed(2)}/mes`,
    value: subtotalBeforeFactor,
    formula: 'Cuantía_básica + Incrementos_anuales',
    legalBasis: 'Art. 167 LSS 1973',
    isEstimate: true,
  });

  return {
    ...ctx,
    excessYears,
    annualIncrements,
    subtotalBeforeFactor,
    steps,
  };
};

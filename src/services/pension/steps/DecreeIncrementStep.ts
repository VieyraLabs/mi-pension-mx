/**
 * Paso 5: Incremento del 11% sobre la cuantía (Decreto DOF 2001/2004).
 * Se aplica sobre la cuantía básica + incrementos anuales, antes del
 * factor de edad.
 *
 * Fuente: Decreto por el que se reforman y adicionan los artículos Décimo
 * Cuarto y Vigésimo Cuarto Transitorios del Decreto que reforma y adiciona
 * diversas disposiciones de la Ley del Seguro Social.
 * DOF 20-dic-2001, modificado DOF 5-ene-2004.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DECREE_11_INCREMENT } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const DecreeIncrementStep: CalculationStep = (ctx): CalculationContext => {
  const { subtotalBeforeFactor } = ctx;
  const steps = [...ctx.steps];

  const decree11Increment = round2(subtotalBeforeFactor * DECREE_11_INCREMENT);
  const subtotalWithDecree = round2(subtotalBeforeFactor + decree11Increment);

  steps.push({
    id: 'incremento_decreto_11',
    title: '5. Incremento del 11% (Decreto DOF 2001/2004)',
    description:
      `Cuantía $${subtotalBeforeFactor.toFixed(2)} × ${(DECREE_11_INCREMENT * 100).toFixed(0)}% = ` +
      `$${decree11Increment.toFixed(2)} adicionales → $${subtotalWithDecree.toFixed(2)}/mes`,
    value: subtotalWithDecree,
    formula: `Cuantía × (1 + ${DECREE_11_INCREMENT})`,
    legalBasis:
      'Decreto DOF 20-dic-2001 (arts. Décimo Cuarto y Vigésimo Cuarto Transitorios LSS), ' +
      'modificado DOF 5-ene-2004',
    isEstimate: false,
  });

  return {
    ...ctx,
    decree11Increment,
    subtotalBeforeFactor: subtotalWithDecree,
    steps,
  };
};

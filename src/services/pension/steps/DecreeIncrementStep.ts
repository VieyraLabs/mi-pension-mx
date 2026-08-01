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
import { INCREMENTO_DECRETO_11 } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const DecreeIncrementStep: CalculationStep = (ctx): CalculationContext => {
  const { subtotalAntesFactor } = ctx;
  const pasos = [...ctx.pasos];

  const incrementoDecreto11Monto = round2(subtotalAntesFactor * INCREMENTO_DECRETO_11);
  const subtotalConDecreto = round2(subtotalAntesFactor + incrementoDecreto11Monto);

  pasos.push({
    id: 'incremento_decreto_11',
    titulo: '5. Incremento del 11% (Decreto DOF 2001/2004)',
    descripcion:
      `Cuantía $${subtotalAntesFactor.toFixed(2)} × ${(INCREMENTO_DECRETO_11 * 100).toFixed(0)}% = ` +
      `$${incrementoDecreto11Monto.toFixed(2)} adicionales → $${subtotalConDecreto.toFixed(2)}/mes`,
    valor: subtotalConDecreto,
    formula: `Cuantía × (1 + ${INCREMENTO_DECRETO_11})`,
    baseLegal:
      'Decreto DOF 20-dic-2001 (arts. Décimo Cuarto y Vigésimo Cuarto Transitorios LSS), ' +
      'modificado DOF 5-ene-2004',
    esEstimacion: false,
  });

  return {
    ...ctx,
    incrementoDecreto11Monto,
    subtotalAntesFactor: subtotalConDecreto,
    pasos,
  };
};

/**
 * Paso 5: Factor de edad para Cesantía en Edad Avanzada.
 * Si el retiro es antes de los 65 años, se aplica un factor de reducción.
 *
 * Fuente: Arts. 139–140 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  CESANTIA_AGE_FACTORS,
  VEJEZ_AGE,
  MINIMUM_CESANTIA_AGE,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AgeFactorStep: CalculationStep = (ctx): CalculationContext => {
  const { input, subtotalBeforeFactor } = ctx;
  const retirementAge = input.personalData.retirementAge;
  const steps = [...ctx.steps];
  const warnings = [...ctx.warnings];

  // Determinar tipo de pensión y factor de edad
  const pensionType = retirementAge >= VEJEZ_AGE ? 'vejez' : 'cesantia_edad_avanzada';

  // El factor de edad solo aplica para Cesantía (60–64 años)
  // Para Vejez (65+) el factor es 1.0
  let ageFactor = 1.0;
  if (pensionType === 'cesantia_edad_avanzada') {
    // Clamp a los rangos válidos
    const clampedAge = Math.max(MINIMUM_CESANTIA_AGE, Math.min(retirementAge, VEJEZ_AGE));
    ageFactor = CESANTIA_AGE_FACTORS[clampedAge] ?? 0.75;
  }

  const quantityWithFactor = round2(subtotalBeforeFactor * ageFactor);

  if (pensionType === 'cesantia_edad_avanzada') {
    warnings.push(
      `Pensión de Cesantía en Edad Avanzada a los ${retirementAge} años: ` +
        `se aplica factor de ${(ageFactor * 100).toFixed(0)}% sobre la cuantía. ` +
        `(Art. 139 LSS 1973)`,
    );
  }

  steps.push({
    id: 'factor_edad',
    title: `6. Factor por Edad de Retiro (${pensionType === 'vejez' ? 'Vejez' : 'Cesantía en Edad Avanzada'})`,
    description:
      pensionType === 'vejez'
        ? `Pensión de Vejez a los ${retirementAge} años: factor 100% (sin reducción). ` +
          `Cuantía: $${quantityWithFactor.toFixed(2)}/mes`
        : `Cesantía en Edad Avanzada a los ${retirementAge} años: factor ${(ageFactor * 100).toFixed(0)}%. ` +
          `$${subtotalBeforeFactor.toFixed(2)} × ${(ageFactor * 100).toFixed(0)}% = $${quantityWithFactor.toFixed(2)}/mes`,
    value: quantityWithFactor,
    formula:
      pensionType === 'vejez'
        ? 'Cuantía × 100% (sin reducción)'
        : `Cuantía × ${(ageFactor * 100).toFixed(0)}%`,
    legalBasis:
      pensionType === 'vejez'
        ? 'Art. 145 LSS 1973 — Pensión de Vejez (65 años)'
        : `Art. 139 LSS 1973 — Factor de reducción Cesantía en Edad Avanzada`,
    isEstimate: false,
  });

  return {
    ...ctx,
    pensionType,
    ageFactor,
    quantityWithFactor,
    steps,
    warnings,
  };
};

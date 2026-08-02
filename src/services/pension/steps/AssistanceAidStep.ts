/**
 * Paso 7: Ayuda asistencial.
 * Cuando el pensionado no tiene beneficiarios con derecho a asignación familiar,
 * se otorga una ayuda asistencial adicional.
 *
 * Fuente: Art. 165 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  ASSISTANCE_AID_NO_BENEFICIARIES_PCT,
  ASSISTANCE_AID_SPOUSE_NO_CHILDREN_PCT,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AssistanceAidStep: CalculationStep = (ctx): CalculationContext => {
  const { input, quantityWithFactor } = ctx;
  const { beneficiaries } = input;
  const steps = [...ctx.steps];

  let assistanceAid = 0;
  let description = '';
  let formula = '$0';

  const hasBeneficiaries =
    beneficiaries.hasSpouse ||
    (beneficiaries.hasMinorChildren && beneficiaries.numberOfMinorChildren > 0) ||
    (beneficiaries.hasDependentParents && beneficiaries.numberOfDependentParents > 0);

  if (!hasBeneficiaries) {
    // Sin ningún beneficiario: ayuda del 15%
    assistanceAid = round2(quantityWithFactor * ASSISTANCE_AID_NO_BENEFICIARIES_PCT);
    description = `Sin beneficiarios: ayuda asistencial ${(ASSISTANCE_AID_NO_BENEFICIARIES_PCT * 100).toFixed(0)}% = +$${assistanceAid.toFixed(2)}/mes`;
    formula = `Cuantía × ${(ASSISTANCE_AID_NO_BENEFICIARIES_PCT * 100).toFixed(0)}%`;
  } else if (beneficiaries.hasSpouse && !beneficiaries.hasMinorChildren) {
    // Tiene cónyuge pero no hijos: ayuda del 10%
    assistanceAid = round2(quantityWithFactor * ASSISTANCE_AID_SPOUSE_NO_CHILDREN_PCT);
    description = `Con cónyuge pero sin hijos: ayuda asistencial ${(ASSISTANCE_AID_SPOUSE_NO_CHILDREN_PCT * 100).toFixed(0)}% = +$${assistanceAid.toFixed(2)}/mes`;
    formula = `Cuantía × ${(ASSISTANCE_AID_SPOUSE_NO_CHILDREN_PCT * 100).toFixed(0)}%`;
  } else {
    description = 'Sin ayuda asistencial (beneficiarios con asignación familiar activa)';
  }

  steps.push({
    id: 'ayuda_asistencial',
    title: '8. Ayuda Asistencial',
    description,
    value: assistanceAid,
    formula,
    legalBasis: 'Art. 165 LSS 1973',
    isEstimate: false,
  });

  return {
    ...ctx,
    assistanceAid,
    steps,
  };
};

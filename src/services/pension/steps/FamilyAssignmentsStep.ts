/**
 * Paso 6: Asignaciones familiares.
 * Se suman a la cuantía de la pensión los porcentajes por beneficiarios.
 *
 * Fuente: Arts. 163–164 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  SPOUSE_ALLOWANCE_PCT,
  CHILD_ALLOWANCE_PCT,
  PARENT_ALLOWANCE_PCT,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const FamilyAssignmentsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, quantityWithFactor } = ctx;
  const { beneficiaries } = input;
  const steps = [...ctx.steps];
  const details: string[] = [];

  let familyAllowances = 0;

  // Asignación por cónyuge / concubina (Art. 164, fr. I)
  if (beneficiaries.hasSpouse) {
    const amount = round2(quantityWithFactor * SPOUSE_ALLOWANCE_PCT);
    familyAllowances += amount;
    details.push(`Cónyuge/concubina: +${(SPOUSE_ALLOWANCE_PCT * 100).toFixed(0)}% = +$${amount.toFixed(2)}`);
  }

  // Asignación por hijos menores (Art. 164, fr. II)
  if (beneficiaries.hasMinorChildren && beneficiaries.numberOfMinorChildren > 0) {
    const childrenAmount = round2(
      quantityWithFactor * CHILD_ALLOWANCE_PCT * beneficiaries.numberOfMinorChildren,
    );
    familyAllowances += childrenAmount;
    details.push(
      `${beneficiaries.numberOfMinorChildren} hijo(s) menor(es): ` +
        `${beneficiaries.numberOfMinorChildren} × +${(CHILD_ALLOWANCE_PCT * 100).toFixed(0)}% = +$${childrenAmount.toFixed(2)}`,
    );
  }

  // Asignación por ascendientes (Art. 164, fr. III)
  // Solo aplica cuando no hay cónyuge ni hijos
  if (
    !beneficiaries.hasSpouse &&
    !beneficiaries.hasMinorChildren &&
    beneficiaries.hasDependentParents &&
    beneficiaries.numberOfDependentParents > 0
  ) {
    const parentsAmount = round2(
      quantityWithFactor * PARENT_ALLOWANCE_PCT * beneficiaries.numberOfDependentParents,
    );
    familyAllowances += parentsAmount;
    details.push(
      `${beneficiaries.numberOfDependentParents} ascendiente(s) dependiente(s): ` +
        `${beneficiaries.numberOfDependentParents} × +${(PARENT_ALLOWANCE_PCT * 100).toFixed(0)}% = +$${parentsAmount.toFixed(2)}`,
    );
  }

  familyAllowances = round2(familyAllowances);

  steps.push({
    id: 'asignaciones_familiares',
    title: '7. Asignaciones Familiares',
    description:
      details.length > 0
        ? details.join('; ') + ` | Total asignaciones: +$${familyAllowances.toFixed(2)}/mes`
        : 'Sin asignaciones familiares (sin beneficiarios registrados)',
    value: familyAllowances,
    formula:
      details.length > 0
        ? 'Cuantía × (15% cónyuge + 10% × hijos + 10% × ascendientes)'
        : '$0',
    legalBasis: 'Arts. 163–164 LSS 1973',
    isEstimate: false,
  });

  return {
    ...ctx,
    familyAllowances,
    steps,
  };
};

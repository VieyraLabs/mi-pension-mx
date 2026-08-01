/**
 * Paso 7: Ayuda asistencial.
 * Cuando el pensionado no tiene beneficiarios con derecho a asignación familiar,
 * se otorga una ayuda asistencial adicional.
 *
 * Fuente: Art. 165 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  AYUDA_ASISTENCIAL_SIN_BENEFICIARIOS_PCT,
  AYUDA_ASISTENCIAL_CON_CONYUGE_SIN_HIJOS_PCT,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AssistanceAidStep: CalculationStep = (ctx): CalculationContext => {
  const { input, cuantiaConFactor } = ctx;
  const { beneficiarios } = input;
  const pasos = [...ctx.pasos];

  let ayudaAsistencial = 0;
  let descripcion = '';
  let formula = '$0';

  const tieneBeneficiarios =
    beneficiarios.tieneConyuge ||
    (beneficiarios.tieneHijosMenores && beneficiarios.numeroHijosMenores > 0) ||
    (beneficiarios.tienePadresDependientes && beneficiarios.numeroPadresDependientes > 0);

  if (!tieneBeneficiarios) {
    // Sin ningún beneficiario: ayuda del 15%
    ayudaAsistencial = round2(cuantiaConFactor * AYUDA_ASISTENCIAL_SIN_BENEFICIARIOS_PCT);
    descripcion = `Sin beneficiarios: ayuda asistencial ${(AYUDA_ASISTENCIAL_SIN_BENEFICIARIOS_PCT * 100).toFixed(0)}% = +$${ayudaAsistencial.toFixed(2)}/mes`;
    formula = `Cuantía × ${(AYUDA_ASISTENCIAL_SIN_BENEFICIARIOS_PCT * 100).toFixed(0)}%`;
  } else if (beneficiarios.tieneConyuge && !beneficiarios.tieneHijosMenores) {
    // Tiene cónyuge pero no hijos: ayuda del 10%
    ayudaAsistencial = round2(cuantiaConFactor * AYUDA_ASISTENCIAL_CON_CONYUGE_SIN_HIJOS_PCT);
    descripcion = `Con cónyuge pero sin hijos: ayuda asistencial ${(AYUDA_ASISTENCIAL_CON_CONYUGE_SIN_HIJOS_PCT * 100).toFixed(0)}% = +$${ayudaAsistencial.toFixed(2)}/mes`;
    formula = `Cuantía × ${(AYUDA_ASISTENCIAL_CON_CONYUGE_SIN_HIJOS_PCT * 100).toFixed(0)}%`;
  } else {
    descripcion = 'Sin ayuda asistencial (beneficiarios con asignación familiar activa)';
  }

  pasos.push({
    id: 'ayuda_asistencial',
    titulo: '7. Ayuda Asistencial',
    descripcion,
    valor: ayudaAsistencial,
    formula,
    baseLegal: 'Art. 165 LSS 1973',
    esEstimacion: false,
  });

  return {
    ...ctx,
    ayudaAsistencial,
    pasos,
  };
};

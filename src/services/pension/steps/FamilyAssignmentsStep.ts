/**
 * Paso 6: Asignaciones familiares.
 * Se suman a la cuantía de la pensión los porcentajes por beneficiarios.
 *
 * Fuente: Arts. 163–164 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  ASIGNACION_CONYUGE_PCT,
  ASIGNACION_HIJO_PCT,
  ASIGNACION_ASCENDIENTE_PCT,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const FamilyAssignmentsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, cuantiaConFactor } = ctx;
  const { beneficiarios } = input;
  const pasos = [...ctx.pasos];
  const detalles: string[] = [];

  let asignacionesFamiliares = 0;

  // Asignación por cónyuge / concubina (Art. 164, fr. I)
  if (beneficiarios.tieneConyuge) {
    const monto = round2(cuantiaConFactor * ASIGNACION_CONYUGE_PCT);
    asignacionesFamiliares += monto;
    detalles.push(`Cónyuge/concubina: +${(ASIGNACION_CONYUGE_PCT * 100).toFixed(0)}% = +$${monto.toFixed(2)}`);
  }

  // Asignación por hijos menores (Art. 164, fr. II)
  if (beneficiarios.tieneHijosMenores && beneficiarios.numeroHijosMenores > 0) {
    const montoHijos = round2(
      cuantiaConFactor * ASIGNACION_HIJO_PCT * beneficiarios.numeroHijosMenores,
    );
    asignacionesFamiliares += montoHijos;
    detalles.push(
      `${beneficiarios.numeroHijosMenores} hijo(s) menor(es): ` +
        `${beneficiarios.numeroHijosMenores} × +${(ASIGNACION_HIJO_PCT * 100).toFixed(0)}% = +$${montoHijos.toFixed(2)}`,
    );
  }

  // Asignación por ascendientes (Art. 164, fr. III)
  // Solo aplica cuando no hay cónyuge ni hijos
  if (
    !beneficiarios.tieneConyuge &&
    !beneficiarios.tieneHijosMenores &&
    beneficiarios.tienePadresDependientes &&
    beneficiarios.numeroPadresDependientes > 0
  ) {
    const montoAscendientes = round2(
      cuantiaConFactor * ASIGNACION_ASCENDIENTE_PCT * beneficiarios.numeroPadresDependientes,
    );
    asignacionesFamiliares += montoAscendientes;
    detalles.push(
      `${beneficiarios.numeroPadresDependientes} ascendiente(s) dependiente(s): ` +
        `${beneficiarios.numeroPadresDependientes} × +${(ASIGNACION_ASCENDIENTE_PCT * 100).toFixed(0)}% = +$${montoAscendientes.toFixed(2)}`,
    );
  }

  asignacionesFamiliares = round2(asignacionesFamiliares);

  pasos.push({
    id: 'asignaciones_familiares',
    titulo: '6. Asignaciones Familiares',
    descripcion:
      detalles.length > 0
        ? detalles.join('; ') + ` | Total asignaciones: +$${asignacionesFamiliares.toFixed(2)}/mes`
        : 'Sin asignaciones familiares (sin beneficiarios registrados)',
    valor: asignacionesFamiliares,
    formula:
      detalles.length > 0
        ? 'Cuantía × (15% cónyuge + 10% × hijos + 10% × ascendientes)'
        : '$0',
    baseLegal: 'Arts. 163–164 LSS 1973',
    esEstimacion: false,
  });

  return {
    ...ctx,
    asignacionesFamiliares,
    pasos,
  };
};

/**
 * Paso 5: Factor de edad para Cesantía en Edad Avanzada.
 * Si el retiro es antes de los 65 años, se aplica un factor de reducción.
 *
 * Fuente: Arts. 139–140 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  FACTORES_EDAD_CESANTIA,
  EDAD_VEJEZ,
  EDAD_MINIMA_CESANTIA,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AgeFactorStep: CalculationStep = (ctx): CalculationContext => {
  const { input, subtotalAntesFactor } = ctx;
  const edadRetiro = input.datosPersonales.edadRetiro;
  const pasos = [...ctx.pasos];
  const advertencias = [...ctx.advertencias];

  // Determinar tipo de pensión y factor de edad
  const tipoPension = edadRetiro >= EDAD_VEJEZ ? 'vejez' : 'cesantia_edad_avanzada';

  // El factor de edad solo aplica para Cesantía (60–64 años)
  // Para Vejez (65+) el factor es 1.0
  let factorEdad = 1.0;
  if (tipoPension === 'cesantia_edad_avanzada') {
    // Clamp a los rangos válidos
    const edadClamp = Math.max(EDAD_MINIMA_CESANTIA, Math.min(edadRetiro, EDAD_VEJEZ));
    factorEdad = FACTORES_EDAD_CESANTIA[edadClamp] ?? 0.75;
  }

  const cuantiaConFactor = round2(subtotalAntesFactor * factorEdad);

  if (tipoPension === 'cesantia_edad_avanzada') {
    advertencias.push(
      `Pensión de Cesantía en Edad Avanzada a los ${edadRetiro} años: ` +
        `se aplica factor de ${(factorEdad * 100).toFixed(0)}% sobre la cuantía. ` +
        `(Art. 139 LSS 1973)`,
    );
  }

  pasos.push({
    id: 'factor_edad',
    titulo: `5. Factor por Edad de Retiro (${tipoPension === 'vejez' ? 'Vejez' : 'Cesantía en Edad Avanzada'})`,
    descripcion:
      tipoPension === 'vejez'
        ? `Pensión de Vejez a los ${edadRetiro} años: factor 100% (sin reducción). ` +
          `Cuantía: $${cuantiaConFactor.toFixed(2)}/mes`
        : `Cesantía en Edad Avanzada a los ${edadRetiro} años: factor ${(factorEdad * 100).toFixed(0)}%. ` +
          `$${subtotalAntesFactor.toFixed(2)} × ${(factorEdad * 100).toFixed(0)}% = $${cuantiaConFactor.toFixed(2)}/mes`,
    valor: cuantiaConFactor,
    formula:
      tipoPension === 'vejez'
        ? 'Cuantía × 100% (sin reducción)'
        : `Cuantía × ${(factorEdad * 100).toFixed(0)}%`,
    baseLegal:
      tipoPension === 'vejez'
        ? 'Art. 145 LSS 1973 — Pensión de Vejez (65 años)'
        : `Art. 139 LSS 1973 — Factor de reducción Cesantía en Edad Avanzada`,
    esEstimacion: false,
  });

  return {
    ...ctx,
    tipoPension,
    factorEdad,
    cuantiaConFactor,
    pasos,
    advertencias,
  };
};

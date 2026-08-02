/**
 * Paso 8: Aplicación de límites — tope de pensión y Pensión Mínima Garantizada.
 * - Tope máximo: 25 UMA mensual (Art. 28 LSS vigente + operativa IMSS).
 * - Pensión Mínima Garantizada: equivalente al SMG vigente (Art. 170 LSS 1973).
 *
 * Fuente: Art. 28 LSS vigente; Art. 170 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { AVERAGE_DAYS_PER_MONTH, SBC_CAP_TIMES_UMA } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const LimitsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, quantityWithFactor, familyAllowances, assistanceAid } = ctx;
  const { uma } = input;
  const steps = [...ctx.steps];
  const warnings = [...ctx.warnings];

  // Total antes de límites
  const grossMonthlyTotal = round2(quantityWithFactor + familyAllowances + assistanceAid);

  // Tope máximo de pensión mensual = 25 UMA × 30.4
  // NOTA: El tope estrictamente aplica sobre el SBC (ya lo hacemos en AverageSalaryStep),
  // pero la pensión resultante también tiene un tope práctico derivado.
  const monthlyUMACap = round2(SBC_CAP_TIMES_UMA * uma.monthlyUMA);

  // Pensión Mínima Garantizada = SMG mensual (Art. 170 LSS 1973)
  // Usamos smgCdmx del registro UMA ya que el usuario seleccionó el año
  // SUPUESTO: usamos SMG de CDMX (más alto) como referencia conservadora
  // El IMSS usa el SMG de la zona del trabajador
  const dailySMG = uma.smgCdmx ?? uma.dailyUMA;
  const monthlyPMG = round2(dailySMG * AVERAGE_DAYS_PER_MONTH);

  let monthlyPension = grossMonthlyTotal;
  let capApplied = ctx.capApplied;
  let pmgApplied = false;

  // Verificar si supera el tope de pensión
  if (monthlyPension > monthlyUMACap) {
    monthlyPension = monthlyUMACap;
    capApplied = true;
    warnings.push(
      `La pensión calculada supera el tope máximo de 25 UMA mensuales ($${monthlyUMACap.toFixed(2)}). ` +
        `Se aplica el tope. (Art. 28 LSS vigente)`,
    );
  }

  // Verificar Pensión Mínima Garantizada
  if (monthlyPension < monthlyPMG) {
    monthlyPension = monthlyPMG;
    pmgApplied = true;
    warnings.push(
      `La pensión calculada es menor a la Pensión Mínima Garantizada ($${monthlyPMG.toFixed(2)}/mes = SMG de referencia). ` +
        `Se aplica la PMG. (Art. 170 LSS 1973) ` +
        `ESTIMACIÓN: El IMSS usará el SMG de tu zona geográfica.`,
    );
  }

  steps.push({
    id: 'subtotal_bruto',
    title: '9. Subtotal Bruto (Cuantía + Asignaciones + Ayuda)',
    description:
      `Cuantía con factor: $${quantityWithFactor.toFixed(2)} + ` +
      `Asignaciones: $${familyAllowances.toFixed(2)} + ` +
      `Ayuda asistencial: $${assistanceAid.toFixed(2)} = ` +
      `$${grossMonthlyTotal.toFixed(2)}/mes`,
    value: grossMonthlyTotal,
    formula: 'Cuantía_con_factor + Asignaciones_familiares + Ayuda_asistencial',
    legalBasis: 'Arts. 163–165 LSS 1973',
    isEstimate: true,
  });

  steps.push({
    id: 'limites',
    title: '10. Aplicación de Límites (Tope y PMG)',
    description:
      capApplied
        ? `Se aplica tope 25 UMA mensual: $${monthlyUMACap.toFixed(2)}/mes`
        : pmgApplied
          ? `Se aplica Pensión Mínima Garantizada: $${monthlyPMG.toFixed(2)}/mes`
          : `Pensión dentro de límites: $${monthlyPension.toFixed(2)}/mes`,
    value: monthlyPension,
    formula: `max(PMG, min(Total_bruto, 25 × UMA_mensual))`,
    legalBasis: 'Art. 28 LSS vigente (tope); Art. 170 LSS 1973 (PMG)',
    isEstimate: true,
    assumption:
      uma.smgCdmx
        ? 'PMG estimada usando el SMG de referencia capturado en la configuración UMA/SMG. El IMSS usará el SMG de la zona geográfica del trabajador.'
        : 'PMG estimada usando UMA como proxy del SMG porque no hay SMG capturado. El IMSS usará el SMG de la zona geográfica del trabajador.',
  });

  return {
    ...ctx,
    monthlyPension,
    capApplied,
    pmgApplied,
    steps,
    warnings,
  };
};

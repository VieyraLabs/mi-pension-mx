/**
 * Paso 8: Aplicación de límites — tope de pensión y Pensión Mínima Garantizada.
 * - Tope máximo: 25 UMA mensual (Art. 28 LSS vigente + operativa IMSS).
 * - Pensión Mínima Garantizada: equivalente al SMG vigente (Art. 170 LSS 1973).
 *
 * Fuente: Art. 28 LSS vigente; Art. 170 LSS 1973.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DIAS_PROMEDIO_MES, TOPE_SBC_VECES_UMA } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const LimitsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, cuantiaConFactor, asignacionesFamiliares, ayudaAsistencial } = ctx;
  const { uma } = input;
  const pasos = [...ctx.pasos];
  const advertencias = [...ctx.advertencias];

  // Total antes de límites
  const totalBrutoDiario = round2(cuantiaConFactor + asignacionesFamiliares + ayudaAsistencial);

  // Tope máximo de pensión mensual = 25 UMA × 30.4
  // NOTA: El tope estrictamente aplica sobre el SBC (ya lo hacemos en AverageSalaryStep),
  // pero la pensión resultante también tiene un tope práctico derivado.
  const topeUMAMensual = round2(TOPE_SBC_VECES_UMA * uma.umaMensual);

  // Pensión Mínima Garantizada = SMG mensual (Art. 170 LSS 1973)
  // Usamos smgCdmx del registro UMA ya que el usuario seleccionó el año
  // SUPUESTO: usamos SMG de CDMX (más alto) como referencia conservadora
  // El IMSS usa el SMG de la zona del trabajador
  const smgDiario = uma.smgCdmx ?? uma.umaDiaria;
  const pmgMensual = round2(smgDiario * DIAS_PROMEDIO_MES);

  let pensionMensual = totalBrutoDiario;
  let aplicoTope = ctx.aplicoTope;
  let aplicoPMG = false;

  // Verificar si supera el tope de pensión
  if (pensionMensual > topeUMAMensual) {
    pensionMensual = topeUMAMensual;
    aplicoTope = true;
    advertencias.push(
      `La pensión calculada supera el tope máximo de 25 UMA mensuales ($${topeUMAMensual.toFixed(2)}). ` +
        `Se aplica el tope. (Art. 28 LSS vigente)`,
    );
  }

  // Verificar Pensión Mínima Garantizada
  if (pensionMensual < pmgMensual) {
    pensionMensual = pmgMensual;
    aplicoPMG = true;
    advertencias.push(
      `La pensión calculada es menor a la Pensión Mínima Garantizada ($${pmgMensual.toFixed(2)}/mes = SMG de referencia). ` +
        `Se aplica la PMG. (Art. 170 LSS 1973) ` +
        `ESTIMACIÓN: El IMSS usará el SMG de tu zona geográfica.`,
    );
  }

  pasos.push({
    id: 'subtotal_bruto',
    titulo: '8. Subtotal Bruto (Cuantía + Asignaciones + Ayuda)',
    descripcion:
      `Cuantía con factor: $${cuantiaConFactor.toFixed(2)} + ` +
      `Asignaciones: $${asignacionesFamiliares.toFixed(2)} + ` +
      `Ayuda asistencial: $${ayudaAsistencial.toFixed(2)} = ` +
      `$${totalBrutoDiario.toFixed(2)}/mes`,
    valor: totalBrutoDiario,
    formula: 'Cuantía_con_factor + Asignaciones_familiares + Ayuda_asistencial',
    baseLegal: 'Arts. 163–165 LSS 1973',
    esEstimacion: true,
  });

  pasos.push({
    id: 'limites',
    titulo: '9. Aplicación de Límites (Tope y PMG)',
    descripcion:
      aplicoTope
        ? `Se aplica tope 25 UMA mensual: $${topeUMAMensual.toFixed(2)}/mes`
        : aplicoPMG
          ? `Se aplica Pensión Mínima Garantizada: $${pmgMensual.toFixed(2)}/mes`
          : `Pensión dentro de límites: $${pensionMensual.toFixed(2)}/mes`,
    valor: pensionMensual,
    formula: `max(PMG, min(Total_bruto, 25 × UMA_mensual))`,
    baseLegal: 'Art. 28 LSS vigente (tope); Art. 170 LSS 1973 (PMG)',
    esEstimacion: true,
    supuesto:
      uma.smgCdmx
        ? 'PMG estimada usando el SMG de referencia capturado en la configuración UMA/SMG. El IMSS usará el SMG de la zona geográfica del trabajador.'
        : 'PMG estimada usando UMA como proxy del SMG porque no hay SMG capturado. El IMSS usará el SMG de la zona geográfica del trabajador.',
  });

  return {
    ...ctx,
    pensionMensual,
    aplicoTope,
    aplicoPMG,
    pasos,
    advertencias,
  };
};

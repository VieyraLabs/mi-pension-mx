/**
 * Paso 2: Cálculo de la cuantía básica.
 * Busca el rango del SBC en la tabla del Art. 167 LSS 1973 y calcula
 * el porcentaje correspondiente sobre el salario promedio mensual.
 *
 * Fuente: Art. 167 LSS 1973 — Tabla de cuantías básicas.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { TABLA_ART167 } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

/**
 * Busca la entrada de la tabla Art. 167 correspondiente al salario
 * expresado en veces el Salario Mínimo General (SMG).
 */
function buscarEntradaTabla(vecesSMG: number) {
  const entrada = TABLA_ART167.find(
    (e) => vecesSMG >= e.rangoMin && vecesSMG <= e.rangoMax,
  );
  // Fallback al último rango si excede el máximo
  return entrada ?? TABLA_ART167[TABLA_ART167.length - 1]!;
}

export const BasicQuantityStep: CalculationStep = (ctx): CalculationContext => {
  const { input, salarioEfectivoDiario } = ctx;
  const { uma } = input;
  const smgDiario = uma.anio <= 2026 ? input.uma.umaDiaria : input.uma.umaDiaria;
  const pasos = [...ctx.pasos];
  const advertencias = [...ctx.advertencias];

  // Expresar el SBC en veces el SMG
  // NOTA IMPORTANTE: La tabla Art. 167 usa el SMG como referencia.
  // El IMSS opera con el SMG de la zona geográfica del trabajador.
  // Supuesto: usamos el SMG de CDMX (el más alto) como referencia.
  // El valor del SMG se obtiene del registro UMA del año correspondiente.
  const smgRef = input.uma.umaDiaria; // Ver nota: usamos UMA como proxy del SMG actualizado
  // SUPUESTO DOCUMENTADO: Desde 2016, con la deindexación, hay ambigüedad
  // sobre si la tabla Art. 167 debe aplicarse usando SMG o UMA.
  // Esta aplicación usa el valor de la UMA como referencia para el rango,
  // lo cual es el enfoque más conservador y común en calculadoras actuales.
  // El IMSS puede aplicar criterios distintos según el caso.
  const vecesSMG = salarioEfectivoDiario / smgRef;
  const entrada = buscarEntradaTabla(vecesSMG);

  const salarioMensualEfectivo = round2(salarioEfectivoDiario * 30.4);
  const cuantiaBasicaMensual = round2(salarioMensualEfectivo * (entrada.cuantiaBasicaPct / 100));

  advertencias.push(
    `⚠️ ESTIMACIÓN: La tabla del Art. 167 LSS 1973 usa el SMG como referencia salarial. ` +
      `Esta aplicación usa el valor de la UMA como proxy del SMG actualizado ` +
      `(${smgRef.toFixed(2)} MXN/día). ` +
      `El IMSS puede aplicar criterios distintos. Rango aplicado: ${entrada.rangoMin}–${entrada.rangoMax === Infinity ? '>' + entrada.rangoMin : entrada.rangoMax} veces UMA/SMG.`,
  );

  pasos.push({
    id: 'cuantia_basica',
    titulo: '2. Cuantía Básica (Art. 167 LSS 1973)',
    descripcion:
      `SBC: $${salarioEfectivoDiario.toFixed(2)}/día = ${vecesSMG.toFixed(4)} veces UMA/SMG → ` +
      `Rango: ${entrada.rangoMin}–${entrada.rangoMax === Infinity ? '∞' : entrada.rangoMax} → ` +
      `Cuantía básica: ${entrada.cuantiaBasicaPct}% × $${salarioMensualEfectivo.toFixed(2)}/mes = $${cuantiaBasicaMensual.toFixed(2)}/mes`,
    valor: cuantiaBasicaMensual,
    formula: `SBC_mensual × ${entrada.cuantiaBasicaPct}%`,
    baseLegal: 'Art. 167 LSS 1973 — Tabla de cuantías básicas (500 semanas)',
    esEstimacion: true,
    supuesto:
      'Se usa el valor de la UMA como referencia para determinar el rango de la tabla Art. 167. ' +
      'El IMSS puede aplicar el SMG según la zona del trabajador.',
  });

  return {
    ...ctx,
    salarioEnVecesSMG: vecesSMG,
    cuantiaBasicaPct: entrada.cuantiaBasicaPct,
    incrementoAnualPct: entrada.incrementoAnualPct,
    cuantiaBasicaMensual,
    pasos,
    advertencias,
  };
};

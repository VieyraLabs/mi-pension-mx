/**
 * Paso 2: Cálculo de la cuantía básica.
 * Busca el rango del SBC en la tabla del Art. 167 LSS 1973 y calcula
 * el porcentaje correspondiente sobre el salario promedio mensual.
 *
 * Fuente: Art. 167 LSS 1973 — Tabla de cuantías básicas.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DIAS_ANIO_UMA, TABLA_ART167 } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

/**
 * Busca la entrada de la tabla Art. 167 correspondiente al salario
 * expresado en veces el Salario Mínimo General (SMG).
 *
 * Primero intenta una coincidencia exacta dentro de rango. Si el valor cae
 * en un hueco decimal entre rangos (p. ej. 1.0 → 1.01), selecciona el
 * siguiente rango por su límite superior. Esto evita que valores intermedios
 * caigan en un fallback incorrecto.
 */
function buscarEntradaTabla(vecesSMG: number) {
  const entradaExacta = TABLA_ART167.find(
    (e) => vecesSMG >= e.rangoMin && vecesSMG <= e.rangoMax,
  );

  if (entradaExacta) {
    return entradaExacta;
  }

  const siguienteEntrada = TABLA_ART167.find((e) => vecesSMG <= e.rangoMax);

  // Fallback defensivo: primer rango para valores menores al mínimo,
  // último rango para valores superiores al máximo definido.
  return siguienteEntrada ?? TABLA_ART167[TABLA_ART167.length - 1]!;
}

export const BasicQuantityStep: CalculationStep = (ctx): CalculationContext => {
  const { input, salarioEfectivoDiario } = ctx;
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

  // Fórmula: Cuantía Básica Anual = Salario Diario × 365 × Porcentaje
  // Cuantía Básica Mensual = Cuantía Básica Anual / 12
  const cuantiaBasicaAnual = round2(salarioEfectivoDiario * DIAS_ANIO_UMA * (entrada.cuantiaBasicaPct / 100));
  const cuantiaBasicaMensual = round2(cuantiaBasicaAnual / 12);

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
      `Cuantía básica: $${salarioEfectivoDiario.toFixed(2)}/día × 365 días × ${entrada.cuantiaBasicaPct}% = $${cuantiaBasicaAnual.toFixed(2)}/año → ` +
      `$${cuantiaBasicaAnual.toFixed(2)}/año ÷ 12 meses = $${cuantiaBasicaMensual.toFixed(2)}/mes`,
    valor: cuantiaBasicaMensual,
    formula: `SBC_diario × 365 × ${entrada.cuantiaBasicaPct}% ÷ 12`,
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

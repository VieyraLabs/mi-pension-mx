/**
 * Paso 2: Cálculo de la cuantía básica.
 * Busca el rango del SBC en la tabla del Art. 167 LSS 1973 y calcula
 * el porcentaje correspondiente sobre el salario promedio mensual.
 *
 * Fuente: Art. 167 LSS 1973 — Tabla de cuantías básicas.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DAYS_PER_YEAR_UMA, ART167_TABLE } from '../../../constants/ley73';
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
function findTableEntry(timesMinimumWage: number) {
  const exactEntry = ART167_TABLE.find(
    (e) => timesMinimumWage >= e.rangeMin && timesMinimumWage <= e.rangeMax,
  );

  if (exactEntry) {
    return exactEntry;
  }

  const nextEntry = ART167_TABLE.find((e) => timesMinimumWage <= e.rangeMax);

  // Fallback defensivo: primer rango para valores menores al mínimo,
  // último rango para valores superiores al máximo definido.
  return nextEntry ?? ART167_TABLE[ART167_TABLE.length - 1]!;
}

export const BasicQuantityStep: CalculationStep = (ctx): CalculationContext => {
  const { input, effectiveDailySalary } = ctx;
  const steps = [...ctx.steps];
  const warnings = [...ctx.warnings];

  // Expresar el SBC en veces el SMG
  // NOTA IMPORTANTE: La tabla Art. 167 usa el SMG como referencia.
  // El IMSS opera con el SMG de la zona geográfica del trabajador.
  // Supuesto: usamos el SMG de CDMX (el más alto) como referencia.
  // El valor del SMG se obtiene del registro UMA del año correspondiente.
  const smgRef = input.uma.dailyUMA; // Ver nota: usamos UMA como proxy del SMG actualizado
  // SUPUESTO DOCUMENTADO: Desde 2016, con la deindexación, hay ambigüedad
  // sobre si la tabla Art. 167 debe aplicarse usando SMG o UMA.
  // Esta aplicación usa el valor de la UMA como referencia para el rango,
  // lo cual es el enfoque más conservador y común en calculadoras actuales.
  // El IMSS puede aplicar criterios distintos según el caso.
  const timesMinimumWage = effectiveDailySalary / smgRef;
  const entry = findTableEntry(timesMinimumWage);

  // Fórmula: Cuantía Básica Anual = Salario Diario × 365 × Porcentaje
  // Cuantía Básica Mensual = Cuantía Básica Anual / 12
  const annualBasicQuantity = round2(effectiveDailySalary * DAYS_PER_YEAR_UMA * (entry.basicQuantityPct / 100));
  const basicAmount = round2(annualBasicQuantity / 12);

  warnings.push(
    `⚠️ ESTIMACIÓN: La tabla del Art. 167 LSS 1973 usa el SMG como referencia salarial. ` +
      `Esta aplicación usa el valor de la UMA como proxy del SMG actualizado ` +
      `(${smgRef.toFixed(2)} MXN/día). ` +
      `El IMSS puede aplicar criterios distintos. Rango aplicado: ${entry.rangeMin}–${entry.rangeMax === Infinity ? '>' + entry.rangeMin : entry.rangeMax} veces UMA/SMG.`,
  );

  steps.push({
    id: 'cuantia_basica',
    title: '2. Cuantía Básica (Art. 167 LSS 1973)',
    description:
      `SBC: $${effectiveDailySalary.toFixed(2)}/día = ${timesMinimumWage.toFixed(4)} veces UMA/SMG → ` +
      `Rango: ${entry.rangeMin}–${entry.rangeMax === Infinity ? '∞' : entry.rangeMax} → ` +
      `Cuantía básica: $${effectiveDailySalary.toFixed(2)}/día × 365 días × ${entry.basicQuantityPct}% = $${annualBasicQuantity.toFixed(2)}/año → ` +
      `$${annualBasicQuantity.toFixed(2)}/año ÷ 12 meses = $${basicAmount.toFixed(2)}/mes`,
    value: basicAmount,
    formula: `SBC_diario × 365 × ${entry.basicQuantityPct}% ÷ 12`,
    legalBasis: 'Art. 167 LSS 1973 — Tabla de cuantías básicas (500 semanas)',
    isEstimate: true,
    assumption:
      'Se usa el valor de la UMA como referencia para determinar el rango de la tabla Art. 167. ' +
      'El IMSS puede aplicar el SMG según la zona del trabajador.',
  });

  return {
    ...ctx,
    salaryInTimesMinimumWage: timesMinimumWage,
    basicQuantityPct: entry.basicQuantityPct,
    annualIncrementPct: entry.annualIncrementPct,
    basicAmount,
    steps,
    warnings,
  };
};

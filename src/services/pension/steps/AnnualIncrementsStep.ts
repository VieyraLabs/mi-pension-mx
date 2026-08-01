/**
 * Paso 3: Cálculo de incrementos anuales por semanas excedentes.
 * Por cada 52 semanas cotizadas adicionales a las 500 mínimas,
 * se aplica un porcentaje de incremento según la tabla Art. 167.
 *
 * Fuente: Art. 167 LSS 1973 — párrafo de incrementos anuales.
 */
import type { CalculationContext, CalculationStep } from '../types';
import { DIAS_ANIO_UMA, SEMANAS_MINIMAS_VEJEZ, SEMANAS_POR_ANIO } from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

export const AnnualIncrementsStep: CalculationStep = (ctx): CalculationContext => {
  const { input, cuantiaBasicaMensual, incrementoAnualPct, salarioEfectivoDiario } = ctx;
  const semanasTotales = input.historialLaboral.semanasTotales;
  const pasos = [...ctx.pasos];

  // Semanas excedentes sobre el mínimo
  const semanasExcedentes = Math.max(0, semanasTotales - SEMANAS_MINIMAS_VEJEZ);
  // Años completos excedentes (cada 52 semanas = 1 año de incremento)
  const aniosExcedentes = Math.floor(semanasExcedentes / SEMANAS_POR_ANIO);

  // El incremento se calcula sobre el SBC anual y luego se divide entre 12 para obtener el mensual
  // Fuente: Art. 167 LSS 1973 — cada año adicional incrementa en incrementoAnualPct% del SBC
  // Fórmula: Incremento Anual = Salario Diario × 365 × Porcentaje
  // Incremento Mensual = Incremento Anual / 12
  const incrementoAnual = round2(salarioEfectivoDiario * DIAS_ANIO_UMA * (incrementoAnualPct / 100));
  const incrementosMensual = round2(incrementoAnual / 12 * aniosExcedentes);
  const subtotalAntesFactor = round2(cuantiaBasicaMensual + incrementosMensual);

  pasos.push({
    id: 'incrementos_anuales',
    titulo: '3. Incrementos Anuales por Semanas Excedentes',
    descripcion:
      `Semanas totales: ${semanasTotales} − 500 mínimas = ${semanasExcedentes} excedentes → ` +
      `${aniosExcedentes} años completos × ${incrementoAnualPct}% × $${salarioEfectivoDiario.toFixed(2)}/día × 365 días = ` +
      `$${incrementoAnual.toFixed(2)}/año → $${incrementosMensual.toFixed(2)}/mes adicionales`,
    valor: incrementosMensual,
    formula: `floor((semanas − 500) / 52) × ${incrementoAnualPct}% × SBC_diario × 365 ÷ 12`,
    baseLegal: 'Art. 167 LSS 1973 — incrementos anuales por semanas adicionales',
    esEstimacion: false,
  });

  pasos.push({
    id: 'subtotal_cuantia',
    titulo: '4. Cuantía Total (Básica + Incrementos)',
    descripcion:
      `Cuantía básica $${cuantiaBasicaMensual.toFixed(2)} + Incrementos $${incrementosMensual.toFixed(2)} = $${subtotalAntesFactor.toFixed(2)}/mes`,
    valor: subtotalAntesFactor,
    formula: 'Cuantía_básica + Incrementos_anuales',
    baseLegal: 'Art. 167 LSS 1973',
    esEstimacion: true,
  });

  return {
    ...ctx,
    aniosExcedentes,
    incrementosMensual,
    subtotalAntesFactor,
    pasos,
  };
};

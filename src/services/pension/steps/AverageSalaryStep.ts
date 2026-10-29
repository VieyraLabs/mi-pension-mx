/**
 * Paso 1: Cálculo del salario promedio efectivo.
 * Incluye el ajuste por Modalidad 40 si está activa.
 *
 * Fuente: Art. 167 LSS 1973 — promedio de las últimas 250 semanas.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  AVERAGE_DAYS_PER_MONTH,
  MODALIDAD_40_CAP_TIMES_UMA,
  SBC_AVERAGE_WEEKS,
  SBC_CAP_TIMES_UMA,
  WEEKS_PER_YEAR,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

/**
 * Calcula el salario promedio ajustado de las últimas 250 semanas,
 * considerando la Modalidad 40 si está activa.
 *
 * Supuesto M40: cuando M40 está activa, calculamos el promedio ponderado
 * aproximado entre el SBC del régimen obligatorio y el SBC de M40,
 * según las semanas M40 planeadas por fecha dentro de las 250 semanas.
 */
export const AverageSalaryStep: CalculationStep = (ctx): CalculationContext => {
  const { input } = ctx;
  const { averageSalary, uma, modalidad40 } = input;
  const warnings = [...ctx.warnings];
  const steps = [...ctx.steps];

  const dailyUMACap = SBC_CAP_TIMES_UMA * uma.dailyUMA;
  let baseDailySalary = averageSalary.dailySalary;
  let isSalaryEstimate = false;
  let salaryDescription = `Salario diario promedio ingresado: $${baseDailySalary.toFixed(2)}`;
  let salaryFormula = 'SBC promedio (250 semanas) — ingresado por el usuario';

  // Ajuste por Modalidad 40
  if (modalidad40.active && modalidad40.contributionSalary && modalidad40.expectedMonths) {
    const sbcM40 = modalidad40.contributionSalary;
    const sbcM40Topado = Math.min(sbcM40, MODALIDAD_40_CAP_TIMES_UMA * uma.dailyUMA);

    // Semanas totales del período de referencia
    const referenceWeeks = SBC_AVERAGE_WEEKS; // 250
    // Semanas de M40 dentro del período de referencia
    const m40Weeks = Math.min(ctx.m40PlannedWeeks, referenceWeeks);
    const baseWeeks = referenceWeeks - m40Weeks;

    // Incremento anual de M40 si aplica
    let adjustedDailyM40Salary = sbcM40Topado;
    if (modalidad40.annualSalaryIncrease && modalidad40.annualSalaryIncrease > 0) {
      // Para simplificar, aplicamos el incremento promedio en la mitad del período
      const m40Years = m40Weeks / WEEKS_PER_YEAR;
      const increaseFactor = 1 + (modalidad40.annualSalaryIncrease / 100) * (m40Years / 2);
      adjustedDailyM40Salary = Math.min(sbcM40Topado * increaseFactor, MODALIDAD_40_CAP_TIMES_UMA * uma.dailyUMA);
      isSalaryEstimate = true;
    }

    // Promedio ponderado
    const weightedAverage =
      (baseDailySalary * baseWeeks + adjustedDailyM40Salary * m40Weeks) / referenceWeeks;

    baseDailySalary = round2(weightedAverage);
    salaryDescription = `Promedio ponderado: ${baseWeeks.toFixed(0)} sem. ordinarias ($${averageSalary.dailySalary.toFixed(2)}/día) + ${m40Weeks.toFixed(0)} sem. M40 ($${adjustedDailyM40Salary.toFixed(2)}/día) = $${baseDailySalary.toFixed(2)}/día`;
    salaryFormula = '(SBC_ord × sem_ord + SBC_M40 × sem_M40) ÷ 250';
    isSalaryEstimate = true;
    warnings.push(
      'El promedio salarial incluye un ajuste estimado por Modalidad 40. ' +
        'El IMSS calculará el promedio exacto con tu historial completo.',
    );
  }

  // Aplicar tope de 25 UMA
  const capApplied = baseDailySalary > dailyUMACap;
  const effectiveDailySalary = capApplied ? dailyUMACap : baseDailySalary;

  if (capApplied) {
    warnings.push(
      `El SBC ($${baseDailySalary.toFixed(2)}/día) excede el tope de 25 UMA ` +
        `($${dailyUMACap.toFixed(2)}/día). Se utiliza el tope máximo. ` +
        `(Art. 28 LSS vigente; ref. DOF 27-ene-2016)`,
    );
  }

  steps.push({
    id: 'salario_promedio',
    title: '1. Salario Base de Cotización Promedio',
    description: capApplied
      ? `${salaryDescription} → topado a 25 UMA = $${effectiveDailySalary.toFixed(2)}/día`
      : salaryDescription,
    value: effectiveDailySalary * AVERAGE_DAYS_PER_MONTH,
    formula: capApplied ? `min(${salaryFormula}, 25 × UMA_diaria)` : salaryFormula,
    legalBasis: 'Art. 167 LSS 1973 (promedio 250 semanas); Art. 28 LSS vigente (tope 25 UMA)',
    isEstimate: isSalaryEstimate,
    assumption: isSalaryEstimate
      ? 'Promedio ponderado estimado considerando Modalidad 40. El IMSS usará el historial exacto.'
      : undefined,
  });

  return {
    ...ctx,
    effectiveDailySalary,
    capApplied,
    steps,
    warnings,
  };
};

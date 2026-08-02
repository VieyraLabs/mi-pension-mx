/**
 * PensionCalculator — Orquestador del pipeline de cálculo de pensión Ley 73.
 *
 * Implementa el patrón Pipeline: cada paso recibe un contexto inmutable
 * y devuelve el contexto actualizado. El resultado final se construye
 * a partir del contexto final del pipeline.
 *
 * NOTA LEGAL: Los resultados son ESTIMACIONES con fines informativos.
 * La resolución oficial corresponde al IMSS.
 */
import type { PensionInput, PensionResult } from '../../models';
import type { CalculationContext } from './types';
import { AverageSalaryStep } from './steps/AverageSalaryStep';
import { BasicQuantityStep } from './steps/BasicQuantityStep';
import { AnnualIncrementsStep } from './steps/AnnualIncrementsStep';
import { DecreeIncrementStep } from './steps/DecreeIncrementStep';
import { AgeFactorStep } from './steps/AgeFactorStep';
import { FamilyAssignmentsStep } from './steps/FamilyAssignmentsStep';
import { AssistanceAidStep } from './steps/AssistanceAidStep';
import { LimitsStep } from './steps/LimitsStep';
import { DAYS_PER_YEAR_UMA, AVERAGE_DAYS_PER_MONTH, MONTHS_PER_YEAR, MINIMUM_WEEKS_VEJEZ } from '../../constants/ley73';
import { round2 } from '../../utils/format';
import { PensionInputSchema } from '../../validation/pensionSchema';

/** Resultado de validación previa al cálculo. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida los datos de entrada antes del cálculo.
 * Las reglas de validación viven en el schema Zod (`pensionSchema.ts`), única
 * fuente de verdad — aquí solo se traducen sus resultados y se agregan
 * advertencias informativas (no bloqueantes) sobre el input.
 */
export function validateInput(input: PensionInput): ValidationResult {
  const warnings: string[] = [];
  const parseResult = PensionInputSchema.safeParse(input);
  const errors = parseResult.success ? [] : parseResult.error.issues.map((issue) => issue.message);

  const weeks = input.workHistory.totalWeeks;
  if (weeks >= MINIMUM_WEEKS_VEJEZ && weeks < 520) {
    warnings.push(
      'Tienes justo el mínimo de semanas. Considera cotizar más para incrementar tu pensión.',
    );
  }

  if (input.uma.isCustom) {
    warnings.push('Se está utilizando un valor de UMA personalizado ingresado manualmente.');
  }

  return {
    valid: parseResult.success,
    errors,
    warnings,
  };
}

/**
 * Crea el contexto inicial del pipeline con valores por defecto.
 */
function createInitialContext(input: PensionInput): CalculationContext {
  return {
    input,
    effectiveDailySalary: input.averageSalary.dailySalary,
    salaryInTimesMinimumWage: 0,
    basicQuantityPct: 0,
    annualIncrementPct: 0,
    excessYears: 0,
    basicAmount: 0,
    annualIncrements: 0,
    subtotalBeforeFactor: 0,
    decree11Increment: 0,
    ageFactor: 1.0,
    quantityWithFactor: 0,
    familyAllowances: 0,
    assistanceAid: 0,
    pensionType: 'vejez',
    capApplied: false,
    pmgApplied: false,
    monthlyPension: 0,
    steps: [],
    warnings: [],
  };
}

/** Pipeline de pasos en orden de ejecución. */
const PIPELINE = [
  AverageSalaryStep,
  BasicQuantityStep,
  AnnualIncrementsStep,
  DecreeIncrementStep,
  AgeFactorStep,
  FamilyAssignmentsStep,
  AssistanceAidStep,
  LimitsStep,
] as const;

/**
 * Ejecuta el cálculo completo de la pensión Ley 73.
 *
 * @param input Datos de entrada del asegurado
 * @returns PensionResult con el resultado y desglose completo
 */
export function calculatePension(input: PensionInput): PensionResult {
  // Ejecutar pipeline: cada paso recibe y devuelve un contexto
  const finalContext = PIPELINE.reduce<CalculationContext>(
    (ctx, step) => step(ctx),
    createInitialContext(input),
  );

  const monthlyPension = round2(finalContext.monthlyPension);
  const annualPension = round2(monthlyPension * MONTHS_PER_YEAR);
  const dailyAmount = round2(monthlyPension / AVERAGE_DAYS_PER_MONTH);

  // Agregar paso final de resumen
  const stepsWithSummary = [
    ...finalContext.steps,
    {
      id: 'resultado_final',
      title: '✅ Resultado Final',
      description: `Pensión mensual estimada: $${monthlyPension.toFixed(2)} MXN`,
      value: monthlyPension,
      formula: 'Pipeline completo Ley 73',
      legalBasis: 'Ley del Seguro Social 1973',
      isEstimate: true,
      assumption:
        'Este resultado es una ESTIMACIÓN. La resolución oficial corresponde al IMSS. ' +
        'Los porcentajes de la tabla Art. 167 son de referencia bibliográfica.',
    },
  ];

  return {
    pensionType: finalContext.pensionType,
    monthlyPension,
    annualPension,
    dailyAmount,
    basicAmount: finalContext.basicAmount,
    annualIncrements: finalContext.annualIncrements,
    decree11Increment: finalContext.decree11Increment,
    ageFactor: finalContext.ageFactor,
    familyAllowances: finalContext.familyAllowances,
    assistanceAid: finalContext.assistanceAid,
    capApplied: finalContext.capApplied,
    pmgApplied: finalContext.pmgApplied,
    steps: stepsWithSummary,
    warnings: [
      ...finalContext.warnings,
      '⚠️ AVISO LEGAL: Este resultado es una estimación con fines informativos únicamente. ' +
        'La resolución oficial de su pensión corresponde al IMSS conforme a sus procedimientos institucionales.',
    ],
    isEstimate: true,
    input,
    calculationDate: new Date().toISOString(),
  };
}

/**
 * Calcula la pensión para un escenario simplificado (para el simulador de escenarios).
 */
export function calculateSimpleScenario(params: {
  semanasCotizadas: number;
  salarioDiario: number;
  umaDiaria: number;
  edadRetiro: number;
  tieneConyuge?: boolean;
  tieneHijosMenores?: boolean;
  numeroHijos?: number;
}): number {
  const input: PensionInput = {
    personalData: {
      sex: 'masculino',
      birthDate: new Date(new Date().getFullYear() - params.edadRetiro, 0, 1),
      age: params.edadRetiro,
      estimatedRetirementDate: new Date(),
      retirementAge: params.edadRetiro,
    },
    workHistory: {
      totalWeeks: params.semanasCotizadas,
      employmentRelations: [],
    },
    averageSalary: {
      dailySalary: params.salarioDiario,
      monthlySalary: round2(params.salarioDiario * AVERAGE_DAYS_PER_MONTH),
      isManual: true,
    },
    uma: {
      dailyUMA: params.umaDiaria,
      monthlyUMA: round2(params.umaDiaria * AVERAGE_DAYS_PER_MONTH),
      annualUMA: round2(params.umaDiaria * DAYS_PER_YEAR_UMA),
      year: new Date().getFullYear(),
      isCustom: false,
    },
    modalidad40: { active: false },
    beneficiaries: {
      hasSpouse: params.tieneConyuge ?? false,
      hasMinorChildren: params.tieneHijosMenores ?? false,
      numberOfMinorChildren: params.numeroHijos ?? 0,
      hasDependentParents: false,
      numberOfDependentParents: 0,
    },
  };

  const validation = validateInput(input);
  if (!validation.valid) return 0;

  const result = calculatePension(input);
  return result.monthlyPension;
}

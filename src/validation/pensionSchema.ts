/**
 * Esquemas de validación Zod para los formularios de la aplicación.
 * Garantizan la integridad de los datos antes del cálculo.
 */
import { z } from 'zod';
import { MINIMUM_WEEKS_VEJEZ } from '../constants/ley73';

// ─────────────────────────────────────────────
// Esquemas base
// ─────────────────────────────────────────────

export const SexSchema = z.enum(['masculino', 'femenino'], {
  errorMap: () => ({ message: 'Selecciona el sexo' }),
});

export const PersonalDataSchema = z.object({
  name: z.string().max(100, 'El nombre no puede exceder 100 caracteres').optional(),
  sex: SexSchema,
  birthDate: z.date({ required_error: 'La fecha de nacimiento es requerida' }),
  age: z.number().int().min(0).max(120),
  estimatedRetirementDate: z.date({ required_error: 'La fecha de retiro estimada es requerida' }),
  retirementAge: z
    .number({ required_error: 'La edad de retiro es requerida' })
    .int('La edad debe ser un número entero')
    .min(60, 'La edad mínima de retiro es 60 años (Cesantía en Edad Avanzada)')
    .max(100, 'La edad máxima permitida es 100 años'),
});

export const WorkHistorySchema = z.object({
  totalWeeks: z
    .number({ required_error: 'Las semanas cotizadas son requeridas' })
    .int('Las semanas deben ser un número entero')
    .min(
      MINIMUM_WEEKS_VEJEZ,
      `Se requieren mínimo ${MINIMUM_WEEKS_VEJEZ} semanas cotizadas (Arts. 138 y 145 LSS 1973).`,
    )
    .max(5000, 'El número de semanas parece incorrecto (máximo 5000)'),
  recognizedWeeks: z.number().int().min(0).optional(),
  deductedWeeks: z.number().int().min(0).optional(),
  employmentRelations: z.array(z.any()).default([]),
});

export const AverageContributionSalarySchema = z.object({
  dailySalary: z
    .number({ required_error: 'El salario diario es requerido' })
    .positive('El salario diario debe ser mayor a cero')
    .max(100000, 'El salario parece excesivo (máximo $100,000/día)'),
  monthlySalary: z.number().positive(),
  isManual: z.boolean().default(true),
});

export const UMAConfigurationSchema = z.object({
  dailyUMA: z
    .number({ required_error: 'El valor de la UMA es requerido' })
    .positive('La UMA debe ser mayor a cero')
    .max(10000, 'El valor de la UMA parece incorrecto'),
  monthlyUMA: z.number().positive(),
  annualUMA: z.number().positive(),
  year: z.number().int().min(2017).max(2100),
  isCustom: z.boolean().default(false),
});

export const Modalidad40Schema = z.object({
  active: z.boolean().default(false),
  contributionSalary: z
    .number()
    .positive('El salario de Modalidad 40 debe ser mayor a cero')
    .optional()
    .nullable(),
  startDate: z.date().optional().nullable(),
  expectedMonths: z
    .number()
    .int()
    .min(1, 'Los meses de Modalidad 40 deben ser al menos 1')
    .max(600)
    .optional()
    .nullable(),
  annualSalaryIncrease: z.number().min(0).max(100).optional().nullable(),
});

export const BeneficiariesSchema = z.object({
  hasSpouse: z.boolean().default(false),
  hasMinorChildren: z.boolean().default(false),
  numberOfMinorChildren: z.number().int().min(0).max(20).default(0),
  hasDependentParents: z.boolean().default(false),
  numberOfDependentParents: z.number().int().min(0).max(2).default(0),
});

// ─────────────────────────────────────────────
// Esquema completo del formulario
// ─────────────────────────────────────────────

export const PensionInputSchema = z.object({
  personalData: PersonalDataSchema,
  workHistory: WorkHistorySchema,
  averageSalary: AverageContributionSalarySchema,
  uma: UMAConfigurationSchema,
  modalidad40: Modalidad40Schema,
  beneficiaries: BeneficiariesSchema,
});

export type PensionInputForm = z.infer<typeof PensionInputSchema>;

// ─────────────────────────────────────────────
// Esquema simplificado para el Simulador
// ─────────────────────────────────────────────

export const SimulatorSchema = z.object({
  retirementAge: z.number().int().min(60).max(100),
  dailySalary: z.number().positive(),
  contributedWeeks: z.number().int().min(1),
  dailyUMA: z.number().positive(),
  hasSpouse: z.boolean().default(false),
  hasMinorChildren: z.boolean().default(false),
  numberOfChildren: z.number().int().min(0).default(0),
});

export type SimulatorForm = z.infer<typeof SimulatorSchema>;

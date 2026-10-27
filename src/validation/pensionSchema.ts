/**
 * Esquemas de validación Zod para los formularios de la aplicación.
 * Garantizan la integridad de los datos antes del cálculo.
 */
import { z } from 'zod';
import { MINIMUM_WEEKS_VEJEZ } from '../constants/ley73';
import { calculateM40PlannedWeeks } from '../utils/modalidad40';
import { calculateWeeksProjection, describeWeeksProjection } from '../utils/weeksProjection';

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
    .min(60, 'La edad mínima de retiro es 60 años (Cesantía en Edad Avanzada)')
    .max(100, 'La edad máxima permitida es 100 años')
    .refine(
      (value) => Math.abs(value * 2 - Math.round(value * 2)) < 1e-9,
      'La edad debe ser un número entero o medio (60, 60.5, 61, ...)',
    ),
});

/**
 * Relación laboral reconstruida (por ejemplo, al importar una constancia del
 * IMSS). Espeja `EmploymentRelation` de src/models/index.ts — mantener ambos
 * en sincronía: este esquema es el contrato compartido de entrada entre
 * formulario, motor, parser PDF e historial (RNF-007/RNF-012).
 */
export const EmploymentRelationSchema = z.object({
  employerName: z.string(),
  employerRegistrationNumber: z.string(),
  startDate: z.date({ required_error: 'La fecha de alta es requerida' }),
  endDate: z.date().optional(),
  contributionBaseSalary: z
    .number({ required_error: 'El salario base de cotización es requerido' })
    .min(0, 'El salario base de cotización no puede ser negativo'),
  movementType: z.string(),
  contributedDays: z
    .number({ required_error: 'Los días cotizados son requeridos' })
    .int('Los días cotizados deben ser un número entero')
    .min(0, 'Los días cotizados no pueden ser negativos'),
});

export const WorkHistorySchema = z.object({
  // El mínimo de 500 semanas (Arts. 138 y 145 LSS 1973) se valida a nivel de
  // PensionInputSchema (ver más abajo), no aquí — considera también las
  // semanas proyectadas por Modalidad 40, que viven en otro campo.
  totalWeeks: z
    .number({ required_error: 'Las semanas cotizadas son requeridas' })
    .int('Las semanas deben ser un número entero')
    .min(0, 'Las semanas cotizadas no pueden ser negativas')
    .max(5000, 'El número de semanas parece incorrecto (máximo 5000)'),
  recognizedWeeks: z.number().int().min(0).optional(),
  deductedWeeks: z.number().int().min(0).optional(),
  employmentRelations: z.array(EmploymentRelationSchema).default([]),
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

export const PensionInputSchema = z
  .object({
    personalData: PersonalDataSchema,
    workHistory: WorkHistorySchema,
    averageSalary: AverageContributionSalarySchema,
    uma: UMAConfigurationSchema,
    modalidad40: Modalidad40Schema,
    beneficiaries: BeneficiariesSchema,
  })
  .superRefine((data, ctx) => {
    // El mínimo de 500 semanas (Arts. 138 y 145 LSS 1973) se evalúa contra
    // las semanas con las que el asegurado se jubilaría: las ya cotizadas más
    // las proyectadas hasta la edad de retiro (y las planeadas por Modalidad
    // 40, que caen dentro de ese horizonte).
    const projection = calculateWeeksProjection({
      currentWeeks: data.workHistory.totalWeeks,
      age: data.personalData.age,
      retirementAge: data.personalData.retirementAge,
      m40PlannedWeeks: calculateM40PlannedWeeks(data.modalidad40),
    });
    if (projection.targetWeeks < MINIMUM_WEEKS_VEJEZ) {
      const faltantes = MINIMUM_WEEKS_VEJEZ - projection.targetWeeks;
      // El desglose es el MISMO que narra el motor (Art. 167 LSS 1973):
      // semanas cotizadas + proyectadas hasta la edad de retiro = total con
      // el que se jubila el asegurado.
      const { breakdown } = describeWeeksProjection(projection);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workHistory', 'totalWeeks'],
        message:
          `Se requieren mínimo ${MINIMUM_WEEKS_VEJEZ} semanas cotizadas (Arts. 138 y 145 LSS 1973)` +
          ` (${breakdown}). Te faltan ${faltantes} semanas para al jubilarse.`,
      });
    }
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

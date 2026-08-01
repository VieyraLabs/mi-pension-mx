/**
 * Esquemas de validación Zod para los formularios de la aplicación.
 * Garantizan la integridad de los datos antes del cálculo.
 */
import { z } from 'zod';

// ─────────────────────────────────────────────
// Esquemas base
// ─────────────────────────────────────────────

export const SexoSchema = z.enum(['masculino', 'femenino'], {
  errorMap: () => ({ message: 'Selecciona el sexo' }),
});

export const DatosPersonalesSchema = z.object({
  nombre: z.string().max(100, 'El nombre no puede exceder 100 caracteres').optional(),
  sexo: SexoSchema,
  fechaNacimiento: z.date({ required_error: 'La fecha de nacimiento es requerida' }),
  edad: z.number().int().min(0).max(120),
  fechaRetiroEstimada: z.date({ required_error: 'La fecha de retiro estimada es requerida' }),
  edadRetiro: z
    .number({ required_error: 'La edad de retiro es requerida' })
    .int('La edad debe ser un número entero')
    .min(60, 'La edad mínima de retiro es 60 años (Cesantía en Edad Avanzada)')
    .max(100, 'La edad máxima permitida es 100 años'),
});

export const HistorialLaboralSchema = z.object({
  semanasTotales: z
    .number({ required_error: 'Las semanas cotizadas son requeridas' })
    .int('Las semanas deben ser un número entero')
    .min(1, 'Ingresa al menos 1 semana cotizada')
    .max(5000, 'El número de semanas parece incorrecto (máximo 5000)'),
  semanasReconocidas: z.number().int().min(0).optional(),
  semanasDescontadas: z.number().int().min(0).optional(),
  relacionesLaborales: z.array(z.any()).default([]),
});

export const SalarioBCPromedioSchema = z.object({
  salarioDiario: z
    .number({ required_error: 'El salario diario es requerido' })
    .positive('El salario diario debe ser mayor a cero')
    .max(100000, 'El salario parece excesivo (máximo $100,000/día)'),
  salarioMensual: z.number().positive(),
  esManual: z.boolean().default(true),
});

export const ConfiguracionUMASchema = z.object({
  umaDiaria: z
    .number({ required_error: 'El valor de la UMA es requerido' })
    .positive('La UMA debe ser mayor a cero')
    .max(10000, 'El valor de la UMA parece incorrecto'),
  umaMensual: z.number().positive(),
  umaAnual: z.number().positive(),
  anio: z.number().int().min(2017).max(2100),
  esPersonalizada: z.boolean().default(false),
});

export const Modalidad40Schema = z.object({
  activa: z.boolean().default(false),
  salarioCotizacion: z
    .number()
    .positive('El salario de Modalidad 40 debe ser mayor a cero')
    .optional()
    .nullable(),
  fechaInicio: z.date().optional().nullable(),
  mesesEsperados: z
    .number()
    .int()
    .min(1, 'Los meses de Modalidad 40 deben ser al menos 1')
    .max(600)
    .optional()
    .nullable(),
  incrementoSalarialAnual: z.number().min(0).max(100).optional().nullable(),
});

export const BeneficiariosSchema = z.object({
  tieneConyuge: z.boolean().default(false),
  tieneHijosMenores: z.boolean().default(false),
  numeroHijosMenores: z.number().int().min(0).max(20).default(0),
  tienePadresDependientes: z.boolean().default(false),
  numeroPadresDependientes: z.number().int().min(0).max(2).default(0),
});

// ─────────────────────────────────────────────
// Esquema completo del formulario
// ─────────────────────────────────────────────

export const PensionInputSchema = z.object({
  datosPersonales: DatosPersonalesSchema,
  historialLaboral: HistorialLaboralSchema,
  salarioPromedio: SalarioBCPromedioSchema,
  uma: ConfiguracionUMASchema,
  modalidad40: Modalidad40Schema,
  beneficiarios: BeneficiariosSchema,
});

export type PensionInputForm = z.infer<typeof PensionInputSchema>;

// ─────────────────────────────────────────────
// Esquema simplificado para el Simulador
// ─────────────────────────────────────────────

export const SimuladorSchema = z.object({
  edadRetiro: z.number().int().min(60).max(100),
  salarioDiario: z.number().positive(),
  semanasCotizadas: z.number().int().min(1),
  umaDiaria: z.number().positive(),
  tieneConyuge: z.boolean().default(false),
  tieneHijosMenores: z.boolean().default(false),
  numeroHijos: z.number().int().min(0).default(0),
});

export type SimuladorForm = z.infer<typeof SimuladorSchema>;

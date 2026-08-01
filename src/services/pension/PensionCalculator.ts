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
import { AgeFactorStep } from './steps/AgeFactorStep';
import { FamilyAssignmentsStep } from './steps/FamilyAssignmentsStep';
import { AssistanceAidStep } from './steps/AssistanceAidStep';
import { LimitsStep } from './steps/LimitsStep';
import { SEMANAS_MINIMAS_VEJEZ } from '../../constants/ley73';
import { round2 } from '../../utils/format';

/** Resultado de validación previa al cálculo. */
export interface ValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

/** Valida los datos de entrada antes del cálculo. */
export function validarInput(input: PensionInput): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const semanas = input.historialLaboral.semanasTotales;
  const edadRetiro = input.datosPersonales.edadRetiro;
  const salario = input.salarioPromedio.salarioDiario;
  const uma = input.uma.umaDiaria;

  if (semanas < SEMANAS_MINIMAS_VEJEZ) {
    errores.push(
      `Semanas cotizadas insuficientes: ${semanas} semanas. ` +
        `Se requieren mínimo ${SEMANAS_MINIMAS_VEJEZ} semanas (Arts. 138 y 145 LSS 1973).`,
    );
  }

  if (edadRetiro < 60 || edadRetiro > 100) {
    errores.push(`Edad de retiro inválida: ${edadRetiro} años. Rango válido: 60–100.`);
  }

  if (salario <= 0) {
    errores.push('El salario diario promedio debe ser mayor a cero.');
  }

  if (uma <= 0) {
    errores.push('El valor de la UMA diaria debe ser mayor a cero.');
  }

  if (semanas >= SEMANAS_MINIMAS_VEJEZ && semanas < 520) {
    advertencias.push(
      `Tienes justo el mínimo de semanas. Considera cotizar más para incrementar tu pensión.`,
    );
  }

  if (input.uma.esPersonalizada) {
    advertencias.push('Se está utilizando un valor de UMA personalizado ingresado manualmente.');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Crea el contexto inicial del pipeline con valores por defecto.
 */
function crearContextoInicial(input: PensionInput): CalculationContext {
  return {
    input,
    salarioEfectivoDiario: input.salarioPromedio.salarioDiario,
    salarioEnVecesSMG: 0,
    cuantiaBasicaPct: 0,
    incrementoAnualPct: 0,
    aniosExcedentes: 0,
    cuantiaBasicaMensual: 0,
    incrementosMensual: 0,
    subtotalAntesFactor: 0,
    factorEdad: 1.0,
    cuantiaConFactor: 0,
    asignacionesFamiliares: 0,
    ayudaAsistencial: 0,
    tipoPension: 'vejez',
    aplicoTope: false,
    aplicoPMG: false,
    pensionMensual: 0,
    pasos: [],
    advertencias: [],
  };
}

/** Pipeline de pasos en orden de ejecución. */
const PIPELINE = [
  AverageSalaryStep,
  BasicQuantityStep,
  AnnualIncrementsStep,
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
export function calcularPension(input: PensionInput): PensionResult {
  // Ejecutar pipeline: cada paso recibe y devuelve un contexto
  const ctxFinal = PIPELINE.reduce<CalculationContext>(
    (ctx, step) => step(ctx),
    crearContextoInicial(input),
  );

  const pensionMensual = round2(ctxFinal.pensionMensual);
  const pensionAnual = round2(pensionMensual * 12);
  const montoDiario = round2(pensionMensual / 30.4);

  // Agregar paso final de resumen
  const pasosConResumen = [
    ...ctxFinal.pasos,
    {
      id: 'resultado_final',
      titulo: '✅ Resultado Final',
      descripcion: `Pensión mensual estimada: $${pensionMensual.toFixed(2)} MXN`,
      valor: pensionMensual,
      formula: 'Pipeline completo Ley 73',
      baseLegal: 'Ley del Seguro Social 1973',
      esEstimacion: true,
      supuesto:
        'Este resultado es una ESTIMACIÓN. La resolución oficial corresponde al IMSS. ' +
        'Los porcentajes de la tabla Art. 167 son de referencia bibliográfica.',
    },
  ];

  return {
    tipoPension: ctxFinal.tipoPension,
    pensionMensual,
    pensionAnual,
    montoDiario,
    cuantiaBasica: ctxFinal.cuantiaBasicaMensual,
    incrementosAnuales: ctxFinal.incrementosMensual,
    factorEdad: ctxFinal.factorEdad,
    asignacionesFamiliares: ctxFinal.asignacionesFamiliares,
    ayudaAsistencial: ctxFinal.ayudaAsistencial,
    aplicoTope: ctxFinal.aplicoTope,
    aplicoPMG: ctxFinal.aplicoPMG,
    pasos: pasosConResumen,
    advertencias: [
      ...ctxFinal.advertencias,
      '⚠️ AVISO LEGAL: Este resultado es una estimación con fines informativos únicamente. ' +
        'La resolución oficial de su pensión corresponde al IMSS conforme a sus procedimientos institucionales.',
    ],
    esEstimacion: true,
    input,
    fechaCalculo: new Date().toISOString(),
  };
}

/**
 * Calcula la pensión para un escenario simplificado (para el simulador de escenarios).
 */
export function calcularEscenarioSimple(params: {
  semanasCotizadas: number;
  salarioDiario: number;
  umaDiaria: number;
  edadRetiro: number;
  tieneConyuge?: boolean;
  tieneHijosMenores?: boolean;
  numeroHijos?: number;
}): number {
  const input: PensionInput = {
    datosPersonales: {
      sexo: 'masculino',
      fechaNacimiento: new Date(new Date().getFullYear() - params.edadRetiro, 0, 1),
      edad: params.edadRetiro,
      fechaRetiroEstimada: new Date(),
      edadRetiro: params.edadRetiro,
    },
    historialLaboral: {
      semanasTotales: params.semanasCotizadas,
      relacionesLaborales: [],
    },
    salarioPromedio: {
      salarioDiario: params.salarioDiario,
      salarioMensual: round2(params.salarioDiario * 30.4),
      esManual: true,
    },
    uma: {
      umaDiaria: params.umaDiaria,
      umaMensual: round2(params.umaDiaria * 30.4),
      umaAnual: round2(params.umaDiaria * 365),
      anio: new Date().getFullYear(),
      esPersonalizada: false,
    },
    modalidad40: { activa: false },
    beneficiarios: {
      tieneConyuge: params.tieneConyuge ?? false,
      tieneHijosMenores: params.tieneHijosMenores ?? false,
      numeroHijosMenores: params.numeroHijos ?? 0,
      tienePadresDependientes: false,
      numeroPadresDependientes: 0,
    },
  };

  const validation = validarInput(input);
  if (!validation.valido) return 0;

  const result = calcularPension(input);
  return result.pensionMensual;
}

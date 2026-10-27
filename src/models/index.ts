/**
 * Modelos de dominio para la Calculadora de Pensión IMSS Ley 73.
 * Todos los tipos están estrictamente tipados con TypeScript.
 */

import type { ContributionSummary, SBCPeriodSegment } from '../services/pension/history/types';
import type { WeeksProjection } from '../utils/weeksProjection';

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type Sex = 'masculino' | 'femenino';

export type RetirementType = 'vejez' | 'cesantia';

export type PensionType = 'vejez' | 'cesantia_edad_avanzada';

export type DocumentType =
  | 'constancia_semanas_imss'
  | 'estado_cuenta_afore'
  | 'resolucion_pension'
  | 'constancia_semanas_issste'
  | 'recibo_nomina'
  | 'historial_modalidad40';

// ─────────────────────────────────────────────
// Datos personales
// ─────────────────────────────────────────────

export interface PersonalData {
  name?: string;
  sex: Sex;
  birthDate: Date;
  age: number;
  estimatedRetirementDate: Date;
  /**
   * Edad de retiro declarada. Admite fracciones de medio año (60.5, 64.5, ...).
   * La EDAD LEGAL que manda para el cálculo de la cuantía la determina el motor
   * (Art. 171 LSS 1973): seis meses o más cumplidos se computan como el año
   * siguiente.
   */
  retirementAge: number;
}

// ─────────────────────────────────────────────
// Historial laboral
// ─────────────────────────────────────────────

export interface EmploymentRelation {
  employerName: string;
  employerRegistrationNumber: string;
  startDate: Date;
  endDate?: Date;
  contributionBaseSalary: number;
  movementType: string;
  contributedDays: number;
}

export interface WorkHistory {
  totalWeeks: number;
  recognizedWeeks?: number;
  deductedWeeks?: number;
  startDate?: Date;
  endDate?: Date;
  lastEmployer?: string;
  employmentRelations: EmploymentRelation[];
}

// ─────────────────────────────────────────────
// Salario Base de Cotización
// ─────────────────────────────────────────────

export interface AverageContributionSalary {
  /** Salario diario promedio de las últimas 250 semanas */
  dailySalary: number;
  /** Salario mensual equivalente */
  monthlySalary: number;
  /** Fuente del dato */
  isManual: boolean;
}

// ─────────────────────────────────────────────
// UMA
// ─────────────────────────────────────────────

export interface UMAConfiguration {
  /** UMA diaria en pesos MXN */
  dailyUMA: number;
  /** UMA mensual (umaDiaria * 30.4) */
  monthlyUMA: number;
  /** UMA anual (umaDiaria * 365) */
  annualUMA: number;
  /** Salario Mínimo General diario aplicable como referencia (ZSMG/CDMX) */
  smgCdmx?: number;
  /** Año de la UMA seleccionada */
  year: number;
  /** Si fue capturada manualmente por el usuario */
  isCustom: boolean;
}

// ─────────────────────────────────────────────
// Modalidad 40
// ─────────────────────────────────────────────

export interface Modalidad40 {
  active: boolean;
  contributionSalary?: number;
  startDate?: Date;
  expectedMonths?: number;
  annualSalaryIncrease?: number;
}

// ─────────────────────────────────────────────
// Beneficiarios
// ─────────────────────────────────────────────

export interface Beneficiaries {
  hasSpouse: boolean;
  hasMinorChildren: boolean;
  numberOfMinorChildren: number;
  hasDependentParents: boolean;
  numberOfDependentParents: number;
}

// ─────────────────────────────────────────────
// Input completo del simulador
// ─────────────────────────────────────────────

export interface PensionInput {
  personalData: PersonalData;
  workHistory: WorkHistory;
  averageSalary: AverageContributionSalary;
  uma: UMAConfiguration;
  modalidad40: Modalidad40;
  beneficiaries: Beneficiaries;
}

// ─────────────────────────────────────────────
// Pasos del cálculo (para el desglose)
// ─────────────────────────────────────────────

export interface CalculationStepResult {
  /** Identificador del paso */
  id: string;
  /** Título descriptivo */
  title: string;
  /** Descripción del cálculo realizado */
  description: string;
  /** Valor resultante del paso (en pesos) */
  value: number;
  /** Fórmula aplicada (texto) */
  formula?: string;
  /** Base legal (artículo, tabla) */
  legalBasis?: string;
  /** Si este paso involucra un supuesto/estimación */
  isEstimate: boolean;
  /** Descripción del supuesto cuando aplica */
  assumption?: string;
}

// ─────────────────────────────────────────────
// Resultado principal
// ─────────────────────────────────────────────

export interface PensionResult {
  /** Tipo de pensión calculada */
  pensionType: PensionType;
  /** Pensión mensual estimada (en pesos) */
  monthlyPension: number;
  /** Pensión anual */
  annualPension: number;
  /** Monto diario */
  dailyAmount: number;
  /** Cuantía básica calculada */
  basicAmount: number;
  /** Incrementos anuales totales */
  annualIncrements: number;
  /** Incremento del 11% (Decreto DOF 2001/2004) sobre cuantía básica + incrementos */
  decree11Increment: number;
  /** Factor de edad aplicado (0.75 a 1.0) */
  ageFactor: number;
  /** Asignaciones familiares sumadas */
  familyAllowances: number;
  /** Ayuda asistencial */
  assistanceAid: number;
  /** Si se aplicó el tope de 25 UMA */
  capApplied: boolean;
  /** Si se aplicó la pensión mínima garantizada */
  pmgApplied: boolean;
  /** Desglose paso a paso */
  steps: CalculationStepResult[];
  /**
   * Proyección de semanas hasta la edad de retiro (ya cotizadas + proyectadas).
   * Opcional a propósito: las simulaciones ya guardadas en el dispositivo
   * (versiones anteriores de la app) no la tienen.
   */
  weeksProjection?: WeeksProjection;
  /** Advertencias legales o de estimación */
  warnings: string[];
  /** El resultado es una estimación */
  isEstimate: boolean;
  /** Input utilizado para el cálculo */
  input: PensionInput;
  /** Fecha del cálculo */
  calculationDate: string; // ISO string
}

// ─────────────────────────────────────────────
// Simulación guardada en historial
// ─────────────────────────────────────────────

export interface SavedSimulation {
  id: string;
  name: string;
  creationDate: string; // ISO string
  result: PensionResult;
}

// ─────────────────────────────────────────────
// Datos importados de PDF, ya revisados por el usuario
// ─────────────────────────────────────────────

/** Datos ya revisados/corregidos por el usuario en ValidationScreen, para precargar NewSimulationScreen. */
export interface ImportedSimulationData {
  name?: string;
  sex?: Sex;
  /** Fecha en formato AAAA-MM-DD */
  birthDate?: string;
  totalWeeks?: number;
  /** SBC promedio estimado de las últimas 250 semanas (aproximado; ver advertencias del parser). */
  averageSBC?: number;
  /** Último SBC registrado con el patrón más reciente — solo informativo, no es el promedio. */
  lastSBC?: number;
}

// ─────────────────────────────────────────────
// Comparación de escenarios (Simulador)
// ─────────────────────────────────────────────

export interface SimulatorScenario {
  id: 'A' | 'B';
  retirementAge: number;
  dailySalary: number;
  contributedWeeks: number;
  dailyUMA: number;
  modalidad40?: Partial<Modalidad40>;
  result?: PensionResult;
}

export interface ScenarioComparison {
  scenarioA: SimulatorScenario;
  scenarioB: SimulatorScenario;
  monthlyDifference: number;
  annualDifference: number;
  percentageIncrease: number;
}

// ─────────────────────────────────────────────
// PDF / Importación de constancia IMSS
// ─────────────────────────────────────────────

export interface ExtractedData {
  name?: string;
  curp?: string;
  nss?: string;
  birthDate?: Date;
  sex?: Sex;
  totalWeeks?: number;
  recognizedWeeks?: number;
  deductedWeeks?: number;
  startDate?: Date;
  endDate?: Date;
  lastEmployer?: string;
  insuredStatus?: string;
  insuranceType?: string;
  lastSBC?: number;
  employmentRelations: EmploymentRelation[];
  averageSBC?: number;
  /**
   * TRAMOS del SBC reconstruidos del historial de movimientos, de MÁS
   * RECIENTE A MÁS ANTIGUA. Solo presente si la constancia incluye el historial detallado.
   *
   * Cada tramo es un intervalo en el que coexisten uno o más patrones: su `sbc`
   * es el SBC EFECTIVO (la suma de los patrones concurrentes) y `employerNames`
   * indica qué patrones coexistían. Las semanas siguen contando una sola vez.
   *
   * CONTRATO: la lista está ACOTADA a los tramos que SOLAPAN la ventana de las
   * últimas 250 semanas cotizadas usada para el promedio (`contributionSummary`:
   * de `firstWeekUsed` hasta `lastWeekUsed` + 7 días). Un empleo anterior a esa
   * ventana no pesa en el cálculo y por eso no se expone.
   *
   * El CÁLCULO del promedio, en cambio, sigue usando el historial COMPLETO: es lo
   * que permite saltar los huecos laborales y alcanzar las 250 semanas cotizadas
   * (Art. 167 LSS 1973, ADR-0010). El filtro acota lo que se MUESTRA, no lo que se
   * promedia.
   */
  sbcPeriods?: SBCPeriodSegment[];
  /** Desglose de la ventana de las últimas 250 semanas cotizadas usada para calcular averageSBC. */
  contributionSummary?: ContributionSummary;
}

export interface ParseResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  warnings: string[];
  missingFields: string[];
}

export interface ImportedDocument {
  documentType: DocumentType;
  extractedText: string;
  extractedData: ExtractedData;
  confidence: number; // 0 a 1
  requiresReview: boolean;
}

// ─────────────────────────────────────────────
// Constantes UMA por año (tabla de referencia)
// ─────────────────────────────────────────────

export interface UMARecord {
  year: number;
  dailyUMA: number;
  monthlyUMA: number;
  annualUMA: number;
  smgCdmx: number; // Salario Mínimo General Ciudad de México
  isEstimate: boolean;
  source: string;
}

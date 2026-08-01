/**
 * Modelos de dominio para la Calculadora de Pensión IMSS Ley 73.
 * Todos los tipos están estrictamente tipados con TypeScript.
 */

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type Sexo = 'masculino' | 'femenino';

export type TipoRetiro = 'vejez' | 'cesantia';

export type TipoPension = 'vejez' | 'cesantia_edad_avanzada';

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

export interface DatosPersonales {
  nombre?: string;
  sexo: Sexo;
  fechaNacimiento: Date;
  edad: number;
  fechaRetiroEstimada: Date;
  edadRetiro: number;
}

// ─────────────────────────────────────────────
// Historial laboral
// ─────────────────────────────────────────────

export interface RelacionLaboral {
  nombrePatron: string;
  registroPatronal: string;
  fechaAlta: Date;
  fechaBaja?: Date;
  salarioBaseCotizacion: number;
  tipoMovimiento: string;
  diasCotizados: number;
}

export interface HistorialLaboral {
  semanasTotales: number;
  semanasReconocidas?: number;
  semanasDescontadas?: number;
  fechaAlta?: Date;
  fechaBaja?: Date;
  ultimoPatron?: string;
  relacionesLaborales: RelacionLaboral[];
}

// ─────────────────────────────────────────────
// Salario Base de Cotización
// ─────────────────────────────────────────────

export interface SalarioBCPromedio {
  /** Salario diario promedio de las últimas 250 semanas */
  salarioDiario: number;
  /** Salario mensual equivalente */
  salarioMensual: number;
  /** Fuente del dato */
  esManual: boolean;
}

// ─────────────────────────────────────────────
// UMA
// ─────────────────────────────────────────────

export interface ConfiguracionUMA {
  /** UMA diaria en pesos MXN */
  umaDiaria: number;
  /** UMA mensual (umaDiaria * 30.4) */
  umaMensual: number;
  /** UMA anual (umaDiaria * 365) */
  umaAnual: number;
  /** Salario Mínimo General diario aplicable como referencia (ZSMG/CDMX) */
  smgCdmx?: number;
  /** Año de la UMA seleccionada */
  anio: number;
  /** Si fue capturada manualmente por el usuario */
  esPersonalizada: boolean;
}

// ─────────────────────────────────────────────
// Modalidad 40
// ─────────────────────────────────────────────

export interface Modalidad40 {
  activa: boolean;
  salarioCotizacion?: number;
  fechaInicio?: Date;
  mesesEsperados?: number;
  incrementoSalarialAnual?: number;
}

// ─────────────────────────────────────────────
// Beneficiarios
// ─────────────────────────────────────────────

export interface Beneficiarios {
  tieneConyuge: boolean;
  tieneHijosMenores: boolean;
  numeroHijosMenores: number;
  tienePadresDependientes: boolean;
  numeroPadresDependientes: number;
}

// ─────────────────────────────────────────────
// Input completo del simulador
// ─────────────────────────────────────────────

export interface PensionInput {
  datosPersonales: DatosPersonales;
  historialLaboral: HistorialLaboral;
  salarioPromedio: SalarioBCPromedio;
  uma: ConfiguracionUMA;
  modalidad40: Modalidad40;
  beneficiarios: Beneficiarios;
}

// ─────────────────────────────────────────────
// Pasos del cálculo (para el desglose)
// ─────────────────────────────────────────────

export interface PasoCalculo {
  /** Identificador del paso */
  id: string;
  /** Título descriptivo */
  titulo: string;
  /** Descripción del cálculo realizado */
  descripcion: string;
  /** Valor resultante del paso (en pesos) */
  valor: number;
  /** Fórmula aplicada (texto) */
  formula?: string;
  /** Base legal (artículo, tabla) */
  baseLegal?: string;
  /** Si este paso involucra un supuesto/estimación */
  esEstimacion: boolean;
  /** Descripción del supuesto cuando aplica */
  supuesto?: string;
}

// ─────────────────────────────────────────────
// Resultado principal
// ─────────────────────────────────────────────

export interface PensionResult {
  /** Tipo de pensión calculada */
  tipoPension: TipoPension;
  /** Pensión mensual estimada (en pesos) */
  pensionMensual: number;
  /** Pensión anual */
  pensionAnual: number;
  /** Monto diario */
  montoDiario: number;
  /** Cuantía básica calculada */
  cuantiaBasica: number;
  /** Incrementos anuales totales */
  incrementosAnuales: number;
  /** Factor de edad aplicado (0.75 a 1.0) */
  factorEdad: number;
  /** Asignaciones familiares sumadas */
  asignacionesFamiliares: number;
  /** Ayuda asistencial */
  ayudaAsistencial: number;
  /** Si se aplicó el tope de 25 UMA */
  aplicoTope: boolean;
  /** Si se aplicó la pensión mínima garantizada */
  aplicoPMG: boolean;
  /** Desglose paso a paso */
  pasos: PasoCalculo[];
  /** Advertencias legales o de estimación */
  advertencias: string[];
  /** El resultado es una estimación */
  esEstimacion: boolean;
  /** Input utilizado para el cálculo */
  input: PensionInput;
  /** Fecha del cálculo */
  fechaCalculo: string; // ISO string
}

// ─────────────────────────────────────────────
// Simulación guardada en historial
// ─────────────────────────────────────────────

export interface SimulacionGuardada {
  id: string;
  nombre: string;
  fechaCreacion: string; // ISO string
  resultado: PensionResult;
}

// ─────────────────────────────────────────────
// Comparación de escenarios (Simulador)
// ─────────────────────────────────────────────

export interface EscenarioSimulador {
  id: 'A' | 'B';
  edadRetiro: number;
  salarioDiario: number;
  semanasCotizadas: number;
  umaDiaria: number;
  modalidad40?: Partial<Modalidad40>;
  resultado?: PensionResult;
}

export interface ComparacionEscenarios {
  escenarioA: EscenarioSimulador;
  escenarioB: EscenarioSimulador;
  diferenciaMensual: number;
  diferenciaAnual: number;
  porcentajeIncremento: number;
}

// ─────────────────────────────────────────────
// PDF / Importación de constancia IMSS
// ─────────────────────────────────────────────

export interface DatosExtraidos {
  nombre?: string;
  curp?: string;
  nss?: string;
  fechaNacimiento?: Date;
  sexo?: Sexo;
  semanasTotales?: number;
  semanasReconocidas?: number;
  semanasDescontadas?: number;
  fechaAlta?: Date;
  fechaBaja?: Date;
  ultimoPatron?: string;
  estadoAsegurado?: string;
  tipoAseguramiento?: string;
  ultimoSBC?: number;
  relacionesLaborales: RelacionLaboral[];
  promedioSBC?: number;
}

export interface ParseResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  advertencias: string[];
  camposFaltantes: string[];
}

export interface DocumentoImportado {
  tipoDocumento: DocumentType;
  textoExtraido: string;
  datosExtraidos: DatosExtraidos;
  confianza: number; // 0 a 1
  requiereRevision: boolean;
}

// ─────────────────────────────────────────────
// Constantes UMA por año (tabla de referencia)
// ─────────────────────────────────────────────

export interface RegistroUMA {
  anio: number;
  umaDiaria: number;
  umaMensual: number;
  umaAnual: number;
  smgCdmx: number; // Salario Mínimo General Ciudad de México
  esEstimacion: boolean;
  fuente: string;
}

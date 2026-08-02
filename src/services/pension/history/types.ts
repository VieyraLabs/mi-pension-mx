/**
 * Modelos del historial de cotización semanal.
 *
 * Base para el cálculo del promedio de las ÚLTIMAS 250 SEMANAS COTIZADAS
 * conforme al Art. 167 de la Ley del Seguro Social de 1973 — semanas
 * efectivamente cotizadas, no semanas calendario.
 */

/**
 * Periodo continuo durante el cual estuvo vigente un mismo SBC diario con
 * un patrón. Es la forma en la que se reconstruye el historial a partir de
 * la Constancia de Semanas Cotizadas del IMSS.
 */
export interface SBCPeriod {
  startDate: Date;
  /** Fin del periodo (inclusive). Si el empleo sigue vigente, usar la fecha de referencia. */
  endDate: Date;
  /** Salario Base de Cotización diario vigente durante este periodo. */
  sbc: number;
}

/**
 * Una semana del historial laboral. Las semanas sin cotización se conservan
 * en el historial (para análisis, conservación de derechos y reportes al
 * usuario) pero nunca entran al promedio salarial.
 */
export interface WeeklyContribution {
  /** Inicio de la semana (inclusive). */
  date: Date;
  /** Si hubo cotización registrada durante la semana. */
  contributed: boolean;
  /**
   * SBC diario de la semana. Solo presente cuando `contributed` es true.
   * Con más de un patrón simultáneo es la suma de sus SBC; con cambios de
   * salario a mitad de semana, el promedio ponderado por días cubiertos.
   */
  salaryBaseContribution?: number;
}

/** Historial completo, en orden cronológico ascendente (más antigua primero). */
export interface ContributionHistory {
  weeks: WeeklyContribution[];
}

/** Desglose del cálculo, para poder mostrarle al usuario cómo se obtuvo. */
export interface ContributionSummary {
  /** Semanas totales del historial, cotizadas o no. */
  totalWeeksInHistory: number;
  /** Semanas del historial con cotización válida. */
  contributedWeeks: number;
  /** Semanas del historial sin cotización (huecos), excluidas del promedio. */
  skippedWeeks: number;
  /** Semanas que entraron al promedio (250, o menos si el historial no alcanza). */
  selectedWeeks: number;
  /** SBC diario promedio de las semanas seleccionadas. */
  averageSalary: number;
  /** Inicio de la semana cotizada más antigua usada en el promedio. */
  firstWeekUsed: Date;
  /** Inicio de la semana cotizada más reciente usada en el promedio. */
  lastWeekUsed: Date;
  /** Si se reunieron las 250 semanas cotizadas completas. */
  isComplete: boolean;
}

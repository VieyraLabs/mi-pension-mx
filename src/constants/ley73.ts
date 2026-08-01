/**
 * Constantes de la Ley del Seguro Social de 1973 para el cálculo de pensiones.
 *
 * FUENTE PRINCIPAL: Ley del Seguro Social de 1973 (texto vigente al abrogarse),
 * Diario Oficial de la Federación, y criterios operativos del IMSS.
 *
 * NOTA LEGAL: Toda la información aquí contenida es de referencia. La resolución
 * oficial de pensiones corresponde exclusivamente al IMSS conforme a sus
 * procedimientos institucionales. Los resultados de esta aplicación son ESTIMACIONES.
 */

// ─────────────────────────────────────────────
// Tabla del Artículo 167 LSS 1973
// Cuantía básica e incrementos anuales por rango salarial
// ─────────────────────────────────────────────

/**
 * Entrada de la tabla del Art. 167 LSS 1973.
 * El SBC se expresa como múltiplos del Salario Mínimo General (SMG) diario.
 *
 * NOTA: La tabla del Art. 167 históricamente usa el SMG para determinar el rango.
 * El tope de cotización se aplica por separado (25 UMA desde reforma 2016).
 */
export interface EntradaTablaArt167 {
  /** Límite inferior del rango (en veces el SMG diario) */
  rangoMin: number;
  /** Límite superior del rango (en veces el SMG diario). Infinity = sin límite */
  rangoMax: number;
  /**
   * Cuantía básica: porcentaje del SBC promedio (últimas 250 semanas)
   * correspondiente a 500 semanas de cotización.
   * Fuente: Tabla del Art. 167 LSS 1973.
   * ESTIMACIÓN: porcentajes interpolados de tabla oficial; verificar con IMSS.
   */
  cuantiaBasicaPct: number;
  /**
   * Incremento por cada 52 semanas cotizadas adicionales a las 500 mínimas.
   * Fuente: Art. 167 LSS 1973, párrafo de incrementos anuales.
   * ESTIMACIÓN: verificar con IMSS.
   */
  incrementoAnualPct: number;
}

/**
 * Tabla del Art. 167 LSS 1973 — Cuantía básica e incrementos anuales.
 *
 * Porcentajes conforme a la tabla del Art. 167 LSS 1973 para pensiones de
 * invalidez, vejez y cesantía en edad avanzada: cuantía básica para 500
 * semanas e incrementos anuales por cada 52 semanas excedentes.
 *
 * Fuente de referencia:
 * - Ley del Seguro Social 1973, Art. 167
 * - "Manual de Prestaciones" IMSS (versión vigente al 2023)
 */
export const TABLA_ART167: readonly EntradaTablaArt167[] = [
  {
    rangoMin: 0,
    rangoMax: 1.0,
    cuantiaBasicaPct: 80.0,
    incrementoAnualPct: 0.563,
  },
  {
    rangoMin: 1.01,
    rangoMax: 1.25,
    cuantiaBasicaPct: 77.11,
    incrementoAnualPct: 0.814,
  },
  {
    rangoMin: 1.26,
    rangoMax: 1.5,
    cuantiaBasicaPct: 58.18,
    incrementoAnualPct: 1.178,
  },
  {
    rangoMin: 1.51,
    rangoMax: 1.75,
    cuantiaBasicaPct: 49.23,
    incrementoAnualPct: 1.43,
  },
  {
    rangoMin: 1.76,
    rangoMax: 2.0,
    cuantiaBasicaPct: 42.67,
    incrementoAnualPct: 1.615,
  },
  {
    rangoMin: 2.01,
    rangoMax: 2.25,
    cuantiaBasicaPct: 37.65,
    incrementoAnualPct: 1.756,
  },
  {
    rangoMin: 2.26,
    rangoMax: 2.5,
    cuantiaBasicaPct: 33.68,
    incrementoAnualPct: 1.868,
  },
  {
    rangoMin: 2.51,
    rangoMax: 2.75,
    cuantiaBasicaPct: 30.48,
    incrementoAnualPct: 1.958,
  },
  {
    rangoMin: 2.76,
    rangoMax: 3.0,
    cuantiaBasicaPct: 27.83,
    incrementoAnualPct: 2.033,
  },
  {
    rangoMin: 3.01,
    rangoMax: 3.25,
    cuantiaBasicaPct: 25.6,
    incrementoAnualPct: 2.096,
  },
  {
    rangoMin: 3.26,
    rangoMax: 3.5,
    cuantiaBasicaPct: 23.7,
    incrementoAnualPct: 2.149,
  },
  {
    rangoMin: 3.51,
    rangoMax: 3.75,
    cuantiaBasicaPct: 22.07,
    incrementoAnualPct: 2.195,
  },
  {
    rangoMin: 3.76,
    rangoMax: 4.0,
    cuantiaBasicaPct: 20.65,
    incrementoAnualPct: 2.235,
  },
  {
    rangoMin: 4.01,
    rangoMax: 4.25,
    cuantiaBasicaPct: 19.39,
    incrementoAnualPct: 2.271,
  },
  {
    rangoMin: 4.26,
    rangoMax: 4.5,
    cuantiaBasicaPct: 18.29,
    incrementoAnualPct: 2.302,
  },
  {
    rangoMin: 4.51,
    rangoMax: 4.75,
    cuantiaBasicaPct: 17.3,
    incrementoAnualPct: 2.33,
  },
  {
    rangoMin: 4.76,
    rangoMax: 5.0,
    cuantiaBasicaPct: 16.41,
    incrementoAnualPct: 2.355,
  },
  {
    rangoMin: 5.01,
    rangoMax: 5.25,
    cuantiaBasicaPct: 15.61,
    incrementoAnualPct: 2.377,
  },
  {
    rangoMin: 5.26,
    rangoMax: 5.5,
    cuantiaBasicaPct: 14.88,
    incrementoAnualPct: 2.398,
  },
  {
    rangoMin: 5.51,
    rangoMax: 5.75,
    cuantiaBasicaPct: 14.22,
    incrementoAnualPct: 2.416,
  },
  {
    rangoMin: 5.76,
    rangoMax: 6.0,
    cuantiaBasicaPct: 13.62,
    incrementoAnualPct: 2.433,
  },
  {
    rangoMin: 6.01,
    rangoMax: Infinity,
    cuantiaBasicaPct: 13.0,
    incrementoAnualPct: 2.45,
  },
] as const;

/** Días promedio por mes usados por UMA/IMSS para conversión mensual. */
export const DIAS_PROMEDIO_MES = 30.4;

/** Días por año para cálculo anual de UMA. */
export const DIAS_ANIO_UMA = 365;

/** Meses por año para cálculo anual de pensión. */
export const MESES_POR_ANIO = 12;

// ─────────────────────────────────────────────
// Factores de edad — Cesantía en Edad Avanzada
// Arts. 139–140 LSS 1973
// ─────────────────────────────────────────────

/**
 * Factor de reducción por retiro anticipado (Cesantía en Edad Avanzada).
 * Art. 139 LSS 1973: El asegurado con 60 años y 500 semanas puede pensionarse
 * con un porcentaje reducido de la cuantía de vejez.
 *
 * Fuente: Art. 139 LSS 1973 (DOF 12-mar-1973 y sus reformas).
 */
export const FACTORES_EDAD_CESANTIA: Readonly<Record<number, number>> = {
  60: 0.75,
  61: 0.8,
  62: 0.85,
  63: 0.9,
  64: 0.95,
  65: 1.0, // Pensión de vejez = 100%
} as const;

/** Edad mínima para Cesantía en Edad Avanzada (Art. 138 LSS 1973) */
export const EDAD_MINIMA_CESANTIA = 60;

/** Edad para Pensión de Vejez (Art. 145 LSS 1973) */
export const EDAD_VEJEZ = 65;

// ─────────────────────────────────────────────
// Semanas mínimas de cotización
// ─────────────────────────────────────────────

/** Semanas mínimas para Vejez (Art. 145 LSS 1973) */
export const SEMANAS_MINIMAS_VEJEZ = 500;

/** Semanas mínimas para Cesantía en Edad Avanzada (Art. 138 LSS 1973) */
export const SEMANAS_MINIMAS_CESANTIA = 500;

/** Semanas consideradas para el promedio del SBC (Art. 167 LSS 1973) */
export const SEMANAS_PROMEDIO_SBC = 250;

/** Semanas que representan un año cotizado (para incrementos anuales) */
export const SEMANAS_POR_ANIO = 52;

// ─────────────────────────────────────────────
// Asignaciones familiares y ayuda asistencial
// Arts. 163–165 LSS 1973
// ─────────────────────────────────────────────

/**
 * Asignación familiar por cónyuge o concubina/o.
 * Art. 164, fracción I, LSS 1973.
 */
export const ASIGNACION_CONYUGE_PCT = 0.15;

/**
 * Asignación familiar por cada hijo menor (hasta 16 años, o sin límite si incapacitado).
 * Art. 164, fracción II, LSS 1973.
 */
export const ASIGNACION_HIJO_PCT = 0.10;

/**
 * Asignación familiar por cada ascendiente dependiente económico
 * (cuando no hay cónyuge ni hijos).
 * Art. 164, fracción III, LSS 1973.
 */
export const ASIGNACION_ASCENDIENTE_PCT = 0.10;

/**
 * Ayuda asistencial cuando no hay beneficiarios con derecho a asignación familiar.
 * Art. 165 LSS 1973.
 */
export const AYUDA_ASISTENCIAL_SIN_BENEFICIARIOS_PCT = 0.15;

/**
 * Ayuda asistencial cuando el pensionado tiene cónyuge pero no hijos.
 * Art. 165 LSS 1973.
 * Nota: Esta ayuda aplica en ausencia de los beneficiarios mencionados en Art. 164.
 */
export const AYUDA_ASISTENCIAL_CON_CONYUGE_SIN_HIJOS_PCT = 0.10;

// ─────────────────────────────────────────────
// Límites
// ─────────────────────────────────────────────

/**
 * Tope máximo del SBC en veces UMA (diaria).
 * Fuente: Art. 28 LSS vigente (reforma DOF 27-ene-2016, derogación de referencias al SMG).
 * La cotización máxima es de 25 UMA diarias.
 */
export const TOPE_SBC_VECES_UMA = 25;

/**
 * La pensión mínima garantizada equivale al salario mínimo general vigente.
 * Art. 170 LSS 1973. Se actualiza conforme al SMG en vigor.
 *
 * NOTA: El IMSS usa el SMG de la zona del trabajador.
 * Para efectos de estimación se usa el SMG de CDMX (más alto).
 */
export const PMG_EQUIVALE_A_SMG = true;

// ─────────────────────────────────────────────
// Conservación de derechos
// ─────────────────────────────────────────────

/**
 * Período de conservación de derechos (Art. 182 LSS 1973).
 * Si el asegurado tiene 500+ semanas y deja de cotizar, conserva el derecho
 * durante un período igual a la cuarta parte del tiempo cotizado.
 * Máximo: 60 semanas (salvo disposición específica).
 *
 * Este cálculo aplica para determinar vigencia de la pensión.
 */
export const CONSERVACION_DERECHOS_FRACCION = 0.25;
export const CONSERVACION_DERECHOS_MAX_SEMANAS = 60; // (según criterio IMSS)

// ─────────────────────────────────────────────
// Modalidad 40
// ─────────────────────────────────────────────

/**
 * Artículo 218 del Reglamento de la LSS 1973 (antes Art. 218, actualmente en
 * el Reglamento de Incorporación y Recaudación del IMSS).
 * Permite al asegurado inscribirse voluntariamente con un SBC mayor al último
 * registrado, para incrementar su promedio de las últimas 250 semanas.
 */
export const MODALIDAD_40_ARTICULO = 'Art. 218 Reglamento LSS 1973';

/** El SBC de Modalidad 40 no puede ser menor al último SBC en el régimen obligatorio. */
export const MODALIDAD_40_SBC_MINIMO_IGUAL_A_ULTIMO_OBLIGATORIO = true;

/** Tope máximo de Modalidad 40: 25 UMA diarias (igual que el régimen obligatorio). */
export const MODALIDAD_40_TOPE_VECES_UMA = 25;

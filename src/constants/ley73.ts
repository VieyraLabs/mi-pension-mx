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
 * ⚠️ ESTIMACIÓN: Los porcentajes son los comúnmente referenciados en la
 * literatura jurídica y calculadoras oficiales del IMSS. Se recomienda
 * verificar con el texto oficial del DOF y criterios operativos del IMSS
 * antes de cualquier uso legal.
 *
 * Fuente de referencia:
 * - Ley del Seguro Social 1973, Art. 167
 * - "Manual de Prestaciones" IMSS (versión vigente al 2023)
 */
export const TABLA_ART167: readonly EntradaTablaArt167[] = [
  {
    rangoMin: 0,
    rangoMax: 1.0,
    cuantiaBasicaPct: 90.0,
    incrementoAnualPct: 0.5625,
  },
  {
    rangoMin: 1.01,
    rangoMax: 1.25,
    cuantiaBasicaPct: 82.5,
    incrementoAnualPct: 0.5625,
  },
  {
    rangoMin: 1.26,
    rangoMax: 1.5,
    cuantiaBasicaPct: 75.0,
    incrementoAnualPct: 0.5313,
  },
  {
    rangoMin: 1.51,
    rangoMax: 1.75,
    cuantiaBasicaPct: 72.5,
    incrementoAnualPct: 0.5,
  },
  {
    rangoMin: 1.76,
    rangoMax: 2.0,
    cuantiaBasicaPct: 70.0,
    incrementoAnualPct: 0.4688,
  },
  {
    rangoMin: 2.01,
    rangoMax: 2.25,
    cuantiaBasicaPct: 67.0,
    incrementoAnualPct: 0.4375,
  },
  {
    rangoMin: 2.26,
    rangoMax: 2.5,
    cuantiaBasicaPct: 64.0,
    incrementoAnualPct: 0.4063,
  },
  {
    rangoMin: 2.51,
    rangoMax: 3.0,
    cuantiaBasicaPct: 61.0,
    incrementoAnualPct: 0.375,
  },
  {
    rangoMin: 3.01,
    rangoMax: 3.5,
    cuantiaBasicaPct: 58.0,
    incrementoAnualPct: 0.3438,
  },
  {
    rangoMin: 3.51,
    rangoMax: 4.0,
    cuantiaBasicaPct: 55.0,
    incrementoAnualPct: 0.3125,
  },
  {
    rangoMin: 4.01,
    rangoMax: 4.5,
    cuantiaBasicaPct: 52.0,
    incrementoAnualPct: 0.2813,
  },
  {
    rangoMin: 4.51,
    rangoMax: 5.0,
    cuantiaBasicaPct: 49.0,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 5.01,
    rangoMax: 6.0,
    cuantiaBasicaPct: 46.0,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 6.01,
    rangoMax: 7.0,
    cuantiaBasicaPct: 43.5,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 7.01,
    rangoMax: 8.0,
    cuantiaBasicaPct: 41.0,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 8.01,
    rangoMax: 9.0,
    cuantiaBasicaPct: 39.0,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 9.01,
    rangoMax: 10.0,
    cuantiaBasicaPct: 37.5,
    incrementoAnualPct: 0.25,
  },
  {
    rangoMin: 10.01,
    rangoMax: Infinity,
    cuantiaBasicaPct: 37.5,
    incrementoAnualPct: 0.25,
  },
] as const;

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

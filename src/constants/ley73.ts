/**
 * Constantes de la Ley del Seguro Social de 1973 para el cálculo de pensiones.
 *
 * FUENTE PRINCIPAL: Ley del Seguro Social de 1973 (texto vigente al abrogarse),
 * Diario Oficial de la Federación, y criterios operativos del IMSS.
 *
 * NOTA LEGAL: Toda la información aquí contenida es de referencia. La resolución
 * oficial de pensiones corresponde exclusivamente al IMSS conforme a sus
 * procedimientos institucionales. Los resultados de esta aplicación son ESTIMACIONES.
 *
 * PROVENANCIA DOCUMENTAL (CHG-20261024-002 / US-005): cada constante exportada
 * lleva comentario de fuente (artículo de la Ley o Reglamento, publicación DOF
 * de origen) y vigencia aplicable. Al agregar o modificar una constante, ese
 * registro es un paso OBLIGATORIO del procedimiento: ver
 * docs/runbooks/05-actualizar-uma-y-constantes-legales.md (paso 4).
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
export interface Art167TableEntry {
  /** Límite inferior del rango (en veces el SMG diario) */
  rangeMin: number;
  /** Límite superior del rango (en veces el SMG diario). Infinity = sin límite */
  rangeMax: number;
  /**
   * Cuantía básica: porcentaje del SBC promedio (últimas 250 semanas)
   * correspondiente a 500 semanas de cotización.
   * Fuente: Tabla del Art. 167 LSS 1973.
   * ESTIMACIÓN: porcentajes interpolados de tabla oficial; verificar con IMSS.
   */
  basicQuantityPct: number;
  /**
   * Incremento por cada 52 semanas cotizadas adicionales a las 500 mínimas.
   * Fuente: Art. 167 LSS 1973, párrafo de incrementos anuales.
   * ESTIMACIÓN: verificar con IMSS.
   */
  annualIncrementPct: number;
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
export const ART167_TABLE: readonly Art167TableEntry[] = [
  {
    rangeMin: 0,
    rangeMax: 1.0,
    basicQuantityPct: 80.0,
    annualIncrementPct: 0.563,
  },
  {
    rangeMin: 1.01,
    rangeMax: 1.25,
    basicQuantityPct: 77.11,
    annualIncrementPct: 0.814,
  },
  {
    rangeMin: 1.26,
    rangeMax: 1.5,
    basicQuantityPct: 58.18,
    annualIncrementPct: 1.178,
  },
  {
    rangeMin: 1.51,
    rangeMax: 1.75,
    basicQuantityPct: 49.23,
    annualIncrementPct: 1.43,
  },
  {
    rangeMin: 1.76,
    rangeMax: 2.0,
    basicQuantityPct: 42.67,
    annualIncrementPct: 1.615,
  },
  {
    rangeMin: 2.01,
    rangeMax: 2.25,
    basicQuantityPct: 37.65,
    annualIncrementPct: 1.756,
  },
  {
    rangeMin: 2.26,
    rangeMax: 2.5,
    basicQuantityPct: 33.68,
    annualIncrementPct: 1.868,
  },
  {
    rangeMin: 2.51,
    rangeMax: 2.75,
    basicQuantityPct: 30.48,
    annualIncrementPct: 1.958,
  },
  {
    rangeMin: 2.76,
    rangeMax: 3.0,
    basicQuantityPct: 27.83,
    annualIncrementPct: 2.033,
  },
  {
    rangeMin: 3.01,
    rangeMax: 3.25,
    basicQuantityPct: 25.6,
    annualIncrementPct: 2.096,
  },
  {
    rangeMin: 3.26,
    rangeMax: 3.5,
    basicQuantityPct: 23.7,
    annualIncrementPct: 2.149,
  },
  {
    rangeMin: 3.51,
    rangeMax: 3.75,
    basicQuantityPct: 22.07,
    annualIncrementPct: 2.195,
  },
  {
    rangeMin: 3.76,
    rangeMax: 4.0,
    basicQuantityPct: 20.65,
    annualIncrementPct: 2.235,
  },
  {
    rangeMin: 4.01,
    rangeMax: 4.25,
    basicQuantityPct: 19.39,
    annualIncrementPct: 2.271,
  },
  {
    rangeMin: 4.26,
    rangeMax: 4.5,
    basicQuantityPct: 18.29,
    annualIncrementPct: 2.302,
  },
  {
    rangeMin: 4.51,
    rangeMax: 4.75,
    basicQuantityPct: 17.3,
    annualIncrementPct: 2.33,
  },
  {
    rangeMin: 4.76,
    rangeMax: 5.0,
    basicQuantityPct: 16.41,
    annualIncrementPct: 2.355,
  },
  {
    rangeMin: 5.01,
    rangeMax: 5.25,
    basicQuantityPct: 15.61,
    annualIncrementPct: 2.377,
  },
  {
    rangeMin: 5.26,
    rangeMax: 5.5,
    basicQuantityPct: 14.88,
    annualIncrementPct: 2.398,
  },
  {
    rangeMin: 5.51,
    rangeMax: 5.75,
    basicQuantityPct: 14.22,
    annualIncrementPct: 2.416,
  },
  {
    rangeMin: 5.76,
    rangeMax: 6.0,
    basicQuantityPct: 13.62,
    annualIncrementPct: 2.433,
  },
  {
    rangeMin: 6.01,
    rangeMax: Infinity,
    basicQuantityPct: 13.0,
    annualIncrementPct: 2.45,
  },
] as const;

/**
 * Días promedio por mes para conversión mensual de UMA.
 * Fuente: Ley para Determinar el Valor de la UMA, Art. 9 (el valor mensual se
 * obtiene multiplicando el diario por 30.4).
 * Publicación: DOF 27-ene-2016. Vigente — factor fijado por la propia ley.
 */
export const AVERAGE_DAYS_PER_MONTH = 30.4;

/**
 * Días por año para cálculo anual de UMA.
 * Fuente: Ley para Determinar el Valor de la UMA, Art. 9 (el valor anual se
 * obtiene multiplicando el diario por 365).
 * Publicación: DOF 27-ene-2016. Vigente — factor fijado por la propia ley.
 */
export const DAYS_PER_YEAR_UMA = 365;

/**
 * Meses por año para cálculo anual de pensión.
 * Fuente: constante aritmética — sin fundamento normativo (conversión de la
 * cuantía mensual a anual). Aplica para todo año de calendario.
 */
export const MONTHS_PER_YEAR = 12;

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
export const CESANTIA_AGE_FACTORS: Readonly<Record<number, number>> = {
  60: 0.75,
  61: 0.8,
  62: 0.85,
  63: 0.9,
  64: 0.95,
  65: 1.0, // Pensión de vejez = 100%
} as const;

/**
 * Edad mínima para Cesantía en Edad Avanzada.
 * Fuente: Art. 138 LSS 1973. Publicación: DOF 12-mar-1973 (LSS 1973 y reformas).
 * Vigencia: régimen de transición (asegurados en el régimen Ley 73 — alcance
 * explícito de esta app).
 */
export const MINIMUM_CESANTIA_AGE = 60;

/**
 * Edad para Pensión de Vejez.
 * Fuente: Art. 145 LSS 1973. Publicación: DOF 12-mar-1973 (LSS 1973 y reformas).
 * Vigencia: régimen de transición (alcance de esta app).
 */
export const VEJEZ_AGE = 65;

// ─────────────────────────────────────────────
// Semanas mínimas de cotización
// ─────────────────────────────────────────────

/**
 * Semanas mínimas de cotización para Pensión de Vejez.
 * Fuente: Art. 145 LSS 1973. Publicación: DOF 12-mar-1973 (y reformas).
 * Vigencia: régimen de transición (alcance de esta app).
 */
export const MINIMUM_WEEKS_VEJEZ = 500;

/**
 * Semanas mínimas de cotización para Cesantía en Edad Avanzada.
 * Fuente: Art. 138 LSS 1973. Publicación: DOF 12-mar-1973 (y reformas).
 * Vigencia: régimen de transición (alcance de esta app).
 */
export const MINIMUM_WEEKS_CESANTIA = 500;

/**
 * Semanas consideradas para el promedio del SBC (últimas 250 semanas cotizadas
 * dentro de los 5 años anteriores a la fecha de referencia).
 * Fuente: Art. 167 LSS 1973. Publicación: DOF 12-mar-1973 (y reformas).
 */
export const SBC_AVERAGE_WEEKS = 250;

/**
 * Semanas que representan un año cotizado (base de los incrementos anuales).
 * Fuente: Art. 167 LSS 1973 — el incremento procede "por cada año completo"
 * de cotización excedente, entendido como 52 semanas (criterio operativo IMSS).
 * Publicación: DOF 12-mar-1973 (y reformas).
 */
export const WEEKS_PER_YEAR = 52;

/**
 * Semanas promedio por mes (52 ÷ 12), para proyectar meses de Modalidad 40 a semanas.
 * Fuente: derivada de WEEKS_PER_YEAR (52 semanas/año, criterio operativo IMSS,
 * Art. 167 LSS 1973). No es un valor normativo independiente.
 */
export const WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12;

// ─────────────────────────────────────────────
// Asignaciones familiares y ayuda asistencial
// Arts. 163–165 LSS 1973
// ─────────────────────────────────────────────

/**
 * Asignación familiar por cónyuge o concubina/o (15% de la cuantía).
 * Fuente: Art. 164, fracción I, LSS 1973.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const SPOUSE_ALLOWANCE_PCT = 0.15;

/**
 * Asignación familiar por cada hijo menor (hasta 16 años, o sin límite si incapacitado)
 * — 10% de la cuantía por hijo.
 * Fuente: Art. 164, fracción II, LSS 1973.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const CHILD_ALLOWANCE_PCT = 0.10;

/**
 * Asignación familiar por cada ascendiente dependiente económico (10% de la
 * cuantía por ascendiente, cuando no hay cónyuge ni hijos).
 * Fuente: Art. 164, fracción III, LSS 1973.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const PARENT_ALLOWANCE_PCT = 0.10;

/**
 * Ayuda asistencial (15% de la cuantía) cuando no hay beneficiarios con derecho
 * a asignación familiar.
 * Fuente: Art. 165 LSS 1973.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const ASSISTANCE_AID_NO_BENEFICIARIES_PCT = 0.15;

/**
 * Ayuda asistencial (10% de la cuantía) cuando el pensionado tiene cónyuge pero
 * no hijos.
 * Fuente: Art. 165 LSS 1973. Nota: aplica en ausencia de los beneficiarios
 * mencionados en Art. 164.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const ASSISTANCE_AID_SPOUSE_NO_CHILDREN_PCT = 0.10;

// ─────────────────────────────────────────────
// Límites
// ─────────────────────────────────────────────

/**
 * Tope máximo del SBC en veces UMA (diaria).
 * Fuente: Art. 28 LSS vigente (reforma DOF 27-ene-2016, derogación de referencias al SMG).
 * La cotización máxima es de 25 UMA diarias.
 */
export const SBC_CAP_TIMES_UMA = 25;

/**
 * La pensión mínima garantizada equivale al salario mínimo general vigente.
 * Art. 170 LSS 1973. Se actualiza conforme al SMG en vigor.
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 *
 * NOTA: El IMSS usa el SMG de la zona del trabajador.
 * Para efectos de estimación se usa el SMG de CDMX (más alto).
 */
export const PMG_EQUALS_SMG = true;

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
 * Publicación: DOF 12-mar-1973 (y reformas). Vigencia: régimen de transición.
 */
export const RIGHTS_PRESERVATION_FRACTION = 0.25;
// 60 semanas — criterio operativo IMSS de referencia (el Art. 182 fija la
// fórmula; el tope práctico de 60 semanas no proviene de un texto legal directo).
export const RIGHTS_PRESERVATION_MAX_WEEKS = 60;

// ─────────────────────────────────────────────
// Incremento del 11% (Decreto DOF 2001/2004)
// ─────────────────────────────────────────────

/**
 * Incremento del 11% aplicado a la cuantía de la pensión Ley 73
 * (cuantía básica + incrementos anuales), previo al factor de edad.
 *
 * Fuente: Decreto por el que se reforman y adicionan los artículos Décimo
 * Cuarto y Vigésimo Cuarto Transitorios del Decreto que reforma y adiciona
 * diversas disposiciones de la Ley del Seguro Social.
 * DOF: 20 de diciembre de 2001. Modificación: DOF 5 de enero de 2004.
 * https://www.diputados.gob.mx/LeyesBiblio/ref/lss/LSS_ref04_05ene04.pdf
 */
export const DECREE_11_INCREMENT = 0.11;

// ─────────────────────────────────────────────
// Modalidad 40
// ─────────────────────────────────────────────

/**
 * Artículo 218 del Reglamento de la LSS 1973, hoy ubicado en el Reglamento de
 * Incorporación y Recaudación del IMSS.
 * Permite al asegurado inscribirse voluntariamente con un SBC mayor al último
 * registrado, para incrementar su promedio de las últimas 250 semanas.
 * Publicación: DOF 21-nov-2002 (Reglamento de Incorporación y Recaudación, y
 * reformas). Vigente.
 */
export const MODALIDAD_40_ARTICLE = 'Art. 218 Reglamento LSS 1973';

/**
 * El SBC de Modalidad 40 no puede ser menor al último SBC en el régimen obligatorio.
 * Fuente: Art. 218 del Reglamento de Incorporación y Recaudación del IMSS
 * (DOF 21-nov-2002, y reformas). Vigente.
 */
export const MODALIDAD_40_MINIMUM_SBC_EQUALS_LAST_MANDATORY = true;

/**
 * Tope máximo de Modalidad 40: 25 UMA diarias (igual que el régimen obligatorio).
 * Fuente: tope de cotización del Art. 28 LSS vigente (reforma DOF 27-ene-2016),
 * aplicable también a la inscripción voluntaria.
 */
export const MODALIDAD_40_CAP_TIMES_UMA = 25;

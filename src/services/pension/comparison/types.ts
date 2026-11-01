/**
 * Tipos del dominio de comparación «contratar Modalidad 10 vs pensionarse
 * lo antes posible». Son tipos puros: no dependen de la UI ni de la red.
 */

export type ComparisonScenarioId = 'm10' | 'early';

/**
 * Un punto de la serie temporal (un mes) de un escenario.
 * Eje X: meses desde la fecha de referencia. Eje Y: pesos acumulados netos
 * (recibido − pagado), en pesos nominales.
 */
export interface ComparisonSeriesPoint {
  /** Mes desde la fecha de referencia (0 = mes de referencia). */
  monthIndex: number;
  /** Fecha del mes (mismo día de la referencia, desplazado `monthIndex` meses). */
  date: Date;
  /** Edad de la persona en ese mes (años, con fracción). */
  age: number;
  /** Pensión mensual vigente en ese mes (pesos nominales). */
  monthlyPension: number;
  /** Flujo neto acumulado al cierre del mes (recibido − pagado). */
  cumulativeNet: number;
}

/** Punto de equilibrio entre los dos escenarios. */
export interface BreakEvenPoint {
  /** Mes desde la fecha de referencia en que M10 iguala a «antes». */
  monthIndex: number;
  /** Meses transcurridos desde que el escenario «antes» se pensiona (los 60 o el mes siguiente). */
  monthsAfterEarlyRetirement: number;
  date: Date;
  /** Edad de la persona en ese mes (años). */
  age: number;
  /** Año calendario del punto de equilibrio. */
  year: number;
  /** Flujo neto acumulado en el punto de equilibrio. */
  cumulativeNet: number;
}

/** Un escenario de la comparativa con su serie acumulada. */
export interface ComparisonScenario {
  id: ComparisonScenarioId;
  label: string;
  /** Pensión mensual inicial (pesos nominales, sin incremento post-retiro). */
  initialMonthlyPension: number;
  /** Serie de flujo acumulado (longitud `horizonMonths + 1`). */
  series: ComparisonSeriesPoint[];
}

/** Configuración para construir la serie de un escenario. */
export interface ComparisonSeriesConfig {
  /** Pensión mensual inicial (pesos nominales). */
  initialMonthlyPension: number;
  /** Fecha en que el escenario empieza a percibir la pensión. */
  retirementDate: Date;
  /** Costo mensual durante el periodo de pago (0 si no paga). */
  monthlyCost: number;
  /** Mes (índice desde la referencia) hasta el que paga inclusive; -1 si nunca paga. */
  payUntilMonth: number;
  horizonMonths: number;
  referenceDate: Date;
  birthDate: Date;
}

/** Resultado completo de la comparativa. */
export interface ComparisonResult {
  referenceDate: Date;
  horizonMonths: number;
  earlyScenario: ComparisonScenario;
  m10Scenario: ComparisonScenario;
  /** Punto de equilibrio, o `null` si no se alcanza dentro del horizonte. */
  breakEven: BreakEvenPoint | null;
  /** Costo total de la Modalidad 10 (suma de cuotas mensuales, sin descuento). */
  totalM10Cost: number;
  /** Pensión dejada de percibir durante el periodo entre los 60 y el retiro M10. */
  forgonePension: number;
  /** Pensión mensual inicial del escenario «antes». */
  earlyMonthlyPension: number;
  /** Pensión mensual inicial del escenario M10. */
  m10MonthlyPension: number;
}

/**
 * Tipos internos del motor de cálculo de pensión.
 * Separados del dominio para mantener el motor desacoplado.
 */

import type {
  PensionInput,
  PasoCalculo,
  TipoPension,
} from '../../models';

/** Contexto inmutable que se pasa entre los pasos del pipeline. */
export interface CalculationContext {
  readonly input: PensionInput;
  /** Salario diario efectivo (ya topado y ajustado por M40) */
  salarioEfectivoDiario: number;
  /** Salario en veces el SMG (para buscar rango en tabla Art. 167) */
  salarioEnVecesSMG: number;
  /** Porcentaje de cuantía básica de la tabla Art. 167 */
  cuantiaBasicaPct: number;
  /** Incremento anual de la tabla Art. 167 */
  incrementoAnualPct: number;
  /** Número de años excedentes (semanas_excedentes / 52) */
  aniosExcedentes: number;
  /** Cuantía básica en pesos (salarioEfectivoDiario * cuantiaBasicaPct * 30.4) */
  cuantiaBasicaMensual: number;
  /** Total de incrementos anuales en pesos */
  incrementosMensual: number;
  /** Subtotal antes de factor de edad */
  subtotalAntesFactor: number;
  /** Factor de edad (0.75 a 1.0) */
  factorEdad: number;
  /** Cuantía después de factor de edad */
  cuantiaConFactor: number;
  /** Asignaciones familiares en pesos */
  asignacionesFamiliares: number;
  /** Ayuda asistencial en pesos */
  ayudaAsistencial: number;
  /** Tipo de pensión determinado */
  tipoPension: TipoPension;
  /** Si se aplicó el tope de 25 UMA */
  aplicoTope: boolean;
  /** Si se aplicó la pensión mínima garantizada */
  aplicoPMG: boolean;
  /** Total pensión mensual */
  pensionMensual: number;
  /** Pasos acumulados del pipeline */
  pasos: PasoCalculo[];
  /** Advertencias acumuladas */
  advertencias: string[];
}

/** Paso puro del pipeline: recibe contexto y devuelve contexto actualizado. */
export type CalculationStep = (ctx: CalculationContext) => CalculationContext;

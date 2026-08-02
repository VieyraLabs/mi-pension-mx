/**
 * Cálculo del SBC promedio ponderado por días sobre una ventana de semanas
 * (Art. 167 LSS 1973: últimas 250 semanas).
 *
 * Genérico respecto a la fuente: sirve tanto para una aproximación
 * construida a partir de "último SBC por patrón" (Constancia de Semanas
 * Cotizadas) como para un cálculo exacto si la fuente trae el historial
 * completo de cambios de SBC dentro de cada patrón.
 */
import { round2 } from './format';

export interface PeriodoSBC {
  fechaInicio: Date;
  /** Fin del periodo (inclusive). Si el empleo sigue vigente, usar la fecha de referencia. */
  fechaFin: Date;
  /** Salario Base de Cotización diario vigente durante este periodo. */
  sbc: number;
}

export interface ResultadoPromedioSBC {
  /** SBC promedio ponderado por días dentro de la ventana. */
  promedio: number;
  /** Días de la ventana efectivamente cubiertos por los periodos dados. */
  diasCubiertos: number;
  /** Días totales de la ventana solicitada (semanas × 7). */
  diasEsperados: number;
  /** Si los periodos cubren la ventana completa (con un margen pequeño). */
  completo: boolean;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Calcula el SBC promedio ponderado por días dentro de la ventana de
 * `semanas` semanas previas a `fechaReferencia`.
 *
 * @returns null si no hay periodos o ninguno se traslapa con la ventana.
 */
export function calcularSbcPromedioPonderado(
  periodos: PeriodoSBC[],
  fechaReferencia: Date,
  semanas: number,
): ResultadoPromedioSBC | null {
  if (periodos.length === 0) return null;

  const diasEsperados = semanas * 7;
  const finVentana = fechaReferencia.getTime();
  const inicioVentana = finVentana - diasEsperados * MS_POR_DIA;

  let sumaPonderada = 0;
  let diasCubiertos = 0;

  for (const periodo of periodos) {
    const inicio = Math.max(periodo.fechaInicio.getTime(), inicioVentana);
    // +1 día porque fechaFin es inclusiva.
    const fin = Math.min(periodo.fechaFin.getTime() + MS_POR_DIA, finVentana);
    if (fin <= inicio) continue;

    const dias = (fin - inicio) / MS_POR_DIA;
    sumaPonderada += dias * periodo.sbc;
    diasCubiertos += dias;
  }

  if (diasCubiertos <= 0) return null;

  return {
    promedio: round2(sumaPonderada / diasCubiertos),
    diasCubiertos: Math.round(diasCubiertos),
    diasEsperados,
    completo: diasCubiertos >= diasEsperados * 0.98,
  };
}

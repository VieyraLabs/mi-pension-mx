/**
 * Tabla histórica de UMA (Unidad de Medida y Actualización) y SMG (Salario Mínimo General).
 * Fuente: INEGI (UMA), CONASAMI (SMG), publicados en DOF.
 * Los valores marcados como esEstimacion:true son proyecciones y deben verificarse.
 *
 * NOTA LEGAL: Los valores de UMA y SMG son utilizados únicamente como referencia
 * para los cálculos. La resolución oficial corresponde al IMSS.
 */
import type { RegistroUMA } from '../models';
import { DIAS_ANIO_UMA, DIAS_PROMEDIO_MES } from './ley73';

export const TABLA_UMA_SMG: readonly RegistroUMA[] = [
  {
    anio: 2017,
    umaDiaria: 75.49,
    umaMensual: 2294.9,
    umaAnual: 27553.85,
    smgCdmx: 80.04,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2017 (INEGI), DOF 01-dic-2016 (CONASAMI)',
  },
  {
    anio: 2018,
    umaDiaria: 80.6,
    umaMensual: 2450.24,
    umaAnual: 29419.0,
    smgCdmx: 88.36,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2018 (INEGI), DOF 19-dic-2017 (CONASAMI)',
  },
  {
    anio: 2019,
    umaDiaria: 84.49,
    umaMensual: 2568.5,
    umaAnual: 30838.85,
    smgCdmx: 102.68,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2019 (INEGI), DOF 28-dic-2018 (CONASAMI)',
  },
  {
    anio: 2020,
    umaDiaria: 86.88,
    umaMensual: 2641.15,
    umaAnual: 31711.2,
    smgCdmx: 123.22,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2020 (INEGI), DOF 01-ene-2020 (CONASAMI)',
  },
  {
    anio: 2021,
    umaDiaria: 89.62,
    umaMensual: 2724.45,
    umaAnual: 32711.3,
    smgCdmx: 141.7,
    esEstimacion: false,
    fuente: 'DOF 11-ene-2021 (INEGI), DOF 01-ene-2021 (CONASAMI)',
  },
  {
    anio: 2022,
    umaDiaria: 96.22,
    umaMensual: 2925.09,
    umaAnual: 35120.3,
    smgCdmx: 172.87,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2022 (INEGI), DOF 01-ene-2022 (CONASAMI)',
  },
  {
    anio: 2023,
    umaDiaria: 103.74,
    umaMensual: 3153.7,
    umaAnual: 37865.1,
    smgCdmx: 207.44,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2023 (INEGI), DOF 01-ene-2023 (CONASAMI)',
  },
  {
    anio: 2024,
    umaDiaria: 108.57,
    umaMensual: 3300.53,
    umaAnual: 39628.05,
    smgCdmx: 248.93,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2024 (INEGI), DOF 01-ene-2024 (CONASAMI)',
  },
  {
    anio: 2025,
    umaDiaria: 113.14,
    umaMensual: 3439.46,
    umaAnual: 41296.1,
    smgCdmx: 278.8,
    esEstimacion: false,
    fuente: 'DOF 10-ene-2025 (INEGI), DOF 01-ene-2025 (CONASAMI)',
  },
  {
    anio: 2026,
    // Estimación basada en tendencia histórica (~4% de incremento).
    // VERIFICAR en DOF correspondiente (enero 2026).
    umaDiaria: 117.7,
    umaMensual: 3578.28,
    umaAnual: 42960.5,
    smgCdmx: 315.04,
    esEstimacion: true,
    fuente:
      'UMA estimada — verificar publicación DOF enero 2026 (INEGI). ' +
      'SMG ZSMG 2026 oficial CONASAMI, Tabla de Salarios Mínimos 2026 (PDF gob.mx).',
  },
] as const;

/** UMA vigente para el año actual (2026). Verificar con DOF. */
export const UMA_ACTUAL: RegistroUMA = TABLA_UMA_SMG[TABLA_UMA_SMG.length - 1]!;

/** Obtiene el registro UMA/SMG para un año específico. */
export function getUMAPorAnio(anio: number): RegistroUMA | undefined {
  return TABLA_UMA_SMG.find((r) => r.anio === anio);
}

/** Obtiene el registro UMA/SMG más reciente disponible. */
export function getUMAMasReciente(): RegistroUMA {
  return TABLA_UMA_SMG[TABLA_UMA_SMG.length - 1]!;
}

/**
 * Calcula los valores de UMA mensual y anual a partir del valor diario.
 * Art. 9 de la Ley para Determinar el Valor de la UMA:
 * - Mensual = Diario × 30.4
 * - Anual = Diario × 365
 */
export function calcularUMADesdeValorDiario(umaDiaria: number): {
  umaDiaria: number;
  umaMensual: number;
  umaAnual: number;
} {
  return {
    umaDiaria,
    umaMensual: parseFloat((umaDiaria * DIAS_PROMEDIO_MES).toFixed(2)),
    umaAnual: parseFloat((umaDiaria * DIAS_ANIO_UMA).toFixed(2)),
  };
}

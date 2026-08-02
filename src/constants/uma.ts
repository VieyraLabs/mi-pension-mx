/**
 * Tabla histórica de UMA (Unidad de Medida y Actualización) y SMG (Salario Mínimo General).
 * Fuente: INEGI (UMA), CONASAMI (SMG), publicados en DOF.
 * Los valores marcados como esEstimacion:true son proyecciones y deben verificarse.
 *
 * NOTA LEGAL: Los valores de UMA y SMG son utilizados únicamente como referencia
 * para los cálculos. La resolución oficial corresponde al IMSS.
 */
import type { UMARecord } from '../models';
import { DAYS_PER_YEAR_UMA, AVERAGE_DAYS_PER_MONTH } from './ley73';

export const TABLA_UMA_SMG: readonly UMARecord[] = [
  {
    year: 2017,
    dailyUMA: 75.49,
    monthlyUMA: 2294.9,
    annualUMA: 27553.85,
    smgCdmx: 80.04,
    isEstimate: false,
    source: 'DOF 10-ene-2017 (INEGI), DOF 01-dic-2016 (CONASAMI)',
  },
  {
    year: 2018,
    dailyUMA: 80.6,
    monthlyUMA: 2450.24,
    annualUMA: 29419.0,
    smgCdmx: 88.36,
    isEstimate: false,
    source: 'DOF 10-ene-2018 (INEGI), DOF 19-dic-2017 (CONASAMI)',
  },
  {
    year: 2019,
    dailyUMA: 84.49,
    monthlyUMA: 2568.5,
    annualUMA: 30838.85,
    smgCdmx: 102.68,
    isEstimate: false,
    source: 'DOF 10-ene-2019 (INEGI), DOF 28-dic-2018 (CONASAMI)',
  },
  {
    year: 2020,
    dailyUMA: 86.88,
    monthlyUMA: 2641.15,
    annualUMA: 31711.2,
    smgCdmx: 123.22,
    isEstimate: false,
    source: 'DOF 10-ene-2020 (INEGI), DOF 01-ene-2020 (CONASAMI)',
  },
  {
    year: 2021,
    dailyUMA: 89.62,
    monthlyUMA: 2724.45,
    annualUMA: 32711.3,
    smgCdmx: 141.7,
    isEstimate: false,
    source: 'DOF 11-ene-2021 (INEGI), DOF 01-ene-2021 (CONASAMI)',
  },
  {
    year: 2022,
    dailyUMA: 96.22,
    monthlyUMA: 2925.09,
    annualUMA: 35120.3,
    smgCdmx: 172.87,
    isEstimate: false,
    source: 'DOF 10-ene-2022 (INEGI), DOF 01-ene-2022 (CONASAMI)',
  },
  {
    year: 2023,
    dailyUMA: 103.74,
    monthlyUMA: 3153.7,
    annualUMA: 37865.1,
    smgCdmx: 207.44,
    isEstimate: false,
    source: 'DOF 10-ene-2023 (INEGI), DOF 01-ene-2023 (CONASAMI)',
  },
  {
    year: 2024,
    dailyUMA: 108.57,
    monthlyUMA: 3300.53,
    annualUMA: 39628.05,
    smgCdmx: 248.93,
    isEstimate: false,
    source: 'DOF 10-ene-2024 (INEGI), DOF 01-ene-2024 (CONASAMI)',
  },
  {
    year: 2025,
    dailyUMA: 113.14,
    monthlyUMA: 3439.46,
    annualUMA: 41296.1,
    smgCdmx: 278.8,
    isEstimate: false,
    source: 'DOF 10-ene-2025 (INEGI), DOF 01-ene-2025 (CONASAMI)',
  },
  {
    year: 2026,
    // Estimación basada en tendencia histórica (~4% de incremento).
    // VERIFICAR en DOF correspondiente (enero 2026).
    dailyUMA: 117.7,
    monthlyUMA: 3578.28,
    annualUMA: 42960.5,
    smgCdmx: 315.04,
    isEstimate: true,
    source:
      'UMA estimada — verificar publicación DOF enero 2026 (INEGI). ' +
      'SMG ZSMG 2026 oficial CONASAMI, Tabla de Salarios Mínimos 2026 (PDF gob.mx).',
  },
] as const;

/** UMA vigente para el año actual (2026). Verificar con DOF. */
export const UMA_ACTUAL: UMARecord = TABLA_UMA_SMG[TABLA_UMA_SMG.length - 1]!;

/** Obtiene el registro UMA/SMG para un año específico. */
export function getUMAByYear(anio: number): UMARecord | undefined {
  return TABLA_UMA_SMG.find((r) => r.year === anio);
}

/** Obtiene el registro UMA/SMG más reciente disponible. */
export function getMostRecentUMA(): UMARecord {
  return TABLA_UMA_SMG[TABLA_UMA_SMG.length - 1]!;
}

/**
 * Calcula los valores de UMA mensual y anual a partir del valor diario.
 * Art. 9 de la Ley para Determinar el Valor de la UMA:
 * - Mensual = Diario × 30.4
 * - Anual = Diario × 365
 */
export function calculateUMAFromDailyValue(dailyUMA: number): {
  dailyUMA: number;
  monthlyUMA: number;
  annualUMA: number;
} {
  return {
    dailyUMA,
    monthlyUMA: parseFloat((dailyUMA * AVERAGE_DAYS_PER_MONTH).toFixed(2)),
    annualUMA: parseFloat((dailyUMA * DAYS_PER_YEAR_UMA).toFixed(2)),
  };
}

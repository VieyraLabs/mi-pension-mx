/**
 * Utilidades de formateo de moneda, números y fechas para la aplicación.
 * Usa Intl para formateo correcto en español mexicano (es-MX).
 */
import { AVERAGE_DAYS_PER_MONTH } from '../constants/ley73';

const LOCALE = 'es-MX';

const CURRENCY_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INTEGER_FORMATTER = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const DATE_SHORT_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const PERCENT_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un número como moneda MXN. Ej: $1,234.56 */
export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

/** Formatea un número con 2 decimales. Ej: 1,234.56 */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** Formatea un número sin decimales. Ej: 1,234 */
export function formatInteger(value: number): string {
  return INTEGER_FORMATTER.format(Math.round(value));
}

/** Formatea una fecha en formato largo. Ej: 1 de enero de 2024 */
export function formatDateLong(date: Date): string {
  if (isNaN(date.getTime())) return 'Fecha no disponible';
  return DATE_FORMATTER.format(date);
}

/** Formatea una fecha en formato corto. Ej: 01/01/2024 */
export function formatDateShort(date: Date): string {
  if (isNaN(date.getTime())) return 'Fecha no disponible';
  return DATE_SHORT_FORMATTER.format(date);
}

/** Formatea un porcentaje. Ej: 75.50% */
export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value / 100);
}

/** Formatea un decimal como porcentaje (0.75 → 75.00%) */
export function formatDecimalAsPercent(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

/** Convierte salario mensual a diario (÷ 30.4 según IMSS) */
export function monthlyToDaily(monthlySalary: number): number {
  return parseFloat((monthlySalary / AVERAGE_DAYS_PER_MONTH).toFixed(4));
}

/** Convierte salario diario a mensual (× 30.4 según IMSS) */
export function dailyToMonthly(dailySalary: number): number {
  return parseFloat((dailySalary * AVERAGE_DAYS_PER_MONTH).toFixed(2));
}

/** Redondea a 2 decimales para moneda */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Redondea a 4 decimales para porcentajes */
export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

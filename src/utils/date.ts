/**
 * Utilidades de manejo de fechas para la aplicación.
 */

/** Calcula la edad en años completos a partir de la fecha de nacimiento. */
export function calcularEdad(fechaNacimiento: Date, referencia?: Date): number {
  const ref = referencia ?? new Date();
  let edad = ref.getFullYear() - fechaNacimiento.getFullYear();
  const mes = ref.getMonth() - fechaNacimiento.getMonth();
  if (mes < 0 || (mes === 0 && ref.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/** Calcula la fecha estimada de retiro dado el año de nacimiento y la edad de retiro. */
export function calcularFechaRetiro(fechaNacimiento: Date, edadRetiro: number): Date {
  const fecha = new Date(fechaNacimiento);
  fecha.setFullYear(fecha.getFullYear() + edadRetiro);
  return fecha;
}

/** Obtiene el año actual. */
export function getAnioActual(): number {
  return new Date().getFullYear();
}

/** Convierte una fecha a string ISO (YYYY-MM-DD). */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/** Parsea un string ISO (YYYY-MM-DD) a Date. */
export function fromISODate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

/** Agrega meses a una fecha. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Utilidades de manejo de fechas para la aplicación.
 */

/** Calcula la edad en años completos a partir de la fecha de nacimiento. */
export function calculateAge(birthDate: Date, reference?: Date): number {
  const ref = reference ?? new Date();
  let age = ref.getFullYear() - birthDate.getFullYear();
  const month = ref.getMonth() - birthDate.getMonth();
  if (month < 0 || (month === 0 && ref.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/** Calcula la fecha estimada de retiro dado el año de nacimiento y la edad de retiro. */
export function calculateRetirementDate(birthDate: Date, retirementAge: number): Date {
  const date = new Date(birthDate);
  date.setFullYear(date.getFullYear() + retirementAge);
  return date;
}

/** Obtiene el año actual. */
export function getCurrentYear(): number {
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

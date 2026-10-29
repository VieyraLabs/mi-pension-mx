/** Pruebas de copy y formato compartido entre resultados, historial y PDF. */
import { formatWeeksTargetText, getWeeksLabel, WEEKS_RECORDED_LABEL, WEEKS_TARGET_LABEL } from '../utils/format';

describe('formato compartido de semanas estimadas', () => {
  test('centraliza la etiqueta de proyección al retiro', () => {
    expect(WEEKS_TARGET_LABEL).toBe('Semanas estimadas al pensionarte');
  });

  test('elige etiquetas distintas según haya una proyección disponible', () => {
    expect(getWeeksLabel({
      currentWeeks: 600,
      projectedWeeks: 0,
      targetWeeks: 600,
      yearsToRetirement: 0,
    })).toBe(WEEKS_TARGET_LABEL);
    expect(getWeeksLabel()).toBe(WEEKS_RECORDED_LABEL);
  });

  test('formatea el valor objetivo guardado sin recalcular la proyección', () => {
    expect(
      formatWeeksTargetText({
        currentWeeks: 600,
        projectedWeeks: 1044,
        targetWeeks: 1644,
        yearsToRetirement: 20,
      }, 65),
    ).toBe('1,644 sem. (600 cotizadas + 1,044 proyectadas hasta los 65 años)');
  });
});

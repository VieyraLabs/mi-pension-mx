import { calculateWeightedAverageSBC } from '../utils/sbcPromedio';

const SEMANAS = 250; // ~1750 días

describe('calcularSbcPromedioPonderado', () => {
  test('un solo periodo que cubre toda la ventana da su propio SBC como promedio', () => {
    const hoy = new Date(2026, 0, 1);
    const resultado = calculateWeightedAverageSBC(
      [{ startDate: new Date(2010, 0, 1), endDate: hoy, sbc: 300 }],
      hoy,
      SEMANAS,
    );
    expect(resultado?.average).toBe(300);
    expect(resultado?.isComplete).toBe(true);
  });

  test('dos periodos de igual duración dentro de la ventana promedian por partes iguales', () => {
    const hoy = new Date(2026, 0, 1);
    // Cada periodo cubre ~875 días (mitad de la ventana de 250 semanas)
    const mitad = new Date(hoy.getTime() - 875 * 24 * 60 * 60 * 1000);
    const inicio = new Date(hoy.getTime() - SEMANAS * 7 * 24 * 60 * 60 * 1000);
    const resultado = calculateWeightedAverageSBC(
      [
        { startDate: inicio, endDate: mitad, sbc: 100 },
        { startDate: new Date(mitad.getTime() + 24 * 60 * 60 * 1000), endDate: hoy, sbc: 300 },
      ],
      hoy,
      SEMANAS,
    );
    expect(resultado?.average).toBeCloseTo(200, 0);
    expect(resultado?.isComplete).toBe(true);
  });

  test('marca incompleto cuando los periodos no cubren toda la ventana', () => {
    const hoy = new Date(2026, 0, 1);
    // Solo 1 año de historial, mucho menos que 250 semanas (~4.8 años)
    const resultado = calculateWeightedAverageSBC(
      [{ startDate: new Date(2025, 0, 1), endDate: hoy, sbc: 300 }],
      hoy,
      SEMANAS,
    );
    expect(resultado?.isComplete).toBe(false);
    expect(resultado?.daysCovered).toBeLessThan(resultado!.expectedDays);
  });

  test('devuelve null si no hay periodos', () => {
    expect(calculateWeightedAverageSBC([], new Date(2026, 0, 1), SEMANAS)).toBeNull();
  });

  test('devuelve null si los periodos no se traslapan con la ventana', () => {
    const hoy = new Date(2026, 0, 1);
    const resultado = calculateWeightedAverageSBC(
      [{ startDate: new Date(1990, 0, 1), endDate: new Date(1995, 0, 1), sbc: 50 }],
      hoy,
      SEMANAS,
    );
    expect(resultado).toBeNull();
  });

  test('ignora la parte de un periodo que cae fuera de la ventana', () => {
    const hoy = new Date(2026, 0, 1);
    // Este periodo empieza muy antes de la ventana de 250 semanas; solo debe
    // contarse la porción dentro de la ventana.
    const resultado = calculateWeightedAverageSBC(
      [{ startDate: new Date(2000, 0, 1), endDate: hoy, sbc: 300 }],
      hoy,
      SEMANAS,
    );
    expect(resultado?.average).toBe(300);
    expect(resultado?.isComplete).toBe(true);
  });
});

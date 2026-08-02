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

  test('cuando dos patrones se traslapan, usa el SBC más alto en esos días sin duplicarlos', () => {
    const hoy = new Date(2026, 0, 1);
    const inicioVentana = new Date(hoy.getTime() - SEMANAS * 7 * 24 * 60 * 60 * 1000);
    // Patrón A cubre toda la ventana (1750 días) con SBC 100.
    // Patrón B se traslapa con los últimos 100 días de A con un SBC mayor (500).
    const resultado = calculateWeightedAverageSBC(
      [
        { startDate: inicioVentana, endDate: hoy, sbc: 100 },
        { startDate: new Date(hoy.getTime() - 100 * 24 * 60 * 60 * 1000), endDate: hoy, sbc: 500 },
      ],
      hoy,
      SEMANAS,
    );
    // 1650 días × 100 + 100 días (traslapados, SBC más alto) × 500 = 215000 ÷ 1750 días.
    expect(resultado?.average).toBeCloseTo(122.86, 1);
    // Los 100 días traslapados se cuentan una sola vez, no una vez por patrón.
    expect(resultado?.daysCovered).toBe(1750);
    expect(resultado?.isComplete).toBe(true);
  });
});

/**
 * Pruebas del cálculo de las últimas 250 SEMANAS COTIZADAS (Art. 167 LSS 1973).
 *
 * La regla central bajo prueba: son 250 semanas *cotizadas*, no 250 semanas
 * *calendario*. Los huecos sin cotización se conservan en el historial pero
 * se saltan al promediar, y el recorrido sigue hacia atrás hasta reunir las
 * 250 semanas cotizadas.
 */
import {
  buildContributionHistory,
  calculateAverageSalary,
  calculateContributionSummary,
  getContributedWeeks,
  getLastContributionWeeks,
  summarizeLastContributedWeeks,
  type SBCPeriod,
} from '../services/pension/history';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const REFERENCIA = new Date(2026, 0, 1);

/**
 * Construye un periodo que abarca las semanas `[desdeSemana, hastaSemana)`
 * contadas hacia atrás desde la fecha de referencia (0 = la semana más
 * reciente). Permite describir historiales por semanas en vez de por fechas.
 */
function periodoPorSemanas(desdeSemana: number, hastaSemana: number, sbc: number): SBCPeriod {
  const endDate = new Date(REFERENCIA.getTime() - desdeSemana * MS_PER_WEEK - MS_PER_DAY);
  const startDate = new Date(REFERENCIA.getTime() - hastaSemana * MS_PER_WEEK);
  return { startDate, endDate, sbc };
}

describe('buildContributionHistory', () => {
  test('marca como cotizadas las semanas cubiertas y como huecos las que no', () => {
    // 10 semanas cotizadas, 5 de hueco, 10 cotizadas (de más antigua a más reciente).
    const history = buildContributionHistory(
      [periodoPorSemanas(0, 10, 200), periodoPorSemanas(15, 25, 100)],
      REFERENCIA,
    );

    expect(history.weeks).toHaveLength(25);
    // Orden cronológico ascendente: la más antigua primero.
    expect(history.weeks[0]!.date.getTime()).toBeLessThan(history.weeks[24]!.date.getTime());
    expect(getContributedWeeks(history)).toHaveLength(20);
    // Los huecos se conservan en el historial, no se eliminan.
    expect(history.weeks.filter((w) => !w.contributed)).toHaveLength(5);
  });

  test('devuelve un historial vacío cuando no hay periodos', () => {
    expect(buildContributionHistory([], REFERENCIA).weeks).toEqual([]);
  });
});

describe('calculateAverageSalary', () => {
  test('promedia solo las semanas cotizadas, ignorando los huecos', () => {
    const weeks = [
      { date: new Date(2025, 0, 1), contributed: true, salaryBaseContribution: 100 },
      { date: new Date(2025, 0, 8), contributed: false },
      { date: new Date(2025, 0, 15), contributed: true, salaryBaseContribution: 300 },
    ];
    // (100 + 300) / 2 = 200 — la semana sin cotización no diluye el promedio.
    expect(calculateAverageSalary(weeks)).toBe(200);
  });

  test('devuelve 0 si no hay ninguna semana cotizada', () => {
    expect(calculateAverageSalary([{ date: new Date(2025, 0, 1), contributed: false }])).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Casos de prueba del criterio legal
// ─────────────────────────────────────────────

describe('últimas 250 semanas cotizadas (Art. 167 LSS 1973)', () => {
  test('Caso 1: con 300 semanas consecutivas cotizadas, toma solo las últimas 250', () => {
    const history = buildContributionHistory([periodoPorSemanas(0, 300, 500)], REFERENCIA);
    const summary = calculateContributionSummary(history)!;

    expect(summary.contributedWeeks).toBe(300);
    expect(summary.selectedWeeks).toBe(250);
    expect(summary.skippedWeeks).toBe(0);
    expect(summary.isComplete).toBe(true);
    expect(summary.averageSalary).toBe(500);
  });

  test('Caso 2: salta el hueco y sigue hacia atrás hasta reunir las 250 cotizadas', () => {
    // Contando hacia atrás: 100 semanas cotizadas ($900), 52 sin cotizar,
    // y antes 300 semanas cotizadas ($100).
    const history = buildContributionHistory(
      [periodoPorSemanas(0, 100, 900), periodoPorSemanas(152, 452, 100)],
      REFERENCIA,
    );
    const summary = calculateContributionSummary(history)!;

    expect(summary.skippedWeeks).toBe(52);
    expect(summary.contributedWeeks).toBe(400);
    expect(summary.selectedWeeks).toBe(250);
    expect(summary.isComplete).toBe(true);

    // Las 250 seleccionadas son 100 semanas a $900 + 150 semanas a $100
    // (las 52 sin cotizar NO entran, y el recorrido continuó más atrás).
    // (100 × 900 + 150 × 100) / 250 = 420
    expect(summary.averageSalary).toBe(420);
  });

  test('Caso 2 (contraste): tomar 250 semanas calendario daría un promedio distinto', () => {
    // Mismo historial que el caso anterior. Con el criterio incorrecto de
    // "250 semanas calendario" solo se alcanzarían 100 semanas a $900 y 98
    // a $100 (las 52 de hueco se habrían "gastado" dentro de la ventana),
    // dando un promedio más alto que el correcto de $420.
    const history = buildContributionHistory(
      [periodoPorSemanas(0, 100, 900), periodoPorSemanas(152, 452, 100)],
      REFERENCIA,
    );
    const ultimas250Calendario = history.weeks.slice(-250);
    const promedioCalendario = calculateAverageSalary(ultimas250Calendario);
    const promedioCotizadas = calculateContributionSummary(history)!.averageSalary;

    expect(promedioCalendario).toBeGreaterThan(promedioCotizadas);
  });

  test('Caso 3: con múltiples periodos laborales devuelve exactamente 250 semanas cotizadas', () => {
    // Cuatro periodos separados por huecos de distinta duración.
    const history = buildContributionHistory(
      [
        periodoPorSemanas(0, 60, 800),
        periodoPorSemanas(70, 150, 600),
        periodoPorSemanas(160, 260, 400),
        periodoPorSemanas(300, 420, 200),
      ],
      REFERENCIA,
    );
    const selected = getLastContributionWeeks(history);

    expect(selected).toHaveLength(250);
    // Todas las seleccionadas tienen cotización válida.
    expect(selected.every((w) => w.contributed && (w.salaryBaseContribution ?? 0) > 0)).toBe(true);
    // Y están en orden cronológico ascendente.
    const fechas = selected.map((w) => w.date.getTime());
    expect([...fechas].sort((a, b) => a - b)).toEqual(fechas);
  });

  test('marca isComplete=false cuando el historial no reúne 250 semanas cotizadas', () => {
    const history = buildContributionHistory([periodoPorSemanas(0, 120, 300)], REFERENCIA);
    const summary = calculateContributionSummary(history)!;

    expect(summary.contributedWeeks).toBe(120);
    expect(summary.selectedWeeks).toBe(120);
    expect(summary.isComplete).toBe(false);
    expect(summary.averageSalary).toBe(300);
  });

  test('el desglose reporta la primera y última semana usadas', () => {
    const history = buildContributionHistory([periodoPorSemanas(0, 300, 500)], REFERENCIA);
    const summary = calculateContributionSummary(history)!;

    expect(summary.firstWeekUsed.getTime()).toBeLessThan(summary.lastWeekUsed.getTime());
    expect(summary.totalWeeksInHistory).toBe(300);
  });

  test('devuelve null cuando el historial no tiene ninguna semana cotizada', () => {
    expect(calculateContributionSummary({ weeks: [] })).toBeNull();
    expect(summarizeLastContributedWeeks([], REFERENCIA)).toBeNull();
  });
});

describe('patrones simultáneos', () => {
  test('suma los SBC de los patrones traslapados sin duplicar las semanas', () => {
    // Patrón A cubre 250 semanas a $100; patrón B se traslapa las últimas
    // 50 semanas con $500 → esas semanas valen $600, y siguen siendo 250.
    const summary = summarizeLastContributedWeeks(
      [periodoPorSemanas(0, 250, 100), periodoPorSemanas(0, 50, 500)],
      REFERENCIA,
    )!;

    expect(summary.selectedWeeks).toBe(250);
    expect(summary.contributedWeeks).toBe(250);
    // (200 × 100 + 50 × 600) / 250 = 200
    expect(summary.averageSalary).toBe(200);
  });
});

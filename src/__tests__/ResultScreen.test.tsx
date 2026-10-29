/**
 * Prueba de humo de ResultScreen: sin simulación coincidente muestra el
 * estado vacío; con una simulación guardada muestra el resultado.
 *
 * Para ejecutar: npm test
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories run before imports are available
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();
let mockRouteParams: { simulationId?: string } = {};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack, popToTop: mockPopToTop }),
  useRoute: () => ({ params: mockRouteParams }),
}));

import React from 'react';
import { screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderScreen } from '../test-utils/renderScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { saveSimulation } from '../storage/simulationStorage';
import { calculatePension } from '../services/pension/PensionCalculator';
import { formatCurrency, formatDateLong } from '../utils/format';
import type { PensionInput } from '../models';

function buildResult(
  overrides: Partial<PensionInput['personalData']> = {},
  options: {
    totalWeeks?: number;
    dailySalary?: number;
    modalidad40?: PensionInput['modalidad40'];
  } = {},
) {
  const input: PensionInput = {
    personalData: {
      name: 'María López',
      sex: 'femenino',
      birthDate: new Date(1960, 0, 1),
      age: 65,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: 65,
      ...overrides,
    },
    workHistory: { totalWeeks: options.totalWeeks ?? 600, employmentRelations: [] },
    averageSalary: {
      dailySalary: options.dailySalary ?? 250,
      monthlySalary: (options.dailySalary ?? 250) * 30.4,
      isManual: true,
    },
    uma: { dailyUMA: 113.14, monthlyUMA: 3439.46, annualUMA: 41296.1, year: 2025, isCustom: false },
    modalidad40: options.modalidad40 ?? { active: false },
    beneficiaries: {
      hasSpouse: false,
      hasMinorChildren: false,
      numberOfMinorChildren: 0,
      hasDependentParents: false,
      numberOfDependentParents: 0,
    },
  };
  return calculatePension(input);
}

function buildResultAtReferenceDate(
  referenceDate: Date,
  overrides: Partial<PensionInput['personalData']> = {},
  options: { totalWeeks?: number; dailySalary?: number; modalidad40?: PensionInput['modalidad40'] } = {},
) {
  jest.useFakeTimers().setSystemTime(referenceDate);
  try {
    return buildResult(overrides, options);
  } finally {
    jest.useRealTimers();
  }
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockRouteParams = {};
  await AsyncStorage.clear();
});

describe('ResultScreen', () => {
  test('muestra el estado vacío cuando no hay ninguna simulación guardada', async () => {
    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('No hay resultado disponible.')).toBeTruthy());
  });

  test('muestra el resultado de la simulación indicada por simulationId', async () => {
    const saved = await saveSimulation(buildResult(), 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Pensión mensual estimada')).toBeTruthy();
  });

  test('muestra por separado el SBC actual y el SBC proyectado al retiro', async () => {
    const result = buildResult();
    result.input.projectedAverageDailySalary = 300;
    const saved = await saveSimulation(result, 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('SBC actual (diario)')).toBeTruthy();
    expect(screen.getByText('SBC proyectado al retiro (diario)')).toBeTruthy();
    expect(screen.getByText(formatCurrency(250))).toBeTruthy();
    expect(screen.getByText(formatCurrency(300))).toBeTruthy();
  });

  test('el resumen separa las semanas cotizadas actuales de las objetivo al jubilarse', async () => {
    const saved = await saveSimulation(
      buildResultAtReferenceDate(new Date(2025, 5, 1), {
        age: 45,
        estimatedRetirementDate: new Date(2045, 5, 1),
      }),
      'María López',
    );
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('600 sem.')).toBeTruthy();

    expect(screen.getByText('Semanas estimadas al pensionarte')).toBeTruthy();
    expect(screen.queryByText('Semanas cotizadas registradas')).toBeNull();
    // La proyección usa los días calendario entre ambas fechas exactas.
    expect(screen.getByText('Fecha de retiro')).toBeTruthy();
    expect(screen.getByText(formatDateLong(new Date(2045, 5, 1)))).toBeTruthy();
    expect(
      screen.getByText('1,644 sem. (600 cotizadas + 1,044 proyectadas hasta la fecha de retiro)'),
    ).toBeTruthy();
  });

  test('todas las cifras de semanas del resumen usan el separador de miles', async () => {
    const saved = await saveSimulation(
      buildResultAtReferenceDate(new Date(2025, 5, 1), {
        age: 45,
        estimatedRetirementDate: new Date(2045, 5, 1),
      }),
      'María López',
    );
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    // El objetivo se muestra con separador de miles en todas sus cifras.
    expect(
      screen.getByText('1,644 sem. (600 cotizadas + 1,044 proyectadas hasta la fecha de retiro)'),
    ).toBeTruthy();
    expect(
      screen.queryByText('1644 sem. (600 cotizadas + 1044 proyectadas hasta la fecha de retiro)'),
    ).toBeNull();
  });

  test('el total de semanas M40 del resumen se calcula por fechas, no por meses aproximados', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let resultado: ReturnType<typeof buildResult>;
    try {
      resultado = buildResult(
        { age: 30, retirementAge: 65, estimatedRetirementDate: new Date(2025, 6, 1) },
        {
          totalWeeks: 600,
          modalidad40: { active: true, contributionSalary: 300, expectedMonths: 2 },
        },
      );
    } finally {
      jest.useRealTimers();
    }
    const saved = await saveSimulation(resultado!, 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);
    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas + semanas M40 planeadas')).toBeTruthy();
    expect(screen.queryByText('Semanas cotizadas + semanas M40 planeadas (aprox. por meses)')).toBeNull();
    expect(screen.getByText('604 sem.')).toBeTruthy();
    expect(screen.getByText('604 sem. (600 cotizadas + 4 proyectadas hasta la fecha de retiro)')).toBeTruthy();
  });

  test('resumen y AverageSalaryStep usan las mismas 31 semanas M40 y el promedio de $212.40', async () => {
    const resultado = buildResultAtReferenceDate(
      new Date(2025, 5, 1),
      {
        age: 30,
        retirementAge: 65,
        estimatedRetirementDate: new Date(2026, 0, 31),
      },
      {
        totalWeeks: 500,
        dailySalary: 200,
        modalidad40: { active: true, contributionSalary: 300, expectedMonths: 7 },
      },
    );
    const averageStep = resultado.steps.find((step) => step.id === 'salario_promedio');

    expect(resultado.weeksProjection).not.toHaveProperty('m40PlannedWeeks');
    expect(averageStep?.description).toContain(
      '219 sem. ordinarias ($200.00/día) + 31 sem. M40 ($300.00/día) = $212.40/día',
    );

    const saved = await saveSimulation(resultado, 'María López');
    mockRouteParams = { simulationId: saved.id };
    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Semanas M40 (de las 250)')).toBeTruthy();
    expect(screen.getAllByText('31 sem.')).toHaveLength(2);
    expect(screen.getByText('Semanas previas al M40')).toBeTruthy();
    expect(screen.getByText('219 sem.')).toBeTruthy();
    expect(screen.getByText('Semanas M40 planeadas')).toBeTruthy();
    expect(screen.getByText('Salario promedio ponderado')).toBeTruthy();
    expect(screen.getByText(`${formatCurrency(212.4)}/día`)).toBeTruthy();
    expect(screen.queryByText(/aprox\. por meses/)).toBeNull();
  });

  test('el resultado histórico sin weeksProjection conserva el fallback de meses M40', async () => {
    jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1));
    let resultado: ReturnType<typeof buildResult>;
    try {
      resultado = buildResult(
        { age: 30, retirementAge: 65, estimatedRetirementDate: new Date(2025, 6, 1) },
        {
          totalWeeks: 600,
          modalidad40: { active: true, contributionSalary: 300, expectedMonths: 2 },
        },
      );
    } finally {
      jest.useRealTimers();
    }
    delete resultado!.weeksProjection;
    const saved = await saveSimulation(resultado!, 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);
    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('609 sem.')).toBeTruthy();
    expect(screen.getByText('Semanas cotizadas registradas')).toBeTruthy();
    expect(screen.queryByText('Semanas estimadas al pensionarte')).toBeNull();
    expect(
      screen.getByText('Semanas cotizadas + semanas M40 planeadas (aprox. por meses)'),
    ).toBeTruthy();
    expect(screen.getByText('Semanas M40 (de las 250) (aprox. por meses)')).toBeTruthy();
    expect(screen.getByText('Semanas previas al M40 (aprox. por meses)')).toBeTruthy();
    expect(screen.getByText('Semanas M40 planeadas (aprox. por meses)')).toBeTruthy();
    expect(screen.getByText('Salario promedio ponderado (aprox. por meses)')).toBeTruthy();
    expect(screen.getAllByText('9 sem.')).toHaveLength(2);
  });

  test('la fila de Modalidad 40 muestra semanas exactas distintas al objetivo normal', async () => {
    const saved = await saveSimulation(
      buildResultAtReferenceDate(
        new Date(2025, 5, 1),
        {
          age: 30,
          retirementAge: 100,
          estimatedRetirementDate: new Date(2075, 5, 15),
        },
        {
          totalWeeks: 500,
          modalidad40: { active: true, contributionSalary: 300, expectedMonths: 600 },
        },
      ),
      'María López',
    );
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    // El objetivo normal es 500 cotizadas + 2611 proyectadas = 3111.
    expect(
      screen.getByText('3,111 sem. (500 cotizadas + 2,611 proyectadas hasta la fecha de retiro)'),
    ).toBeTruthy();
    // El bloque Modalidad 40 ya no se titula como el total de semanas cotizadas…
    expect(screen.queryByText('Total de semanas cotizadas')).toBeNull();
    expect(screen.getByText('Semanas cotizadas + semanas M40 planeadas')).toBeTruthy();
    // …y su valor (500 cotizadas + 2609 semanas M40) se distingue del objetivo.
    expect(screen.getByText('3,109 sem.')).toBeTruthy();
    expect(screen.queryByText('3109 sem.')).toBeNull();
  });

  test('sin horizonte a futuro, las semanas objetivo coinciden con las actuales', async () => {
    // Edad actual = edad de retiro: no hay proyección, solo lo cotizado.
    const saved = await saveSimulation(buildResult({ age: 65 }), 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('Semanas estimadas al pensionarte')).toBeTruthy();
    // Ambas filas muestran las mismas semanas (ya cotizadas, nada proyectado).
    expect(screen.getAllByText('600 sem.').length).toBe(2);
  });

  test('una simulación guardada sin proyección cae a las semanas cotizadas capturadas', async () => {
    // Simulación de una versión anterior de la app: no trae `weeksProjection`.
    const resultado = buildResult({ age: 45 });
    delete resultado.weeksProjection;
    const saved = await saveSimulation(resultado, 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('Semanas cotizadas registradas')).toBeTruthy();
    expect(screen.queryByText('Semanas estimadas al pensionarte')).toBeNull();
    // Sin proyección, ambas filas muestran las semanas cotizadas capturadas.
    expect(screen.getAllByText('600 sem.').length).toBe(2);
  });

  test('el historial muestra el objetivo de semanas con el mismo desglose que el resumen', async () => {
    await saveSimulation(
      buildResultAtReferenceDate(new Date(2025, 5, 1), {
        age: 45,
        estimatedRetirementDate: new Date(2045, 5, 1),
      }),
      'María López',
    );

    renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Semanas estimadas al pensionarte')).toBeTruthy();
    expect(screen.queryByText('Semanas cotizadas registradas')).toBeNull();
    expect(
      screen.getByText('1,644 sem. (600 cotizadas + 1,044 proyectadas hasta la fecha de retiro)'),
    ).toBeTruthy();
  });

  test('el historial de una simulación sin proyección muestra solo las semanas actuales', async () => {
    const resultado = buildResult({ age: 45 });
    delete resultado.weeksProjection;
    await saveSimulation(resultado, 'María López');

    renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Semanas cotizadas registradas')).toBeTruthy();
    expect(screen.queryByText('Semanas estimadas al pensionarte')).toBeNull();
    expect(screen.getByText('600 sem.')).toBeTruthy();
  });
});

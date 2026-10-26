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
import type { PensionInput } from '../models';

function buildResult(
  overrides: Partial<PensionInput['personalData']> = {},
  options: { totalWeeks?: number; modalidad40?: PensionInput['modalidad40'] } = {},
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
    averageSalary: { dailySalary: 250, monthlySalary: 7600, isManual: true },
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

  test('el resumen separa las semanas cotizadas actuales de las objetivo al jubilarse', async () => {
    // 600 semanas cotizadas, edad actual 45 → 20 años hasta el retiro (65).
    const saved = await saveSimulation(buildResult({ age: 45 }), 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('600 sem.')).toBeTruthy();

    expect(screen.getByText('Semanas cotizadas objetivo (al jubilarte)')).toBeTruthy();
    // 600 actuales + 20 años × 52 semanas = 1040 proyectadas → 1640 objetivo.
    expect(
      screen.getByText('1,640 sem. (600 cotizadas + 1,040 proyectadas hasta los 65 años)'),
    ).toBeTruthy();
  });

  test('todas las cifras de semanas del resumen usan el separador de miles', async () => {
    const saved = await saveSimulation(buildResult({ age: 45 }), 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    // El objetivo se muestra con separador de miles en todas sus cifras.
    expect(
      screen.getByText('1,640 sem. (600 cotizadas + 1,040 proyectadas hasta los 65 años)'),
    ).toBeTruthy();
    expect(
      screen.queryByText('1640 sem. (600 cotizadas + 1040 proyectadas hasta los 65 años)'),
    ).toBeNull();
  });

  test('la fila de Modalidad 40 no se presenta como el total de semanas del cálculo', async () => {
    // Edad 30 y retiro a los 100: el objetivo proyecta 70 años × 52 semanas.
    const saved = await saveSimulation(
      buildResult(
        { age: 30, retirementAge: 100 },
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

    // El objetivo del cálculo: 500 cotizadas + 3640 proyectadas = 4140.
    expect(
      screen.getByText('4,140 sem. (500 cotizadas + 3,640 proyectadas hasta los 100 años)'),
    ).toBeTruthy();
    // El bloque Modalidad 40 ya no se titula como el total de semanas cotizadas…
    expect(screen.queryByText('Total de semanas cotizadas')).toBeNull();
    expect(screen.getByText('Semanas cotizadas + semanas M40 planeadas')).toBeTruthy();
    // …y su valor (500 cotizadas + 2600 planeadas = 3100) se distingue del objetivo.
    expect(screen.getByText('3,100 sem.')).toBeTruthy();
    expect(screen.queryByText('3100 sem.')).toBeNull();
  });

  test('sin horizonte a futuro, las semanas objetivo coinciden con las actuales', async () => {
    // Edad actual = edad de retiro: no hay proyección, solo lo cotizado.
    const saved = await saveSimulation(buildResult({ age: 65 }), 'María López');
    mockRouteParams = { simulationId: saved.id };

    renderScreen(<ResultScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());

    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('Semanas cotizadas objetivo (al jubilarte)')).toBeTruthy();
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
    expect(screen.getByText('Semanas cotizadas objetivo (al jubilarte)')).toBeTruthy();
    // Sin proyección, ambas filas muestran las semanas cotizadas capturadas.
    expect(screen.getAllByText('600 sem.').length).toBe(2);
  });

  test('el historial muestra el objetivo de semanas con el mismo desglose que el resumen', async () => {
    await saveSimulation(buildResult({ age: 45 }), 'María López');

    renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Semanas cotizadas objetivo (al jubilarte)')).toBeTruthy();
    expect(
      screen.getByText('1,640 sem. (600 cotizadas + 1,040 proyectadas hasta los 65 años)'),
    ).toBeTruthy();
  });

  test('el historial de una simulación sin proyección muestra solo las semanas actuales', async () => {
    const resultado = buildResult({ age: 45 });
    delete resultado.weeksProjection;
    await saveSimulation(resultado, 'María López');

    renderScreen(<HistoryScreen />);

    await waitFor(() => expect(screen.getByText('María López')).toBeTruthy());
    expect(screen.getByText('Semanas cotizadas actuales')).toBeTruthy();
    expect(screen.getByText('600 sem.')).toBeTruthy();
  });
});

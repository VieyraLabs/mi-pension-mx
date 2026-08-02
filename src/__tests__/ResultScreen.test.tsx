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
import { saveSimulation } from '../storage/simulationStorage';
import { calculatePension } from '../services/pension/PensionCalculator';
import type { PensionInput } from '../models';

function buildResult() {
  const input: PensionInput = {
    personalData: {
      name: 'María López',
      sex: 'femenino',
      birthDate: new Date(1960, 0, 1),
      age: 65,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: 65,
    },
    workHistory: { totalWeeks: 600, employmentRelations: [] },
    averageSalary: { dailySalary: 250, monthlySalary: 7600, isManual: true },
    uma: { dailyUMA: 113.14, monthlyUMA: 3439.46, annualUMA: 41296.1, year: 2025, isCustom: false },
    modalidad40: { active: false },
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
});

/**
 * Prueba de humo de NewSimulationScreen: renderiza el primer paso del
 * stepper sin crashear y permite avanzar de paso.
 *
 * Para ejecutar: npm test
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories run before imports are available
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: undefined }),
}));

import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderScreen } from '../test-utils/renderScreen';
import NewSimulationScreen from '../screens/NewSimulationScreen';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NewSimulationScreen', () => {
  test('renderiza el paso de datos personales sin crashear', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Paso 1 de 6: Datos personales')).toBeTruthy();
    expect(screen.getByText('Información personal')).toBeTruthy();
  });

  test('el botón "Siguiente" avanza al paso de historial laboral', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 2 de 6: Historial laboral')).toBeTruthy();
    expect(screen.getByText('Historial laboral')).toBeTruthy();
  });

  test('el botón "Anterior" está deshabilitado en el primer paso', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Anterior')).toBeDisabled();
  });
});

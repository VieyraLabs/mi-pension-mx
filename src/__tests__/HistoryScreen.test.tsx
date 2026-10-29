/**
 * Regresión: el encabezado del historial debe mostrar el límite real del
 * almacenamiento (999) y no un número hardcodeado desactualizado (el antiguo
 * límite de 20). La UI consume MAX_SIMULATIONS de simulationStorage como
 * única fuente de verdad.
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
}));

import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '../test-utils/renderScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { MAX_SIMULATIONS } from '../storage/simulationStorage';

describe('HistoryScreen', () => {
  test('el encabezado muestra el límite real del almacenamiento en vez del antiguo 20', async () => {
    renderScreen(<HistoryScreen />);

    expect(
      await screen.findByText(`Historial de simulaciones (0/${MAX_SIMULATIONS})`),
    ).toBeTruthy();
    expect(MAX_SIMULATIONS).toBe(999);
  });
});

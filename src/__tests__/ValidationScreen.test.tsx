/**
 * Prueba de humo de ValidationScreen: renderiza sin crashear y muestra
 * los datos extraídos del texto de un PDF de prueba.
 *
 * Para ejecutar: npm test
 */
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      extractedText:
        'CURP: PEPJ600101HDFRRN01 NSS 12345678901 Semanas cotizadas: 520 $ 300.00',
    },
  }),
}));

import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '../test-utils/renderScreen';
import ValidationScreen from '../screens/ValidationScreen';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ValidationScreen', () => {
  test('renderiza sin crashear y precarga los campos detectados', () => {
    renderScreen(<ValidationScreen />);

    expect(screen.getByText('Datos personales extraídos')).toBeTruthy();
    expect(screen.getByDisplayValue('520')).toBeTruthy();
    expect(screen.getByDisplayValue('PEPJ600101HDFRRN01')).toBeTruthy();
  });

  test('muestra los campos no encontrados como faltantes', () => {
    renderScreen(<ValidationScreen />);

    expect(screen.getByText(/Campos no encontrados en el PDF/i)).toBeTruthy();
  });
});

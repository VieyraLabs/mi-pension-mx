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
import { calculateAge } from '../utils/date';
import { estimateMonthsToRetirement } from '../utils/weeksProjection';

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

  test('los meses de Modalidad 40 son de solo lectura y muestran el valor derivado', () => {
    renderScreen(<NewSimulationScreen />);

    // Ir al paso de Modalidad 40 (paso 5 de 6).
    for (let i = 0; i < 4; i++) {
      fireEvent.press(screen.getByText('Siguiente'));
    }
    expect(screen.getByText('Paso 5 de 6: Modalidad 40')).toBeTruthy();

    // Activar Modalidad 40.
    fireEvent.press(screen.getByText('¿Deseas cotizar en Modalidad 40? Toca aquí'));

    // El valor viene del horizonte: los meses entre hoy y la fecha de retiro.
    const age = calculateAge(new Date(1965, 0, 1));
    const retirementAge = 65;
    const mesesEsperados = estimateMonthsToRetirement(age, retirementAge);

    const inputMeses = screen.getByDisplayValue(String(mesesEsperados));
    expect(inputMeses.props.editable).toBe(false);
    expect(inputMeses).toBeDisabled();

    // El helper explica de dónde sale el valor.
    expect(
      screen.getByText(
        `Se calcula automáticamente: los meses entre hoy y tu fecha de retiro (edad ${age}, retiro a los ${retirementAge} años).`,
      ),
    ).toBeTruthy();
  });
});

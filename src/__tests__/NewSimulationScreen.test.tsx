/**
 * Prueba de humo de NewSimulationScreen: renderiza el primer paso del
 * stepper sin crashear y permite avanzar de paso.
 *
 * También fija la estructura de los pasos: el historial laboral y el SBC
 * viven en el mismo paso 2, y la edad de retiro en el paso 3.
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
import { calculateAge, calculateRetirementDate } from '../utils/date';
import { formatDateLong } from '../utils/format';
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

  test('el paso 1 ya NO pide la edad de retiro', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Paso 1 de 6: Datos personales')).toBeTruthy();
    expect(screen.queryAllByText(/Edad de retiro/)).toHaveLength(0);
    expect(screen.queryAllByDisplayValue('65')).toHaveLength(0);
  });

  test('el paso 2 reúne el historial laboral y el SBC', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 2 de 6: Historial laboral')).toBeTruthy();
    // Semanas cotizadas (tarjeta de historial laboral).
    expect(screen.getAllByText(/Total de semanas cotizadas/).length).toBeGreaterThan(0);
    // SBC (tarjeta de salario, en la MISMA pantalla).
    expect(screen.getAllByText(/Salario diario promedio/).length).toBeGreaterThan(0);
  });

  test('el paso 3 pide la edad de retiro y muestra la fecha estimada', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 3 de 6: Edad de retiro')).toBeTruthy();
    expect(screen.getAllByText(/Edad de retiro \(60–100 años\)/).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('65')).toBeTruthy();
    // La fecha estimada la calcula el formulario: la UI solo la muestra.
    const fechaEsperada = formatDateLong(calculateRetirementDate(new Date(1965, 0, 1), 65));
    expect(
      screen.getAllByText(new RegExp(`Fecha estimada de retiro: ${fechaEsperada}`)).length,
    ).toBeGreaterThan(0);
  });

  test('cambiar la edad de retiro en el paso 3 actualiza la fecha estimada', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    fireEvent.changeText(screen.getByDisplayValue('65'), '60');

    // La fecha estimada la recalcula el formulario con la nueva edad.
    const fechaEsperada = formatDateLong(calculateRetirementDate(new Date(1965, 0, 1), 60));
    expect(
      screen.getAllByText(new RegExp(`Fecha estimada de retiro: ${fechaEsperada}`)).length,
    ).toBeGreaterThan(0);
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

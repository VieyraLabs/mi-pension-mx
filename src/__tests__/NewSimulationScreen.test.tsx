/**
 * Prueba de humo de NewSimulationScreen: renderiza el primer paso del
 * stepper sin crashear y permite avanzar de paso.
 *
 * También fija la estructura de los pasos (4 en total): el historial laboral y
 * el SBC viven en el paso 2, la edad de retiro y los beneficiarios en el paso
 * 3, y la UMA y la Modalidad 40 en el paso 4.
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
import { StyleSheet } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';
import { lightTheme } from '../theme';
import { renderScreen } from '../test-utils/renderScreen';
import NewSimulationScreen from '../screens/NewSimulationScreen';
import { calculateAge } from '../utils/date';
import { estimateMonthsToRetirement } from '../utils/weeksProjection';
import {
  cumpleanosEnEdad,
  edadMostrada,
  formateaEdad,
} from '../components/RetirementAgeStep';

/** Fecha de nacimiento de referencia: 15 de enero de 1960. */
const NACIMIENTO = new Date(1960, 0, 15);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NewSimulationScreen', () => {
  test('renderiza el paso de datos personales sin crashear', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Paso 1 de 4: Datos personales')).toBeTruthy();
    expect(screen.getByText('Información personal')).toBeTruthy();
  });

  test('el botón "Siguiente" avanza al paso de historial laboral', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 2 de 4: Historial laboral')).toBeTruthy();
    expect(screen.getByText('Historial laboral')).toBeTruthy();
  });

  test('el botón "Anterior" está deshabilitado en el primer paso', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Anterior')).toBeDisabled();
  });

  test('el paso 1 ya NO pide la edad de retiro', () => {
    renderScreen(<NewSimulationScreen />);

    expect(screen.getByText('Paso 1 de 4: Datos personales')).toBeTruthy();
    expect(screen.queryAllByText(/Edad de retiro/)).toHaveLength(0);
  });

  test('el paso 2 reúne el historial laboral y el SBC', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 2 de 4: Historial laboral')).toBeTruthy();
    // Semanas cotizadas (tarjeta de historial laboral).
    expect(screen.getAllByText(/Total de semanas cotizadas/).length).toBeGreaterThan(0);
    // SBC (tarjeta de salario, en la MISMA pantalla).
    expect(screen.getAllByText(/Salario diario promedio/).length).toBeGreaterThan(0);
  });

  test('el paso 2 NO narra la proyección de semanas (la edad de retiro aún no está decidida)', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 2 de 4: Historial laboral')).toBeTruthy();
    expect(screen.queryByText(/Al jubilarte tendrás/)).toBeNull();
    expect(screen.queryByText(/se proyectan/)).toBeNull();
    expect(screen.queryByText(/La proyección asume/)).toBeNull();
  });

  test('el paso 3 reúne la edad de retiro y los beneficiarios', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.getByText('Paso 3 de 4: Edad de retiro')).toBeTruthy();
    // Edad de retiro (tarjeta).
    expect(screen.getAllByText(/Edad de retiro/).length).toBeGreaterThan(0);
    // Beneficiarios (misma pantalla).
    expect(screen.getAllByText('Beneficiarios').length).toBeGreaterThan(0);
  });

  test('el paso 4 reúne la UMA y la Modalidad 40', () => {
    renderScreen(<NewSimulationScreen />);

    for (let i = 0; i < 3; i++) {
      fireEvent.press(screen.getByText('Siguiente'));
    }

    expect(screen.getByText('Paso 4 de 4: UMA')).toBeTruthy();
    // UMA (tarjeta).
    expect(screen.getAllByText(/Unidad de Medida y Actualización/).length).toBeGreaterThan(0);
    // Modalidad 40 (misma pantalla).
    expect(screen.getAllByText(/Modalidad 40 \(opcional\)/).length).toBeGreaterThan(0);
  });

  test('el paso 3 precarga la fecha del cumpleaños a los 65 y muestra la edad en solo lectura', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    // La fecha precargada es el cumpleaños a los 65 años (1 de enero de 2030).
    expect(screen.getByDisplayValue('1 de enero de 2030')).toBeTruthy();
    // La edad calculada se presenta como texto informativo, no como input.
    expect(screen.getByText('65 años')).toBeTruthy();
    expect(screen.queryByDisplayValue('65')).toBeNull();
  });

  test('elegir una fecha en el calendario actualiza la edad mostrada', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    fireEvent.press(screen.getByLabelText('Abrir calendario'));
    // 1 de julio de 2029 → 64 años y 6 meses → 64.5 (medio año de precisión).
    fireEvent.press(screen.getByLabelText('Año 2029'));
    fireEvent.press(screen.getByLabelText('Mes julio'));
    fireEvent.press(screen.getByLabelText('Día 1'));
    fireEvent.press(screen.getByText('Aceptar'));

    expect(screen.getByDisplayValue('1 de julio de 2029')).toBeTruthy();
    expect(screen.getByText('64.5 años')).toBeTruthy();
    expect(screen.queryByDisplayValue('64.5')).toBeNull();
  });

  test('para el 1 de julio de 2025 muestra 60.5 años y aclara la edad para el factor de Cesantía', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    fireEvent.press(screen.getByLabelText('Abrir calendario'));
    fireEvent.press(screen.getByLabelText('Año 2025'));
    fireEvent.press(screen.getByLabelText('Mes julio'));
    fireEvent.press(screen.getByLabelText('Día 1'));
    fireEvent.press(screen.getByText('Aceptar'));

    expect(screen.getByDisplayValue('1 de julio de 2025')).toBeTruthy();
    expect(screen.getByText('60.5 años')).toBeTruthy();
    expect(
      screen.getByText(
        'Para el factor de Cesantía, se considera como 61 años (Art. 171 LSS 1973).',
      ),
    ).toBeTruthy();
  });

  test('para el 1 de julio de 2030 muestra 65 años sin fracción ni nota de edad legal', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    fireEvent.press(screen.getByLabelText('Abrir calendario'));
    fireEvent.press(screen.getByLabelText('Año 2030'));
    fireEvent.press(screen.getByLabelText('Mes julio'));
    fireEvent.press(screen.getByLabelText('Día 1'));
    fireEvent.press(screen.getByText('Aceptar'));

    expect(screen.getByDisplayValue('1 de julio de 2030')).toBeTruthy();
    expect(screen.getByText('65 años')).toBeTruthy();
    expect(screen.queryByText(/65\.5 años|se considera como/)).toBeNull();
  });

  test('tocar el campo de fecha abre el calendario', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    expect(screen.queryByText('Selecciona la fecha')).toBeNull();
    fireEvent.press(screen.getByDisplayValue('1 de enero de 2030'));
    expect(screen.getByText('Selecciona la fecha')).toBeTruthy();
  });

  test('el motor recibe la EDAD DE PRESENTACIÓN (con medios años): la consume para la edad legal', () => {
    renderScreen(<NewSimulationScreen />);

    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('Siguiente'));

    // 1 de julio de 2029 con nacimiento 1 de enero de 1965 → 64.5 en pantalla.
    fireEvent.press(screen.getByLabelText('Abrir calendario'));
    fireEvent.press(screen.getByLabelText('Año 2029'));
    fireEvent.press(screen.getByLabelText('Mes julio'));
    fireEvent.press(screen.getByLabelText('Día 1'));
    fireEvent.press(screen.getByText('Aceptar'));

    const displayedAge = screen.getByText('64.5 años');
    expect(displayedAge).toBeTruthy();
    expect(StyleSheet.flatten(displayedAge.props.style)).toMatchObject({
      fontSize: lightTheme.fonts.titleMedium.fontSize,
      lineHeight: lightTheme.fonts.titleMedium.lineHeight,
    });

    // El motor aplica el Art. 171 LSS 1973: 64.5 → edad legal 65 (vejez).
    expect(
      screen.getByText(
        'Para determinar el tipo y factor de pensión, se considera como 65 años (Vejez, Art. 171 LSS 1973).',
      ),
    ).toBeTruthy();

    // El horizonte de Modalidad 40 se deriva de la EDAD DE PRESENTACIÓN (64.5).
    fireEvent.press(screen.getByText('Siguiente'));
    fireEvent.press(screen.getByText('¿Deseas cotizar en Modalidad 40? Toca aquí'));

    const age = calculateAge(new Date(1965, 0, 1));
    const mesesConMediaEdad = estimateMonthsToRetirement(age, 64.5);
    expect(screen.getByDisplayValue(String(mesesConMediaEdad))).toBeTruthy();
    expect(
      screen.getByText(
        `Se calcula automáticamente: los meses entre hoy y tu fecha de retiro (edad ${age}, retiro a los 64.5 años).`,
      ),
    ).toBeTruthy();
  });

  test('los meses de Modalidad 40 son de solo lectura y muestran el valor derivado', () => {
    renderScreen(<NewSimulationScreen />);

    // Ir al paso 4 (UMA + Modalidad 40).
    for (let i = 0; i < 3; i++) {
      fireEvent.press(screen.getByText('Siguiente'));
    }
    expect(screen.getByText('Paso 4 de 4: UMA')).toBeTruthy();

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

describe('RetirementAgeStep — reglas de presentación de la edad', () => {
  test('el cumpleaños precargado es el del año en que cumpliría 65 años', () => {
    expect(cumpleanosEnEdad(NACIMIENTO, 65)).toEqual(new Date(2025, 0, 15));
  });

  test('el 29 de febrero se ajusta en los años que no son bisiestos', () => {
    // 1960 + 65 = 2025, que no es bisiesto: 28 de febrero.
    expect(cumpleanosEnEdad(new Date(1960, 1, 29), 65)).toEqual(new Date(2025, 1, 28));
  });

  test('60 años y 3 meses → 60', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2020, 3, 15))).toBe(60);
  });

  test('60 años y 6 meses → 60.5', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2020, 6, 15))).toBe(60.5);
  });

  test('60 años y 9 meses → 60.5 (el medio año más cercano, no 61)', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2020, 9, 15))).toBe(60.5);
  });

  test('64 años y 7 meses → 64.5', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2024, 7, 15))).toBe(64.5);
  });

  test('65 años y 6 meses → 65 (a partir de 65, solo enteros)', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2025, 6, 15))).toBe(65);
  });

  test('66 años y 2 meses → 66 (fuera del rango de medios años)', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2026, 2, 15))).toBe(66);
  });

  test('59 años y 11 meses → 59', () => {
    expect(edadMostrada(NACIMIENTO, new Date(2019, 11, 15))).toBe(59);
  });

  test('el formato muestra decimal solo si hay fracción', () => {
    expect(formateaEdad(60)).toBe('60');
    expect(formateaEdad(60.5)).toBe('60.5');
    expect(formateaEdad(65)).toBe('65');
  });
});

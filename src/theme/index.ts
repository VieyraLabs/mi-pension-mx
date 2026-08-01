/**
 * Tema de la aplicación basado en Material Design 3 (React Native Paper).
 * Soporta modo claro y oscuro.
 */
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

/** Paleta de colores primarios de la aplicación. */
const COLORS = {
  primaryBlue: '#1565C0',
  primaryBlueLight: '#1976D2',
  primaryBlueDark: '#0D47A1',
  accent: '#FF6F00',
  accentLight: '#FFB300',
  success: '#2E7D32',
  warning: '#F57F17',
  error: '#C62828',
  surface: '#FAFAFA',
  surfaceDark: '#121212',
} as const;

/** Tema claro (Material Design 3). */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primaryBlue,
    primaryContainer: '#BBDEFB',
    secondary: COLORS.accent,
    secondaryContainer: '#FFE0B2',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#F8F9FA',
    error: COLORS.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
    outline: '#79747E',
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#EEEEEE',
      level3: '#E0E0E0',
      level4: '#BDBDBD',
      level5: '#9E9E9E',
    },
  },
};

/** Tema oscuro (Material Design 3). */
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#FFB300',
    secondaryContainer: '#FF6F00',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    background: '#121212',
    error: '#EF9A9A',
    onPrimary: '#003C8F',
    onSecondary: '#1A1A00',
    onSurface: '#E1E2E5',
    onBackground: '#E1E2E5',
    outline: '#938F99',
    elevation: {
      level0: 'transparent',
      level1: '#2D2D2D',
      level2: '#323232',
      level3: '#383838',
      level4: '#3E3E3E',
      level5: '#424242',
    },
  },
};

export { COLORS };

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

/**
 * Pares fondo/texto para banners de mensaje (MessageBanner).
 * Únicos en toda la app — evita que cada pantalla defina sus propios
 * hex literales para "aviso"/"error"/"éxito"/"info".
 */
export const BANNER_COLORS = {
  warning: { background: '#FFF8E1', text: '#795548', dark: { background: '#3E2D1A', text: '#FFCC80' } },
  success: { background: '#E8F5E9', text: '#2E7D32', dark: { background: '#1B3D1B', text: '#81C784' } },
  error: { background: '#FFEBEE', text: '#C62828', dark: { background: '#3E1B1B', text: '#EF9A9A' } },
  info: { background: '#E3F2FD', text: '#1565C0', dark: { background: '#1A2D3E', text: '#90CAF9' } },
} as const;

export function getBannerColors(variant: keyof typeof BANNER_COLORS, isDark: boolean) {
  const c = BANNER_COLORS[variant];
  return isDark ? c.dark : { background: c.background, text: c.text };
}

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

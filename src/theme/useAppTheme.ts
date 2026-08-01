/**
 * Hook para acceder al tema actual de la aplicación (claro/oscuro).
 * Detecta automáticamente la preferencia del sistema.
 */
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './index';

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return { theme, isDark };
}

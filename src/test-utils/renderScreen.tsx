/**
 * Utilidad compartida para pruebas de humo de pantallas.
 * Vive fuera de src/__tests__ para que Jest no la trate como un
 * archivo de pruebas (no contiene ningún `test`/`describe`).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { lightTheme } from '../theme';

export function renderScreen(ui: React.ReactElement) {
  return render(<PaperProvider theme={lightTheme}>{ui}</PaperProvider>);
}

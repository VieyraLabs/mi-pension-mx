/**
 * Wrapper multiplataforma de Alert.alert.
 *
 * react-native-web NO implementa Alert.alert (es un no-op: `static alert() {}`),
 * así que en web los diálogos nunca se mostraban y sus callbacks de onPress
 * (usados para confirmar/navegar) nunca se ejecutaban. En web se usa
 * window.alert/confirm y se invocan los callbacks manualmente.
 */
import { Alert, Platform } from 'react-native';

export interface BotonAlerta {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export function mostrarAlerta(titulo: string, mensaje?: string, botones?: BotonAlerta[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensaje, botones);
    return;
  }

  const texto = [titulo, mensaje].filter(Boolean).join('\n\n');

  if (!botones || botones.length <= 1) {
    window.alert(texto);
    botones?.[0]?.onPress?.();
    return;
  }

  const cancelar = botones.find((b) => b.style === 'cancel');
  const confirmar = botones.find((b) => b.style !== 'cancel') ?? botones[0];
  if (window.confirm(texto)) {
    confirmar?.onPress?.();
  } else {
    cancelar?.onPress?.();
  }
}

/**
 * Wrapper multiplataforma de Alert.alert.
 *
 * react-native-web NO implementa Alert.alert (es un no-op: `static alert() {}`),
 * así que en web los diálogos nunca se mostraban y sus callbacks de onPress
 * (usados para confirmar/navegar) nunca se ejecutaban. En web se usa
 * window.alert/confirm y se invocan los callbacks manualmente.
 */
import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const confirmButton = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}

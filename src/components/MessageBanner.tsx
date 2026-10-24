/**
 * Banner de mensaje reutilizable (aviso/éxito/error/info).
 * Reemplaza los bloques `<Card style={{backgroundColor: ...}}>` con hex
 * hardcodeado que cada pantalla repetía a mano, con emoji y colores
 * inconsistentes entre sí.
 *
 * Soporta modo oscuro: el color de fondo y de texto se adaptan al `theme.dark`.
 */
import React from 'react';
import { Card, Text, useTheme } from 'react-native-paper';
import { getBannerColors } from '../theme';

export type MessageBannerVariant = 'warning' | 'success' | 'error' | 'info';

const EMOJI_BY_VARIANT: Record<MessageBannerVariant, string> = {
  warning: '⚠️',
  success: '✓',
  error: '❌',
  info: 'ℹ️',
};

export interface MessageBannerProps {
  variant: MessageBannerVariant;
  children: React.ReactNode;
  /** Título opcional (Card.Title) antes del cuerpo del mensaje. */
  title?: string;
  style?: object;
}

export function MessageBanner({ variant, children, title, style }: MessageBannerProps) {
  const theme = useTheme();
  const colors = getBannerColors(variant, theme.dark);
  const emoji = EMOJI_BY_VARIANT[variant];

  return (
    <Card style={[{ backgroundColor: colors.background, borderRadius: 12, marginBottom: 16 }, style]} elevation={0}>
      {title && <Card.Title title={`${emoji} ${title}`} titleVariant="titleSmall" />}
      <Card.Content>
        <Text variant="bodySmall" style={{ color: colors.text, lineHeight: 18 }}>
          {!title && `${emoji} `}
          {children}
        </Text>
      </Card.Content>
    </Card>
  );
}

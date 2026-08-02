/**
 * Banner de mensaje reutilizable (aviso/éxito/error/info).
 * Reemplaza los bloques `<Card style={{backgroundColor: '#FFF8E1'}}>` que
 * cada pantalla repetía a mano, con emoji y colores inconsistentes entre sí.
 */
import React from 'react';
import { Card, Text } from 'react-native-paper';
import { BANNER_COLORS } from '../theme';

export type MessageBannerVariant = 'warning' | 'success' | 'error' | 'info';

const EMOJI_POR_VARIANTE: Record<MessageBannerVariant, string> = {
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
  const colores = BANNER_COLORS[variant];
  const emoji = EMOJI_POR_VARIANTE[variant];

  return (
    <Card style={[{ backgroundColor: colores.background, borderRadius: 12, marginBottom: 16 }, style]} elevation={0}>
      {title && <Card.Title title={`${emoji} ${title}`} titleVariant="titleSmall" />}
      <Card.Content>
        <Text variant="bodySmall" style={{ color: colores.text, lineHeight: 18 }}>
          {!title && `${emoji} `}
          {children}
        </Text>
      </Card.Content>
    </Card>
  );
}

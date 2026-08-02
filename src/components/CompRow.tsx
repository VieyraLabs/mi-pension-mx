/**
 * Fila etiqueta/valor para tarjetas de comparación (usada en SimulatorScreen).
 */
import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface CompRowProps {
  label: string;
  value: string;
  theme: MD3Theme;
}

export function CompRow({ label, value, theme }: CompRowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
}

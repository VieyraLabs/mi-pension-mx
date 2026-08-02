/**
 * Fila etiqueta/valor para tarjetas de resumen (usada en ResultScreen).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface SummaryRowProps {
  label: string;
  value: string;
  theme: MD3Theme;
}

export function SummaryRow({ label, value, theme }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
});

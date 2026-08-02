/**
 * Estado "vacío"/"sin datos" de pantalla completa, con acción opcional.
 * Antes solo ResultScreen tenía este patrón (sin resultado disponible);
 * se generaliza para cualquier pantalla que dependa de params de
 * navegación que puedan faltar o no encontrarse.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

export interface EmptyStateProps {
  mensaje: string;
  textoBoton?: string;
  onPressBoton?: () => void;
}

export function EmptyState({ mensaje, textoBoton, onPressBoton }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="bodyLarge" style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
        {mensaje}
      </Text>
      {textoBoton && onPressBoton && (
        <Button mode="contained" onPress={onPressBoton} style={{ marginTop: 16 }}>
          {textoBoton}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});

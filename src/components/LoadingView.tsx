/**
 * Estado de carga de pantalla completa. Reemplaza las implementaciones
 * repetidas de `ActivityIndicator` sueltos en distintas pantallas.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

export function LoadingView({ mensaje }: { mensaje?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {mensaje && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onBackground, marginTop: 16 }}>
          {mensaje}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

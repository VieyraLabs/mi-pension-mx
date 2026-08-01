/**
 * Pantalla de historial de simulaciones guardadas.
 */
import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useHistory } from '../hooks/useHistory';
import { formatCurrency, formatDateShort } from '../utils/format';

export default function HistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { simulaciones, cargando, eliminar, limpiar } = useHistory();

  const onEliminar = (id: string, nombre: string) => {
    Alert.alert(
      'Eliminar simulación',
      `¿Deseas eliminar "${nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(id) },
      ],
    );
  };

  const onLimpiar = () => {
    Alert.alert('Limpiar historial', '¿Deseas eliminar todas las simulaciones guardadas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: limpiar },
    ]);
  };

  if (cargando) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
          Historial de simulaciones ({simulaciones.length}/20)
        </Text>
        {simulaciones.length > 0 && (
          <Button onPress={onLimpiar} textColor={theme.colors.error} compact>
            Limpiar todo
          </Button>
        )}
      </View>

      {simulaciones.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            📊 No hay simulaciones guardadas.{'\n'}Crea tu primera simulación desde el Dashboard.
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 24 }}
            onPress={() => navigation.navigate('NewSimulation' as never)}
          >
            Nueva simulación
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {simulaciones.map((sim) => (
            <Card
              key={sim.id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              elevation={2}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {sim.nombre}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDateShort(new Date(sim.fechaCreacion))}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete-outline"
                    iconColor={theme.colors.error}
                    size={20}
                    onPress={() => onEliminar(sim.id, sim.nombre)}
                  />
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.cardData}>
                  <DataRow label="Pensión mensual" value={formatCurrency(sim.resultado.pensionMensual)} theme={theme} highlight />
                  <DataRow label="Semanas cotizadas" value={String(sim.resultado.input.historialLaboral.semanasTotales)} theme={theme} />
                  <DataRow label="Edad de retiro" value={`${sim.resultado.input.datosPersonales.edadRetiro} años`} theme={theme} />
                  <DataRow label="Tipo" value={sim.resultado.tipoPension === 'vejez' ? 'Vejez' : 'Cesantía'} theme={theme} />
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DataRow({ label, value, theme, highlight }: { label: string; value: string; theme: any; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: highlight ? theme.colors.primary : theme.colors.onSurface, fontWeight: highlight ? 'bold' : 'normal' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, elevation: 2 },
  list: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardData: { gap: 2 },
});

/**
 * Pantalla de historial de simulaciones guardadas.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, ActivityIndicator, Divider, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useHistory } from '../hooks/useHistory';
import { formatCurrency, formatDateShort } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { simulaciones, cargando, eliminar, limpiar } = useHistory();
  
  // Estado para los dialogs
  const [dialogEliminarVisible, setDialogEliminarVisible] = useState(false);
  const [simAEliminar, setSimAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [dialogLimpiarVisible, setDialogLimpiarVisible] = useState(false);

  const onEliminar = (id: string, nombre: string) => {
    setSimAEliminar({ id, nombre });
    setDialogEliminarVisible(true);
  };

  const confirmarEliminar = () => {
    if (simAEliminar) {
      eliminar(simAEliminar.id);
      setDialogEliminarVisible(false);
      setSimAEliminar(null);
    }
  };

  const onLimpiar = () => {
    setDialogLimpiarVisible(true);
  };

  const confirmarLimpiar = () => {
    limpiar();
    setDialogLimpiarVisible(false);
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
        <>
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
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <IconButton
                        icon="eye-outline"
                        iconColor={theme.colors.primary}
                        size={20}
                        onPress={() => navigation.navigate('Result', { simulacionId: sim.id })}
                      />
                      <IconButton
                        icon="delete-outline"
                        iconColor={theme.colors.error}
                        size={20}
                        onPress={() => onEliminar(sim.id, sim.nombre)}
                      />
                    </View>
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
        </>
      )}

      {/* Dialog para eliminar simulación individual */}
      <Portal>
        <Modal visible={dialogEliminarVisible} transparent animationType="fade">
          <View style={[styles.dialogOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.dialogContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 16 }}>
                Eliminar simulación
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
                ¿Deseas eliminar "{simAEliminar?.nombre}"?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button onPress={() => setDialogEliminarVisible(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onPress={confirmarEliminar} textColor={theme.colors.error} style={{ flex: 1 }}>
                  Eliminar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Dialog para limpiar todo el historial */}
      <Portal>
        <Modal visible={dialogLimpiarVisible} transparent animationType="fade">
          <View style={[styles.dialogOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.dialogContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 16 }}>
                Limpiar historial
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
                ¿Deseas eliminar todas las simulaciones guardadas?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button onPress={() => setDialogLimpiarVisible(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onPress={confirmarLimpiar} textColor={theme.colors.error} style={{ flex: 1 }}>
                  Limpiar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>
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
  dialogOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialogContainer: { margin: 20, borderRadius: 12, padding: 20, elevation: 4 },
});

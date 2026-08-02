/**
 * Pantalla de historial de simulaciones guardadas.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Modal } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, ActivityIndicator, Divider, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useHistory } from '../hooks/useHistory';
import { formatCurrency, formatDateShort } from '../utils/format';
import { DataRow } from '../components/DataRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { simulations, loading, remove, clear } = useHistory();

  // Estado para los dialogs
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [simToDelete, setSimToDelete] = useState<{ id: string; name: string } | null>(null);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const handleDelete = (id: string, name: string) => {
    setSimToDelete({ id, name });
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (simToDelete) {
      remove(simToDelete.id);
      setDeleteDialogVisible(false);
      setSimToDelete(null);
    }
  };

  const handleClear = () => {
    setClearDialogVisible(true);
  };

  const confirmClear = () => {
    clear();
    setClearDialogVisible(false);
  };

  if (loading) {
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
          Historial de simulaciones ({simulations.length}/20)
        </Text>
        {simulations.length > 0 && (
          <Button onPress={handleClear} textColor={theme.colors.error} compact>
            Limpiar todo
          </Button>
        )}
      </View>

      {simulations.length === 0 ? (
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
            {simulations.map((sim) => (
              <Card
                key={sim.id}
                style={[styles.card, { backgroundColor: theme.colors.surface }]}
                elevation={2}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                        {sim.name}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatDateShort(new Date(sim.creationDate))}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <IconButton
                        icon="eye-outline"
                        iconColor={theme.colors.primary}
                        size={20}
                        onPress={() => navigation.navigate('Result', { simulationId: sim.id })}
                      />
                      <IconButton
                        icon="delete-outline"
                        iconColor={theme.colors.error}
                        size={20}
                        onPress={() => handleDelete(sim.id, sim.name)}
                      />
                    </View>
                  </View>
                  <Divider style={{ marginVertical: 8 }} />
                  <View style={styles.cardData}>
                    <DataRow label="Pensión mensual" value={formatCurrency(sim.result.monthlyPension)} theme={theme} highlight />
                    <DataRow label="Semanas cotizadas" value={String(sim.result.input.workHistory.totalWeeks)} theme={theme} />
                    <DataRow label="Edad de retiro" value={`${sim.result.input.personalData.retirementAge} años`} theme={theme} />
                    <DataRow label="Tipo" value={sim.result.pensionType === 'vejez' ? 'Vejez' : 'Cesantía'} theme={theme} />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </>
      )}

      {/* Dialog para eliminar simulación individual */}
      <Portal>
        <Modal visible={deleteDialogVisible} transparent animationType="fade">
          <View style={[styles.dialogOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.dialogContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 16 }}>
                Eliminar simulación
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
                ¿Deseas eliminar "{simToDelete?.name}"?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button onPress={() => setDeleteDialogVisible(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onPress={confirmDelete} textColor={theme.colors.error} style={{ flex: 1 }}>
                  Eliminar
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Dialog para limpiar todo el historial */}
      <Portal>
        <Modal visible={clearDialogVisible} transparent animationType="fade">
          <View style={[styles.dialogOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.dialogContainer, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold', marginBottom: 16 }}>
                Limpiar historial
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 24 }}>
                ¿Deseas eliminar todas las simulaciones guardadas?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button onPress={() => setClearDialogVisible(false)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button onPress={confirmClear} textColor={theme.colors.error} style={{ flex: 1 }}>
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

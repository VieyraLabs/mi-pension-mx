/**
 * Pantalla de historial de simulaciones guardadas.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, useTheme, ActivityIndicator, Divider, Portal, Dialog } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useHistory } from '../hooks/useHistory';
import { MAX_SIMULATIONS } from '../storage/simulationStorage';
import { formatAge, formatCurrency, formatDateLong, formatDateShort, formatInteger, formatWeeksTargetText, getWeeksLabel } from '../utils/format';
import { DataRow } from '../components/DataRow';
import { normalizeLocalCalendarDate } from '../utils/weeksProjection';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Fecha de retiro guardada en la simulación (misma fuente que ResultScreen).
 * El storage JSON revive los campos Date del modelo como strings ISO.
 */
function getRetirementDate(personalData: { estimatedRetirementDate: Date | string }): Date {
  return normalizeLocalCalendarDate(
    new Date(personalData.estimatedRetirementDate as unknown as string),
  );
}

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
          Historial de simulaciones ({simulations.length}/{MAX_SIMULATIONS})
        </Text>
        {simulations.length > 0 && (
          <Button onPress={handleClear} textColor={theme.colors.error} compact>
            Limpiar todo
          </Button>
        )}
      </View>

      {simulations.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={{ fontSize: 40 }}>📊</Text>
          </View>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 16 }}>
            No hay simulaciones guardadas.{'\n'}Crea tu primera simulación desde el inicio.
          </Text>
          <Button
            mode="contained"
            style={[styles.emptyBtn, { borderRadius: 14 }]}
            contentStyle={{ paddingVertical: 6 }}
            onPress={() => navigation.navigate('NewSimulation' as never)}
          >
            Nueva simulación
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {simulations.map((sim) => (
            <Card
              key={sim.id}
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              elevation={1}
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
                <View style={[styles.pensionBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                    {formatCurrency(sim.result.monthlyPension)}/mes
                  </Text>
                </View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.cardData}>
                  <DataRow
                    label="Fecha de retiro"
                    value={`${formatDateLong(getRetirementDate(sim.result.input.personalData))} (${formatAge(sim.result.input.personalData.retirementAge)} años)`}
                    theme={theme}
                  />
                  {/* La etiqueta y el valor de proyección se comparten con
                      ResultScreen y el PDF. Los registros históricos sin
                      proyección conservan como valor las semanas capturadas. */}
                  <DataRow
                    label={getWeeksLabel(sim.result.weeksProjection)}
                    value={
                      sim.result.weeksProjection
                        ? formatWeeksTargetText(
                            sim.result.weeksProjection,
                            sim.result.input.personalData.retirementAge,
                          )
                        : `${formatInteger(sim.result.input.workHistory.totalWeeks)} sem.`
                    }
                    theme={theme}
                  />
                  <DataRow
                    label="SBC proyectado (diario)"
                    value={formatCurrency(
                      sim.result.input.projectedAverageDailySalary ?? sim.result.input.averageSalary.dailySalary,
                    )}
                    theme={theme}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Dialog para eliminar simulación individual */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)} style={{ backgroundColor: theme.colors.surface, borderRadius: 20 }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Eliminar simulación</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              ¿Deseas eliminar "{simToDelete?.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>Eliminar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog para limpiar todo el historial */}
      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)} style={{ backgroundColor: theme.colors.surface, borderRadius: 20 }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Limpiar historial</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              ¿Deseas eliminar todas las simulaciones guardadas?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancelar</Button>
            <Button onPress={confirmClear} textColor={theme.colors.error}>Limpiar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBtn: { marginTop: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, elevation: 2 },
  list: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  pensionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  cardData: { gap: 2 },
});

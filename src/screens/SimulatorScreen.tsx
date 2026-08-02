/**
 * Pantalla de simulador de escenarios — compara escenario A vs B.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider, useTheme, HelperText } from 'react-native-paper';
import { calculateSimpleScenario } from '../services/pension/PensionCalculator';
import { formatCurrency } from '../utils/format';
import { UMA_ACTUAL } from '../constants/uma';
import { ScenarioInputs, type Scenario } from '../components/ScenarioInputs';
import { CompRow } from '../components/CompRow';

const DEFAULT_SCENARIO: Scenario = {
  retirementAge: '65',
  dailySalary: '300',
  totalWeeks: '800',
  dailyUMA: String(UMA_ACTUAL.dailyUMA),
};

export default function SimulatorScreen() {
  const theme = useTheme();
  const [scenarioA, setScenarioA] = useState<Scenario>({ ...DEFAULT_SCENARIO });
  const [scenarioB, setScenarioB] = useState<Scenario>({ ...DEFAULT_SCENARIO, retirementAge: '65', totalWeeks: '1000' });
  const [resultA, setResultA] = useState<number | null>(null);
  const [resultB, setResultB] = useState<number | null>(null);
  const [compared, setCompared] = useState(false);

  const calculate = () => {
    const a = calculateSimpleScenario({
      edadRetiro: parseInt(scenarioA.retirementAge) || 65,
      salarioDiario: parseFloat(scenarioA.dailySalary) || 0,
      semanasCotizadas: parseInt(scenarioA.totalWeeks) || 0,
      umaDiaria: parseFloat(scenarioA.dailyUMA) || UMA_ACTUAL.dailyUMA,
    });
    const b = calculateSimpleScenario({
      edadRetiro: parseInt(scenarioB.retirementAge) || 65,
      salarioDiario: parseFloat(scenarioB.dailySalary) || 0,
      semanasCotizadas: parseInt(scenarioB.totalWeeks) || 0,
      umaDiaria: parseFloat(scenarioB.dailyUMA) || UMA_ACTUAL.dailyUMA,
    });
    setResultA(a);
    setResultB(b);
    setCompared(true);
  };

  const monthlyDifference = (resultA ?? 0) - (resultB ?? 0);
  const annualDifference = monthlyDifference * 12;
  const percentIncrease = resultB && resultB > 0 && resultA ? ((resultA - resultB) / resultB) * 100 : 0;
  const better = (resultA ?? 0) >= (resultB ?? 0) ? 'A' : 'B';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        Simular escenarios
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
        Compara dos escenarios modificando los parámetros principales.
      </Text>

      <View style={styles.scenariosRow}>
        {/* Escenario A */}
        <Card style={[styles.scenarioCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Title title="Escenario A" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
          <Card.Content>
            <ScenarioInputs scenario={scenarioA} onChange={setScenarioA} />
          </Card.Content>
        </Card>

        {/* Escenario B */}
        <Card style={[styles.scenarioCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Title title="Escenario B" titleStyle={{ color: '#FF6F00', fontWeight: 'bold' }} />
          <Card.Content>
            <ScenarioInputs scenario={scenarioB} onChange={setScenarioB} />
          </Card.Content>
        </Card>
      </View>

      <Button mode="contained" onPress={calculate} style={styles.calcBtn} icon="calculator">
        Comparar escenarios
      </Button>

      {compared && resultA !== null && resultB !== null && (
        <>
          {/* Resultados */}
          <View style={styles.resultsRow}>
            <Card style={[styles.resultCard, { backgroundColor: resultA >= resultB ? '#E8F5E9' : theme.colors.surface }]} elevation={2}>
              <Card.Content style={{ alignItems: 'center' }}>
                <Text variant="labelMedium" style={{ color: '#1565C0' }}>Escenario A</Text>
                <Text variant="headlineSmall" style={{ color: '#1565C0', fontWeight: 'bold' }}>
                  {formatCurrency(resultA)}/mes
                </Text>
                {resultA === 0 && <HelperText type="error">Datos insuficientes</HelperText>}
              </Card.Content>
            </Card>

            <Card style={[styles.resultCard, { backgroundColor: resultB > resultA ? '#E8F5E9' : theme.colors.surface }]} elevation={2}>
              <Card.Content style={{ alignItems: 'center' }}>
                <Text variant="labelMedium" style={{ color: '#FF6F00' }}>Escenario B</Text>
                <Text variant="headlineSmall" style={{ color: '#FF6F00', fontWeight: 'bold' }}>
                  {formatCurrency(resultB)}/mes
                </Text>
                {resultB === 0 && <HelperText type="error">Datos insuficientes</HelperText>}
              </Card.Content>
            </Card>
          </View>

          {/* Comparación */}
          <Card style={[styles.compCard, { backgroundColor: theme.colors.surface }]} elevation={3}>
            <Card.Title title={`Escenario ${better} es mejor`} titleVariant="titleMedium" />
            <Divider />
            <Card.Content style={{ paddingTop: 12 }}>
              <CompRow label="Diferencia mensual" value={formatCurrency(Math.abs(monthlyDifference))} theme={theme} />
              <CompRow label="Diferencia anual" value={formatCurrency(Math.abs(annualDifference))} theme={theme} />
              <CompRow
                label="% de incremento"
                value={`${percentIncrease >= 0 ? '+' : ''}${percentIncrease.toFixed(2)}%`}
                theme={theme}
              />
            </Card.Content>
          </Card>

          <Card style={{ backgroundColor: '#FFF8E1', borderRadius: 12, marginTop: 8 }} elevation={0}>
            <Card.Content>
              <Text variant="labelSmall" style={{ color: '#795548' }}>
                ⚠️ ESTIMACIÓN — Estos resultados son aproximados. La resolución oficial corresponde al IMSS.
              </Text>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
  scenariosRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scenarioCard: { flex: 1, borderRadius: 12 },
  calcBtn: { marginBottom: 16, borderRadius: 8 },
  resultsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  resultCard: { flex: 1, borderRadius: 12 },
  compCard: { borderRadius: 12 },
});

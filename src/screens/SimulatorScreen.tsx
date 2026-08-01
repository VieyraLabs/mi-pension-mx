/**
 * Pantalla de simulador de escenarios — compara escenario A vs B.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, Divider, useTheme, HelperText } from 'react-native-paper';
import { calcularEscenarioSimple } from '../services/pension/PensionCalculator';
import { formatCurrency, formatPercent } from '../utils/format';
import { UMA_ACTUAL } from '../constants/uma';

interface Escenario {
  edadRetiro: string;
  salarioDiario: string;
  semanasCotizadas: string;
  umaDiaria: string;
}

const DEFAULT_ESC: Escenario = {
  edadRetiro: '65',
  salarioDiario: '300',
  semanasCotizadas: '800',
  umaDiaria: String(UMA_ACTUAL.umaDiaria),
};

export default function SimulatorScreen() {
  const theme = useTheme();
  const [escA, setEscA] = useState<Escenario>({ ...DEFAULT_ESC });
  const [escB, setEscB] = useState<Escenario>({ ...DEFAULT_ESC, edadRetiro: '65', semanasCotizadas: '1000' });
  const [resultA, setResultA] = useState<number | null>(null);
  const [resultB, setResultB] = useState<number | null>(null);
  const [comparado, setComparado] = useState(false);

  const calcular = () => {
    const a = calcularEscenarioSimple({
      edadRetiro: parseInt(escA.edadRetiro) || 65,
      salarioDiario: parseFloat(escA.salarioDiario) || 0,
      semanasCotizadas: parseInt(escA.semanasCotizadas) || 0,
      umaDiaria: parseFloat(escA.umaDiaria) || UMA_ACTUAL.umaDiaria,
    });
    const b = calcularEscenarioSimple({
      edadRetiro: parseInt(escB.edadRetiro) || 65,
      salarioDiario: parseFloat(escB.salarioDiario) || 0,
      semanasCotizadas: parseInt(escB.semanasCotizadas) || 0,
      umaDiaria: parseFloat(escB.umaDiaria) || UMA_ACTUAL.umaDiaria,
    });
    setResultA(a);
    setResultB(b);
    setComparado(true);
  };

  const difMensual = (resultA ?? 0) - (resultB ?? 0);
  const difAnual = difMensual * 12;
  const pctIncremento = resultB && resultB > 0 && resultA ? ((resultA - resultB) / resultB) * 100 : 0;
  const mayor = (resultA ?? 0) >= (resultB ?? 0) ? 'A' : 'B';

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
            <EscenarioInputs esc={escA} setEsc={setEscA} theme={theme} />
          </Card.Content>
        </Card>

        {/* Escenario B */}
        <Card style={[styles.scenarioCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Title title="Escenario B" titleStyle={{ color: '#FF6F00', fontWeight: 'bold' }} />
          <Card.Content>
            <EscenarioInputs esc={escB} setEsc={setEscB} theme={theme} />
          </Card.Content>
        </Card>
      </View>

      <Button mode="contained" onPress={calcular} style={styles.calcBtn} icon="calculator">
        Comparar escenarios
      </Button>

      {comparado && resultA !== null && resultB !== null && (
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
            <Card.Title title={`Escenario ${mayor} es mejor`} titleVariant="titleMedium" />
            <Divider />
            <Card.Content style={{ paddingTop: 12 }}>
              <CompRow label="Diferencia mensual" value={formatCurrency(Math.abs(difMensual))} theme={theme} />
              <CompRow label="Diferencia anual" value={formatCurrency(Math.abs(difAnual))} theme={theme} />
              <CompRow
                label="% de incremento"
                value={`${pctIncremento >= 0 ? '+' : ''}${pctIncremento.toFixed(2)}%`}
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

function EscenarioInputs({ esc, setEsc, theme }: { esc: Escenario; setEsc: (e: Escenario) => void; theme: any }) {
  return (
    <>
      <TextInput label="Edad retiro" value={esc.edadRetiro} onChangeText={(v) => setEsc({ ...esc, edadRetiro: v })} mode="outlined" keyboardType="numeric" style={styles.input} dense />
      <TextInput label="Salario diario ($)" value={esc.salarioDiario} onChangeText={(v) => setEsc({ ...esc, salarioDiario: v })} mode="outlined" keyboardType="decimal-pad" style={styles.input} dense />
      <TextInput label="Semanas cotizadas" value={esc.semanasCotizadas} onChangeText={(v) => setEsc({ ...esc, semanasCotizadas: v })} mode="outlined" keyboardType="numeric" style={styles.input} dense />
      <TextInput label="UMA diaria ($)" value={esc.umaDiaria} onChangeText={(v) => setEsc({ ...esc, umaDiaria: v })} mode="outlined" keyboardType="decimal-pad" style={styles.input} dense />
    </>
  );
}

function CompRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
  scenariosRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scenarioCard: { flex: 1, borderRadius: 12 },
  input: { marginBottom: 8 },
  calcBtn: { marginBottom: 16, borderRadius: 8 },
  resultsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  resultCard: { flex: 1, borderRadius: 12 },
  compCard: { borderRadius: 12 },
});

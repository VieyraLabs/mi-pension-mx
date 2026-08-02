/**
 * Pantalla de resultado de la simulación de pensión.
 * Muestra el resumen, resultado principal y desglose detallado.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider, useTheme, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useHistory } from '../hooks/useHistory';
import { exportPensionResultToPdf } from '../services/export/pdfExport';
import { formatCurrency, formatPercent, formatInteger } from '../utils/format';
import { showAlert } from '../utils/alert';
import { calculateM40Summary } from '../utils/modalidad40';
import { EstimationDisclaimerCard } from '../components/EstimationDisclaimerCard';
import { EmptyState } from '../components/EmptyState';
import { SummaryRow } from '../components/SummaryRow';
import type { PensionResult } from '../models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ResultScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { simulations } = useHistory();
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Obtener simulación específica del route params o la más reciente
  const simulationId = (route.params as { simulationId?: string })?.simulationId;
  const selectedSimulation = simulations.find((s) => s.id === simulationId);
  const result: PensionResult | undefined = selectedSimulation?.result;

  if (!result) {
    return (
      <EmptyState
        mensaje="No hay resultado disponible."
        textoBoton="Volver"
        onPressBoton={() => navigation.goBack()}
      />
    );
  }

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportPensionResultToPdf(result);
    } catch (error) {
      console.error('[ResultScreen] Error al generar el PDF:', error);
      showAlert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <EstimationDisclaimerCard />

      {/* Resumen */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Title title="Resumen" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          {result.input.personalData.name && (
            <SummaryRow label="Nombre" value={result.input.personalData.name} theme={theme} />
          )}
          <SummaryRow label="Edad de retiro" value={`${result.input.personalData.retirementAge} años`} theme={theme} />
          <SummaryRow label="Tipo de pensión" value={result.pensionType === 'vejez' ? 'Vejez (Art. 145)' : 'Cesantía Edad Avanzada (Art. 138)'} theme={theme} />
          <SummaryRow label="Semanas cotizadas" value={formatInteger(result.input.workHistory.totalWeeks)} theme={theme} />
          <SummaryRow label="Salario diario promedio" value={formatCurrency(result.input.averageSalary.dailySalary)} theme={theme} />
          <SummaryRow label="UMA utilizada" value={`$${result.input.uma.dailyUMA}/día (${result.input.uma.year}${result.input.uma.isCustom ? ', personalizada' : ''})`} theme={theme} />
          {result.input.modalidad40.active && (() => {
            const m40 = result.input.modalidad40;
            const summary = calculateM40Summary(
              m40,
              result.input.workHistory.totalWeeks,
              result.input.averageSalary.dailySalary,
              result.input.uma.dailyUMA,
            );
            return (
              <View style={styles.m40Block}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.primary, marginBottom: 6 }}
                >
                  Modalidad 40
                </Text>
                <SummaryRow
                  label="Salario base a cotizar"
                  value={`${formatCurrency(m40.contributionSalary ?? 0)}/día`}
                  theme={theme}
                />
                <SummaryRow
                  label="Meses que planeas cotizar"
                  value={`${m40.expectedMonths ?? 0} meses`}
                  theme={theme}
                />
                <SummaryRow
                  label="SBC M40 con incremento anual"
                  value={`${formatCurrency(summary.adjustedDailyM40Salary)}/día`}
                  theme={theme}
                />
                <SummaryRow
                  label="Semanas M40 (de las 250)"
                  value={`${summary.referenceWeeks} sem.`}
                  theme={theme}
                />
                <SummaryRow
                  label="Semanas previas al M40"
                  value={`${summary.baseWeeks} sem.`}
                  theme={theme}
                />
                <SummaryRow
                  label="Total de semanas cotizadas"
                  value={`${formatInteger(summary.estimatedTotalWeeks)} sem.`}
                  theme={theme}
                />
                <SummaryRow
                  label="Salario promedio ponderado"
                  value={`${formatCurrency(summary.estimatedAverageDailySalary)}/día`}
                  theme={theme}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontStyle: 'italic' }}
                >
                  Promedio = (salario × semanas previas + SBC M40 × semanas M40) ÷ 250
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}
                >
                  Suma ponderada de las 250 semanas que usa el IMSS para calcular tu pensión.
                </Text>
              </View>
            );
          })()}
        </Card.Content>
      </Card>

      {/* Resultado principal */}
      <Card style={[styles.mainResultCard, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Card.Content style={{ alignItems: 'center', padding: 24 }}>
          <Text variant="titleSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Pensión mensual estimada
          </Text>
          <Text variant="displaySmall" style={{ color: '#FFFFFF', fontWeight: 'bold', marginVertical: 8 }}>
            {formatCurrency(result.monthlyPension)}
          </Text>
          <Divider style={{ backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', marginVertical: 8 }} />
          <View style={styles.subResults}>
            <View style={styles.subResult}>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>Anual</Text>
              <Text variant="titleSmall" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {formatCurrency(result.annualPension)}
              </Text>
            </View>
            <View style={styles.subResult}>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>Diario</Text>
              <Text variant="titleSmall" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {formatCurrency(result.dailyAmount)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Indicadores clave */}
      <View style={styles.chipsRow}>
        {result.capApplied && <Chip icon="alert" style={{ backgroundColor: '#FFF9C4' }}>Tope 25 UMA</Chip>}
        {result.pmgApplied && <Chip icon="alert" style={{ backgroundColor: '#FFF9C4' }}>PMG aplicada</Chip>}
        {result.input.modalidad40.active && <Chip icon="check" style={{ backgroundColor: '#E8F5E9' }}>Modalidad 40</Chip>}
        <Chip icon="information" style={{ backgroundColor: '#E3F2FD' }}>
          Factor edad: {formatPercent(result.ageFactor * 100)}
        </Chip>
      </View>

      {/* Desglose detallado */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title
          title="Desglose del cálculo"
          titleVariant="titleMedium"
          right={() => (
            <Button onPress={() => setBreakdownExpanded(!breakdownExpanded)}>
              {breakdownExpanded ? 'Ocultar' : 'Ver desglose'}
            </Button>
          )}
        />
        {breakdownExpanded && (
          <>
            <Divider />
            {result.steps.map((step) => (
              <View key={step.id} style={styles.breakdownItem}>
                <View style={styles.breakdownContent}>
                  <Text variant="bodyMedium" style={styles.breakdownTitle}>
                    {step.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.breakdownDescription}>
                    {step.description}
                    {step.legalBasis && <Text style={styles.breakdownLegal}>📋 {step.legalBasis}</Text>}
                    {step.isEstimate && <Text style={styles.breakdownEstimate}>⚠️ ESTIMACIÓN</Text>}
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.breakdownValue}>
                  {formatCurrency(step.value)}
                </Text>
              </View>
            ))}
          </>
        )}
      </Card>

      {/* Advertencias */}
      {result.warnings.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
          <Card.Title title="Notas y advertencias" titleVariant="titleSmall" />
          <Card.Content>
            {result.warnings.map((warning, i) => (
              <Text key={i} variant="bodySmall" style={{ color: '#5D4037', marginBottom: 8, lineHeight: 18 }}>
                • {warning}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Acciones */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="file-pdf-box"
          onPress={exportPdf}
          loading={exporting}
          style={styles.actionBtn}
        >
          Exportar PDF
        </Button>
        <Button
          mode="outlined"
          icon="calculator"
          onPress={() => navigation.navigate('NewSimulation' as never)}
          style={styles.actionBtn}
        >
          Nueva simulación
        </Button>
        <Button
          mode="outlined"
          icon="home"
          onPress={() => navigation.popToTop()}
          style={styles.actionBtn}
        >
          Ir al inicio
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 16 },
  m40Block: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  mainResultCard: { borderRadius: 16, marginBottom: 16 },
  subResults: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  subResult: { alignItems: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  actions: { gap: 12, marginBottom: 20 },
  actionBtn: { borderRadius: 8 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  breakdownContent: { flex: 1 },
  breakdownTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 4, width: '100%' },
  breakdownDescription: { fontSize: 11, lineHeight: 16, color: '#757575', width: '100%' },
  breakdownLegal: { color: '#1976D2' },
  breakdownEstimate: { color: '#FF6F00' },
  breakdownValue: { color: '#1976D2', fontWeight: 'bold', fontSize: 13, alignSelf: 'center' },
});

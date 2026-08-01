/**
 * Pantalla de resultado de la simulación de pensión.
 * Muestra el resumen, resultado principal y desglose detallado.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { Text, Card, Button, Divider, useTheme, Chip, List } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useHistory } from '../hooks/useHistory';
import { generarPDF } from '../services/export/pdfExport';
import { formatCurrency, formatPercent, formatInteger } from '../utils/format';
import type { PensionResult } from '../models';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ResultScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { simulaciones } = useHistory();
  const [desgloseExpanded, setDesgloseExpanded] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Obtener simulación específica del route params o la más reciente
  const simulacionId = (route.params as { simulacionId?: string })?.simulacionId;
  const simulacionSeleccionada = simulaciones.find((s) => s.id === simulacionId);
  const resultado: PensionResult | undefined = simulacionSeleccionada?.resultado;

  if (!resultado) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onBackground }}>
          No hay resultado disponible.
        </Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          Volver
        </Button>
      </View>
    );
  }

  const exportarPDF = async () => {
    setExportando(true);
    try {
      await generarPDF(resultado);
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Banner de estimación */}
      <Card style={[styles.bannerCard, { backgroundColor: '#FFF8E1' }]} elevation={0}>
        <Card.Content>
          <Text variant="labelSmall" style={{ color: '#795548' }}>
            ⚠️ ESTIMACIÓN — Resultado con fines informativos. La resolución oficial corresponde al IMSS.
          </Text>
        </Card.Content>
      </Card>

      {/* Resumen */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Title title="Resumen" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          {resultado.input.datosPersonales.nombre && (
            <ResumenRow label="Nombre" value={resultado.input.datosPersonales.nombre} theme={theme} />
          )}
          <ResumenRow label="Edad de retiro" value={`${resultado.input.datosPersonales.edadRetiro} años`} theme={theme} />
          <ResumenRow label="Tipo de pensión" value={resultado.tipoPension === 'vejez' ? 'Vejez (Art. 145)' : 'Cesantía Edad Avanzada (Art. 138)'} theme={theme} />
          <ResumenRow label="Semanas cotizadas" value={formatInteger(resultado.input.historialLaboral.semanasTotales)} theme={theme} />
          <ResumenRow label="Salario diario promedio" value={formatCurrency(resultado.input.salarioPromedio.salarioDiario)} theme={theme} />
          <ResumenRow label="UMA utilizada" value={`$${resultado.input.uma.umaDiaria}/día (${resultado.input.uma.anio}${resultado.input.uma.esPersonalizada ? ', personalizada' : ''})`} theme={theme} />
          {resultado.input.modalidad40.activa && (
            <ResumenRow label="Modalidad 40" value={`Activa — $${resultado.input.modalidad40.salarioCotizacion}/día`} theme={theme} />
          )}
        </Card.Content>
      </Card>

      {/* Resultado principal */}
      <Card style={[styles.mainResultCard, { backgroundColor: theme.colors.primary }]} elevation={4}>
        <Card.Content style={{ alignItems: 'center', padding: 24 }}>
          <Text variant="titleSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Pensión mensual estimada
          </Text>
          <Text variant="displaySmall" style={{ color: '#FFFFFF', fontWeight: 'bold', marginVertical: 8 }}>
            {formatCurrency(resultado.pensionMensual)}
          </Text>
          <Divider style={{ backgroundColor: 'rgba(255,255,255,0.3)', width: '100%', marginVertical: 8 }} />
          <View style={styles.subResults}>
            <View style={styles.subResult}>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>Anual</Text>
              <Text variant="titleSmall" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {formatCurrency(resultado.pensionAnual)}
              </Text>
            </View>
            <View style={styles.subResult}>
              <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.8)' }}>Diario</Text>
              <Text variant="titleSmall" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                {formatCurrency(resultado.montoDiario)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Indicadores clave */}
      <View style={styles.chipsRow}>
        {resultado.aplicoTope && <Chip icon="alert" style={{ backgroundColor: '#FFF9C4' }}>Tope 25 UMA</Chip>}
        {resultado.aplicoPMG && <Chip icon="alert" style={{ backgroundColor: '#FFF9C4' }}>PMG aplicada</Chip>}
        {resultado.input.modalidad40.activa && <Chip icon="check" style={{ backgroundColor: '#E8F5E9' }}>Modalidad 40</Chip>}
        <Chip icon="information" style={{ backgroundColor: '#E3F2FD' }}>
          Factor edad: {formatPercent(resultado.factorEdad * 100)}
        </Chip>
      </View>

      {/* Desglose detallado */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title
          title="Desglose del cálculo"
          titleVariant="titleMedium"
          right={() => (
            <Button onPress={() => setDesgloseExpanded(!desgloseExpanded)}>
              {desgloseExpanded ? 'Ocultar' : 'Ver desglose'}
            </Button>
          )}
        />
        {desgloseExpanded && (
          <>
            <Divider />
            {resultado.pasos.map((paso) => (
              <View key={paso.id} style={styles.desgloseItem}>
                <View style={styles.desgloseContent}>
                  <Text variant="bodyMedium" style={styles.desgloseTitle}>
                    {paso.titulo}
                  </Text>
                  <Text variant="bodySmall" style={styles.desgloseDescription}>
                    {paso.descripcion}
                    {paso.baseLegal && <Text style={styles.desgloseLegal}>📋 {paso.baseLegal}</Text>}
                    {paso.esEstimacion && <Text style={styles.desgloseEstimacion}>⚠️ ESTIMACIÓN</Text>}
                  </Text>
                </View>
                <Text variant="labelLarge" style={styles.desgloseValue}>
                  {formatCurrency(paso.valor)}
                </Text>
              </View>
            ))}
          </>
        )}
      </Card>

      {/* Advertencias */}
      {resultado.advertencias.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
          <Card.Title title="Notas y advertencias" titleVariant="titleSmall" />
          <Card.Content>
            {resultado.advertencias.map((adv, i) => (
              <Text key={i} variant="bodySmall" style={{ color: '#5D4037', marginBottom: 8, lineHeight: 18 }}>
                • {adv}
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
          onPress={exportarPDF}
          loading={exportando}
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
      </View>
    </ScrollView>
  );
}

function ResumenRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.resumenRow}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold', flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 16 },
  bannerCard: { borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF6F00' },
  mainResultCard: { borderRadius: 16, marginBottom: 16 },
  subResults: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  subResult: { alignItems: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  actions: { gap: 12, marginBottom: 20 },
  actionBtn: { borderRadius: 8 },
  desgloseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  desgloseContent: { flex: 1 },
  desgloseTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 4, width: '100%' },
  desgloseDescription: { fontSize: 11, lineHeight: 16, color: '#757575', width: '100%' },
  desgloseLegal: { color: '#1976D2' },
  desgloseEstimacion: { color: '#FF6F00' },
  desgloseValue: { color: '#1976D2', fontWeight: 'bold', fontSize: 13, alignSelf: 'center' },
});

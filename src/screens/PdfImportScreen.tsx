/**
 * Pantalla para importar la Constancia de Semanas Cotizadas del IMSS en PDF.
 */
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { importarPDF } from '../services/pdf/PdfImporter';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PdfImportScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seleccionarPDF = async () => {
    setProcesando(true);
    setError(null);
    try {
      const resultado = await importarPDF();
      if (resultado.ok && resultado.data) {
        navigation.navigate('Validation', { textoExtraido: resultado.data.textoExtraido });
      } else {
        setError(resultado.error ?? 'No se pudo procesar el PDF.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al importar el PDF.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.primary }]} elevation={3}>
        <Card.Content style={{ alignItems: 'center', padding: 20 }}>
          <Text variant="headlineSmall" style={{ color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center' }}>
            📄 Importar Constancia IMSS
          </Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 }}>
            Importa tu Constancia de Semanas Cotizadas en PDF para extraer los datos automáticamente
          </Text>
        </Card.Content>
      </Card>

      {/* Instrucciones */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="¿Cómo funciona?" titleVariant="titleMedium" />
        <Card.Content>
          {[
            '1. Descarga tu Constancia de Semanas Cotizadas desde el portal del IMSS (imss.gob.mx)',
            '2. Selecciona el archivo PDF desde tu dispositivo',
            '3. La aplicación extrae los datos automáticamente',
            '4. Revisa y corrige la información extraída antes de calcular',
          ].map((step, i) => (
            <Text key={i} variant="bodySmall" style={{ color: theme.colors.onSurface, lineHeight: 22, marginBottom: 4 }}>
              {step}
            </Text>
          ))}
        </Card.Content>
      </Card>

      {/* Capacidades */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="Datos que se extraen" titleVariant="titleSmall" />
        <Card.Content>
          <View style={styles.chips}>
            {['Nombre', 'CURP', 'NSS', 'Fecha de nacimiento', 'Semanas cotizadas', 'SBC', 'Historial laboral', 'Último patrón'].map((d) => (
              <Chip key={d} style={styles.chip} compact>{d}</Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Privacidad */}
      <Card style={[styles.card, { backgroundColor: '#E8F5E9' }]} elevation={0}>
        <Card.Content>
          <Text variant="bodySmall" style={{ color: '#2E7D32', lineHeight: 18 }}>
            🔒 Procesamiento 100% local — Tu información NO se envía a ningún servidor externo. Todo el análisis del PDF se realiza en tu dispositivo.
          </Text>
        </Card.Content>
      </Card>

      {/* Nota OCR */}
      <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
        <Card.Content>
          <Text variant="bodySmall" style={{ color: '#795548', lineHeight: 18 }}>
            ⚠️ Para PDFs con texto seleccionable: extracción directa. Para PDFs escaneados (imagen): el OCR completo requiere un development build. En Expo Go, se solicita captura manual de los datos del PDF escaneado.
          </Text>
        </Card.Content>
      </Card>

      {/* Error */}
      {error && (
        <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Card.Content>
            <Text variant="bodySmall" style={{ color: '#C62828' }}>❌ {error}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Botón principal */}
      {procesando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onBackground, marginTop: 16 }}>
            Procesando PDF...
          </Text>
        </View>
      ) : (
        <Button
          mode="contained"
          onPress={seleccionarPDF}
          icon="file-upload"
          style={styles.mainBtn}
          contentStyle={{ paddingVertical: 8 }}
        >
          Seleccionar PDF
        </Button>
      )}

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        Cancelar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: { borderRadius: 16, marginBottom: 16 },
  card: { borderRadius: 12, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { marginBottom: 4 },
  loadingContainer: { alignItems: 'center', padding: 24 },
  mainBtn: { borderRadius: 8, marginBottom: 12 },
  backBtn: { borderRadius: 8 },
});

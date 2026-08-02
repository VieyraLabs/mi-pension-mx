/**
 * Pantalla de validación de datos importados desde PDF.
 * Permite al usuario revisar y corregir los datos extraídos.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, useTheme, Divider, Chip } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ConstanciaIMSSParser } from '../services/pdf/parsers/PersonalDataParser';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Validation'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ValidationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { extractedText } = route.params;

  const [data, setData] = useState({
    name: '',
    curp: '',
    nss: '',
    totalWeeks: '',
    averageSBC: '',
    lastSBC: '',
    birthDate: '',
    sex: undefined as 'masculino' | 'femenino' | undefined,
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showExtractedText, setShowExtractedText] = useState(false);

  useEffect(() => {
    const result = ConstanciaIMSSParser.parse(extractedText);
    if (result.ok && result.data) {
      const d = result.data;
      setData({
        name: d.name ?? '',
        curp: d.curp ?? '',
        nss: d.nss ?? '',
        totalWeeks: d.totalWeeks ? String(d.totalWeeks) : '',
        averageSBC: d.averageSBC ? String(d.averageSBC) : '',
        lastSBC: d.lastSBC ? String(d.lastSBC) : '',
        birthDate: d.birthDate ? d.birthDate.toISOString().split('T')[0] ?? '' : '',
        sex: d.sex,
      });
      setWarnings(result.warnings);
      setMissingFields(result.missingFields);
    }
  }, [extractedText]);

  const confirmData = () => {
    if (!data.totalWeeks || parseInt(data.totalWeeks) <= 0) {
      showAlert('Error', 'Por favor ingresa el número de semanas cotizadas.');
      return;
    }

    const totalWeeks = parseInt(data.totalWeeks);
    const averageSBC = data.averageSBC ? parseFloat(data.averageSBC) : undefined;
    const lastSBC = data.lastSBC ? parseFloat(data.lastSBC) : undefined;

    showAlert(
      'Datos listos',
      'Tu formulario de nueva simulación se precargará con estos datos. Revisa cada paso antes de calcular tu pensión.',
      [
        {
          text: 'Continuar',
          onPress: () =>
            navigation.navigate('NewSimulation', {
              importedData: {
                name: data.name || undefined,
                sex: data.sex,
                birthDate: data.birthDate || undefined,
                totalWeeks: !isNaN(totalWeeks) ? totalWeeks : undefined,
                averageSBC: averageSBC && !isNaN(averageSBC) ? averageSBC : undefined,
                lastSBC: lastSBC && !isNaN(lastSBC) ? lastSBC : undefined,
              },
            }),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Advertencias */}
      {warnings.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFF8E1' }]} elevation={0}>
          <Card.Title title="Notas de extracción" titleVariant="titleSmall" />
          <Card.Content>
            {warnings.map((warning, i) => (
              <Text key={i} variant="bodySmall" style={{ color: '#795548', lineHeight: 18, marginBottom: 4 }}>
                • {warning}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Campos faltantes */}
      {missingFields.length > 0 && (
        <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: '#C62828', marginBottom: 8 }}>
              ⚠️ Campos no encontrados en el PDF (completa manualmente):
            </Text>
            <View style={styles.chips}>
              {missingFields.map((field) => (
                <Chip key={field} compact style={{ backgroundColor: '#FFCDD2' }}>{field}</Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Datos personales */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="Datos personales extraídos" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          <TextInput label="Nombre completo" value={data.name} onChangeText={(v) => setData({ ...data, name: v })} mode="outlined" style={styles.input} />
          <TextInput label="CURP" value={data.curp} onChangeText={(v) => setData({ ...data, curp: v })} mode="outlined" style={styles.input} autoCapitalize="characters" />
          <TextInput label="NSS (Número de Seguridad Social)" value={data.nss} onChangeText={(v) => setData({ ...data, nss: v })} mode="outlined" style={styles.input} keyboardType="numeric" />
          <TextInput label="Fecha de nacimiento (AAAA-MM-DD)" value={data.birthDate} onChangeText={(v) => setData({ ...data, birthDate: v })} mode="outlined" style={styles.input} />
        </Card.Content>
      </Card>

      {/* Datos de cotización */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Title title="Datos de cotización" titleVariant="titleMedium" />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          <TextInput
            label="Total de semanas cotizadas *"
            value={data.totalWeeks}
            onChangeText={(v) => setData({ ...data, totalWeeks: v })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="SBC promedio de las últimas 250 semanas (diario, MXN)"
            value={data.averageSBC}
            onChangeText={(v) => setData({ ...data, averageSBC: v })}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />
          {data.averageSBC !== '' ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: -8, marginBottom: 12 }}>
              ✓ Calculado a partir del historial detallado de modificaciones salariales de tus patrones. Verifícalo.
            </Text>
          ) : (
            <Text variant="bodySmall" style={{ color: '#C62828', marginTop: -8, marginBottom: 12 }}>
              ⚠️ Esta constancia no incluye el historial de modificaciones salariales necesario para calcularlo.
              Descarga la "Constancia de Semanas Cotizadas en el IMSS e Historial de Registros Afiliatorios de la
              Persona Asegurada" desde los servicios digitales del IMSS, o complétalo manualmente.
            </Text>
          )}
          <TextInput
            label="Último SBC registrado (solo referencia, no es el promedio)"
            value={data.lastSBC}
            onChangeText={(v) => setData({ ...data, lastSBC: v })}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 }}>
        ✏️ Revisa y corrige los datos extraídos. Los datos marcados con * son requeridos para el cálculo de la pensión.
      </Text>

      <Button mode="contained" onPress={confirmData} icon="check" style={styles.btn}>
        Confirmar y continuar
      </Button>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.btn}>
        Volver a importar
      </Button>

      {/* Debug temporal: texto crudo extraído del PDF, para diagnosticar
          fallas de extracción. Selecciona y copia el texto para reportarlo. */}
      <Button
        mode="text"
        onPress={() => setShowExtractedText((v) => !v)}
        style={styles.btn}
      >
        {showExtractedText ? 'Ocultar texto extraído (debug)' : 'Ver texto extraído (debug)'}
      </Button>
      {showExtractedText && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Card.Content>
            <Text selectable variant="bodySmall" style={{ color: theme.colors.onSurface, fontFamily: 'monospace' }}>
              {extractedText || '(vacío)'}
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 16 },
  input: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { marginBottom: 12, borderRadius: 8 },
});

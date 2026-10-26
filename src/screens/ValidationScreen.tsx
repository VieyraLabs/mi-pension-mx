/**
 * Pantalla de validación de datos importados desde PDF.
 * Permite al usuario revisar y corregir los datos extraídos.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, TextInput, useTheme, Divider, Chip, List } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ConstanciaIMSSParser } from '../services/pdf/parsers/PersonalDataParser';
import { DataRow } from '../components/DataRow';
import { formatCurrency, formatDateShort } from '../utils/format';
import type { ContributionSummary, SBCPeriod } from '../services/pension/history/types';
import { showAlert } from '../utils/alert';
import { getBannerColors } from '../theme';

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
  /** Detalle del SBC promedio reconstruido por el parser; null si la constancia no trae historial detallado. */
  const [sbcDetail, setSbcDetail] = useState<{ periods: SBCPeriod[]; summary: ContributionSummary } | null>(null);

  const warningColors = getBannerColors('warning', theme.dark);
  const errorColors = getBannerColors('error', theme.dark);

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
      // Se muestra tal cual lo calculó el parser (misma fuente de verdad que averageSBC);
      // la UI nunca recalcula el promedio.
      setSbcDetail(
        d.sbcPeriods && d.sbcPeriods.length > 0 && d.contributionSummary
          ? { periods: d.sbcPeriods, summary: d.contributionSummary }
          : null,
      );
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
        <Card style={[styles.card, { backgroundColor: warningColors.background }]} elevation={0}>
          <Card.Title title="Notas de extracción" titleVariant="titleSmall" />
          <Card.Content>
            {warnings.map((warning, i) => (
              <Text key={i} variant="bodySmall" style={{ color: warningColors.text, lineHeight: 18, marginBottom: 4 }}>
                • {warning}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Campos faltantes */}
      {missingFields.length > 0 && (
        <Card style={[styles.card, { backgroundColor: errorColors.background }]} elevation={0}>
          <Card.Content>
            <Text variant="labelSmall" style={{ color: errorColors.text, marginBottom: 8 }}>
              ⚠️ Campos no encontrados en el PDF (completa manualmente):
            </Text>
            <View style={styles.chips}>
              {missingFields.map((field) => (
                <Chip
                  key={field}
                  compact
                  style={{ backgroundColor: theme.colors.errorContainer }}
                  textStyle={{ color: theme.colors.onErrorContainer }}
                >
                  {field}
                </Chip>
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
            <Text variant="bodySmall" style={{ color: errorColors.text, marginTop: -8, marginBottom: 12 }}>
              ⚠️ Esta constancia no incluye el historial de modificaciones salariales necesario para calcularlo.
              Descarga la "Constancia de Semanas Cotizadas en el IMSS e Historial de Registros Afiliatorios de la
              Persona Asegurada" desde los servicios digitales del IMSS, o complétalo manualmente.
            </Text>
          )}
          {sbcDetail && (
            <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: -4, marginBottom: 12 }}>
              ↓ Despliega «Cómo se calculó tu SBC promedio» para auditar cómo se obtuvo este valor. Puedes corregirlo manualmente si lo deseas.
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

      {/* Desglose auditable del SBC promedio reconstruido (solo con historial detallado) */}
      {sbcDetail && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <List.Accordion
            title={`Cómo se calculó tu SBC promedio (${sbcDetail.periods.length} ${sbcDetail.periods.length === 1 ? 'periodo' : 'periodos'})`}
            description={`${formatCurrency(sbcDetail.summary.averageSalary)}/día · ${sbcDetail.summary.selectedWeeks} de 250 semanas`}
          >
            <List.Subheader style={styles.sectionLabel}>Periodos SBC considerados en el promedio</List.Subheader>
            {sbcDetail.periods.map((period, i) => (
              <DataRow
                key={`${period.startDate.getTime()}-${i}`}
                label={`${formatDateShort(period.startDate)} – ${formatDateShort(period.endDate)}`}
                value={`${formatCurrency(period.sbc)}/día`}
                theme={theme}
              />
            ))}
            <Divider style={styles.innerDivider} />
            <List.Subheader style={styles.sectionLabel}>Resumen de las últimas 250 semanas cotizadas</List.Subheader>
            <DataRow
              label="Semanas usadas en el promedio"
              value={`${sbcDetail.summary.selectedWeeks} de 250`}
              theme={theme}
              highlight
            />
            <DataRow
              label="Semanas cotizadas del historial"
              value={String(sbcDetail.summary.contributedWeeks)}
              theme={theme}
            />
            <DataRow
              label="Semanas omitidas (huecos sin patrón)"
              value={String(sbcDetail.summary.skippedWeeks)}
              theme={theme}
            />
            <DataRow
              label="Ventana de fechas usada"
              value={`${formatDateShort(sbcDetail.summary.firstWeekUsed)} – ${formatDateShort(sbcDetail.summary.lastWeekUsed)}`}
              theme={theme}
            />
            {(!sbcDetail.summary.isComplete || sbcDetail.summary.skippedWeeks > 0) && (
              <View style={[styles.partialBanner, { backgroundColor: warningColors.background }]}>
                {!sbcDetail.summary.isComplete && (
                  <Text variant="bodySmall" style={{ color: warningColors.text, lineHeight: 18 }}>
                    ⚠️ Reconstrucción parcial: tu historial solo registra {sbcDetail.summary.contributedWeeks} semanas cotizadas de las 250 que exige el cálculo; el promedio se obtuvo con las disponibles.
                  </Text>
                )}
                {sbcDetail.summary.skippedWeeks > 0 && (
                  <Text variant="bodySmall" style={{ color: warningColors.text, lineHeight: 18 }}>
                    Se omitieron {sbcDetail.summary.skippedWeeks} semanas sin cotización (periodos sin patrón); no cuentan para el promedio.
                  </Text>
                )}
              </View>
            )}
          </List.Accordion>
        </Card>
      )}

      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 }}>
        ✏️ Revisa y corrige los datos extraídos. Los datos marcados con * son requeridos para el cálculo de la pensión.
      </Text>

      <Button mode="contained" onPress={confirmData} icon="check" style={styles.btn}>
        Confirmar y continuar
      </Button>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.btn}>
        Volver a importar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 16 },
  sectionLabel: { marginTop: 4 },
  innerDivider: { marginVertical: 8 },
  partialBanner: { borderRadius: 8, padding: 12, marginTop: 8, gap: 4 },
  input: { marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { marginBottom: 12, borderRadius: 8 },
});

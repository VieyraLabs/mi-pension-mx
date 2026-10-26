/**
 * Paso 2 del formulario de nueva simulación: historial laboral.
 *
 * Los mensajes de semanas narran las MISMAS cifras que usa el motor: las
 * semanas ya cotizadas más las proyectadas hasta la edad de retiro (el total
 * con el que se jubila el asegurado, Arts. 138 y 145 LSS 1973). La
 * proyección la recibe ya calculada: la UI no recalcula (RNF-013).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, HelperText } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { WorkHistory } from '../models';
import { describeWeeksProjection } from '../utils/weeksProjection';
import type { WeeksProjection } from '../utils/weeksProjection';
import { MINIMUM_WEEKS_VEJEZ } from '../constants/ley73';

export interface WorkHistoryStepProps {
  workHistory: WorkHistory;
  /** Proyección de semanas hasta la edad de retiro (la calcula el formulario). */
  weeksProjection: WeeksProjection;
  /** Edad a la que se jubila el asegurado, para narrar el horizonte. */
  retirementAge: number;
  onChange: (history: Partial<WorkHistory>) => void;
  theme: MD3Theme;
}

export function WorkHistoryStep({
  workHistory,
  weeksProjection,
  retirementAge,
  onChange,
  theme,
}: WorkHistoryStepProps) {
  const weeks = workHistory.totalWeeks;
  // El desglose es el MISMO que narra el motor (Art. 167 LSS 1973): las
  // semanas cotizadas hoy más las proyectadas hasta la edad de retiro.
  const { currentWeeks, projectedWeeks, targetWeeks, m40ExtraWeeks, parts } =
    describeWeeksProjection(weeksProjection, retirementAge);
  const meetsMinimum = targetWeeks >= MINIMUM_WEEKS_VEJEZ;

  const mensaje = meetsMinimum
    ? `✓ Al jubilarte tendrás ${targetWeeks} semanas (${parts.join(' + ')}). ` +
      `Cumples el mínimo de ${MINIMUM_WEEKS_VEJEZ} semanas (Arts. 138 y 145 LSS 1973).`
    : `⚠️ Mínimo requerido: ${MINIMUM_WEEKS_VEJEZ} semanas (Arts. 138 y 145 LSS 1973). ` +
      `Te faltan ${MINIMUM_WEEKS_VEJEZ - targetWeeks} semanas para jubilarte: hoy tienes ${currentWeeks} ` +
      `y se proyectan ${projectedWeeks} hasta los ${retirementAge} años` +
      (m40ExtraWeeks > 0 ? ` y ${m40ExtraWeeks} planeadas en Modalidad 40` : '') +
      '.';

  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Historial laboral
        </Text>
        <TextInput
          label="Total de semanas cotizadas *"
          value={weeks > 0 ? String(weeks) : ''}
          onChangeText={(v) => {
            const n = parseInt(v);
            if (!isNaN(n)) onChange({ totalWeeks: n });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type={meetsMinimum ? 'info' : 'error'}>{mensaje}</HelperText>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Puedes verificar tus semanas cotizadas en el portal del IMSS (imss.gob.mx) con tu NSS.
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
});

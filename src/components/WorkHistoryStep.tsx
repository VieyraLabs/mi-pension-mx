/**
 * Paso 2 del formulario de nueva simulación: historial laboral.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, HelperText } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { WorkHistory } from '../models';
import { MINIMUM_WEEKS_VEJEZ, WEEKS_PER_YEAR } from '../constants/ley73';

export interface WorkHistoryStepProps {
  workHistory: WorkHistory;
  onChange: (history: Partial<WorkHistory>) => void;
  theme: MD3Theme;
}

export function WorkHistoryStep({ workHistory, onChange, theme }: WorkHistoryStepProps) {
  const weeks = workHistory.totalWeeks;
  const meetsMinimum = weeks >= MINIMUM_WEEKS_VEJEZ;

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
        <HelperText type={meetsMinimum ? 'info' : 'error'}>
          {meetsMinimum
            ? `✓ Cumple el mínimo de 500 semanas. Excedentes: ${weeks - MINIMUM_WEEKS_VEJEZ} semanas (${Math.floor((weeks - MINIMUM_WEEKS_VEJEZ) / WEEKS_PER_YEAR)} años adicionales).`
            : `⚠️ Mínimo requerido: 500 semanas (Arts. 138 y 145 LSS 1973). Te faltan ${MINIMUM_WEEKS_VEJEZ - weeks} semanas.`}
        </HelperText>
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

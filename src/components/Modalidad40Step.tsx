/**
 * Paso 5 del formulario de nueva simulación: Modalidad 40 (opcional).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Switch } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { Modalidad40 } from '../models';

export interface Modalidad40StepProps {
  modalidad40: Modalidad40;
  onChange: (data: Partial<Modalidad40>) => void;
  theme: MD3Theme;
}

export function Modalidad40Step({ modalidad40, onChange, theme }: Modalidad40StepProps) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Modalidad 40 (opcional)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Art. 218 Reglamento LSS — permite cotizar voluntariamente con un SBC mayor para aumentar el promedio de las últimas 250 semanas.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Switch
            value={modalidad40.active}
            onValueChange={(v) => onChange({ active: v })}
          />
          <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>
            ¿Cotiza actualmente en Modalidad 40?
          </Text>
        </View>

        {modalidad40.active && (
          <>
            <TextInput
              label="Salario de cotización M40 (diario, MXN) *"
              value={String(modalidad40.contributionSalary ?? '')}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ contributionSalary: n }); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              label="Meses cotizando en M40 (estimado)"
              value={String(modalidad40.expectedMonths ?? '')}
              onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n)) onChange({ expectedMonths: n }); }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Incremento salarial anual esperado (%) — opcional"
              value={String(modalidad40.annualSalaryIncrease ?? '')}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ annualSalaryIncrease: n }); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
});

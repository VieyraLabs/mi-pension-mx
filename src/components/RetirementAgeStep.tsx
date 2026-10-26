/**
 * Paso 3 del formulario de nueva simulación: edad de retiro.
 *
 * La edad de retiro NO es un dato personal: es una decisión sobre cuándo se
 * jubila la persona usuaria. Por eso vive en su propio paso y no junto a los
 * datos personales.
 *
 * La fecha estimada de retiro la calcula el formulario (`usePensionForm`): la
 * UI solo la muestra, no la recalcula (RNF-013).
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, HelperText } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { PersonalData } from '../models';
import { formatDateLong } from '../utils/format';

export interface RetirementAgeStepProps {
  personalData: PersonalData;
  onChange: (data: Partial<PersonalData>) => void;
  theme: MD3Theme;
}

export function RetirementAgeStep({ personalData, onChange, theme }: RetirementAgeStepProps) {
  const fechaRetiro = personalData.estimatedRetirementDate;
  const hayFechaValida = fechaRetiro instanceof Date && !isNaN(fechaRetiro.getTime());

  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Edad de retiro
        </Text>
        <TextInput
          label="Edad de retiro (60–100 años) *"
          value={String(personalData.retirementAge)}
          onChangeText={(v) => {
            const n = parseInt(v);
            if (!isNaN(n)) onChange({ retirementAge: n });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          right={<TextInput.Affix text="años" />}
        />
        <HelperText type="info">
          60–64 = Cesantía en Edad Avanzada (con reducción). 65+ = Vejez (sin reducción).
        </HelperText>
        {hayFechaValida && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {`Fecha estimada de retiro: ${formatDateLong(fechaRetiro)}`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
});

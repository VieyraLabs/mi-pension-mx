/**
 * Paso 1 del formulario de nueva simulación: datos personales.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput, SegmentedButtons, HelperText } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { PersonalData } from '../models';
import { calculateAge } from '../utils/date';

export interface PersonalDataStepProps {
  personalData: PersonalData;
  onChange: (data: Partial<PersonalData>) => void;
  theme: MD3Theme;
}

export function PersonalDataStep({ personalData, onChange, theme }: PersonalDataStepProps) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
          Información personal
        </Text>
        <TextInput
          label="Nombre (opcional)"
          value={personalData.name ?? ''}
          onChangeText={(v) => onChange({ name: v })}
          mode="outlined"
          style={styles.input}
        />
        <Text variant="labelMedium" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
          Sexo *
        </Text>
        <SegmentedButtons
          value={personalData.sex}
          onValueChange={(v) => onChange({ sex: v as PersonalData['sex'] })}
          buttons={[
            { value: 'masculino', label: 'Masculino' },
            { value: 'femenino', label: 'Femenino' },
          ]}
          style={{ marginBottom: 16 }}
        />
        <TextInput
          label="Fecha de nacimiento (AAAA-MM-DD) *"
          value={personalData.birthDate?.toISOString().split('T')[0] ?? ''}
          onChangeText={(v) => {
            const d = new Date(v + 'T00:00:00');
            if (!isNaN(d.getTime())) onChange({ birthDate: d });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          placeholder="1965-01-15"
        />
        {personalData.birthDate && (
          <HelperText type="info">
            Edad actual: {calculateAge(personalData.birthDate)} años
          </HelperText>
        )}
        <TextInput
          label="Edad de retiro (60–65 años) *"
          value={String(personalData.retirementAge)}
          onChangeText={(v) => {
            const n = parseInt(v);
            if (!isNaN(n)) onChange({ retirementAge: n });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        <HelperText type="info">
          60–64 = Cesantía en Edad Avanzada (con reducción). 65+ = Vejez (sin reducción).
        </HelperText>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
});

/**
 * Paso 4 del formulario de nueva simulación: Modalidad 40 (opcional).
 * Comparte paso con la UMA.
 */
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, TextInput, Switch, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { MD3Theme } from 'react-native-paper';
import type { Modalidad40 } from '../models';
import { getBrandGradient, BRAND_ON_COLOR } from '../theme';

export interface Modalidad40StepProps {
  modalidad40: Modalidad40;
  onChange: (data: Partial<Modalidad40>) => void;
  theme: MD3Theme;
}

export function Modalidad40Step({
  modalidad40,
  onChange,
  theme,
}: Modalidad40StepProps) {
  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Modalidad 40 (opcional)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Art. 218 Reglamento LSS — permite cotizar voluntariamente con un SBC mayor para aumentar el promedio de las últimas 250 semanas.
        </Text>

        {/* Toda la fila es táctil: el switch solo es la tira pequeña. */}
        <TouchableOpacity
          onPress={() => onChange({ active: !modalidad40.active })}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={getBrandGradient(theme.dark)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.m40Toggle, modalidad40.active ? {} : { opacity: 0.55 }]}
          >
            <Text variant="bodyMedium" style={{ color: BRAND_ON_COLOR, fontWeight: 'bold', flex: 1 }}>
              {modalidad40.active ? '✓ Cotizando en Modalidad 40' : '¿Deseas cotizar en Modalidad 40? Toca aquí'}
            </Text>
            <Switch
              value={modalidad40.active}
              onValueChange={(v) => onChange({ active: v })}
            />
          </LinearGradient>
        </TouchableOpacity>

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
              editable={false}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <HelperText type="info" style={{ marginBottom: 12 }}>
              Se calcula automáticamente: M40 va del día 1 del mes siguiente a hoy hasta el último día del mes de retiro, ambos inclusive.
            </HelperText>
            <TextInput
              label="Incremento salarial anual esperado (%) — opcional"
              value={String(modalidad40.annualSalaryIncrease ?? '')}
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange({ annualSalaryIncrease: n }); }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: -4, marginBottom: 8 }}>
              Ejemplo: si esperas que el salario de cotización M40 crezca ~5% cada año (por UMA o inflación), captura 5. Déjalo vacío para usar el mismo salario durante todo el periodo M40.
            </Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  input: { marginBottom: 12 },
  m40Toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
});

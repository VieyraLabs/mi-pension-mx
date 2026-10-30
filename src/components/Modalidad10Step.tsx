/**
 * Paso 4 del formulario de nueva simulación: Modalidad 10
 * (incorporación voluntaria al régimen obligatorio).
 *
 * Comparte paso con la UMA. Muestra el SBC declarado, su equivalente en UMAs,
 * si la persona sigue trabajando mientras cotiza, el costo mensual estimado y
 * los meses proyectados (derivados, no editables).
 */
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, HelperText, Switch, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { MD3Theme } from 'react-native-paper';
import type { Modalidad10 } from '../models';
import { BRAND_ON_COLOR, getBrandGradient } from '../theme';
import { formatCurrency, round2 } from '../utils/format';
import { calculateM10MonthlyCost, m10SalaryRange } from '../utils/modalidad10';
import { DataRow } from './DataRow';
import { UMAStepper } from './UMAStepper';

export interface Modalidad10StepProps {
  modalidad10: Modalidad10;
  /** Actualiza los campos generales (activación, incremento, si sigue trabajando). */
  onChange: (data: Partial<Modalidad10>) => void;
  /** Fija el SBC diario declarado. */
  onChangeSalary: (dailySalary: number) => void;
  /** Fija el número de UMAs. */
  onChangeUMAs: (umas: number) => void;
  /** UMA diaria vigente. */
  dailyUMA: number;
  /** Salario mínimo de referencia: Zona A (CDMX). */
  minimumDailySalary: number;
  theme: MD3Theme;
}

export function Modalidad10Step({
  modalidad10,
  onChange,
  onChangeSalary,
  onChangeUMAs,
  dailyUMA,
  minimumDailySalary,
  theme,
}: Modalidad10StepProps) {
  const range = m10SalaryRange(dailyUMA, minimumDailySalary);
  const salary = modalidad10.contributionSalary ?? range.minimumDailySalary;
  const umas = modalidad10.contributionSalaryInUMAs ?? range.minimumUMAs;
  const monthlyCost = calculateM10MonthlyCost(salary);
  const months = modalidad10.expectedMonths ?? 0;

  // El monto se escribe como lo captura la persona; el texto se sincroniza
  // cuando el valor cambia desde afuera.
  const [salaryDraft, setSalaryDraft] = useState(() => String(round2(salary)));
  useEffect(() => {
    if (Number.parseFloat(salaryDraft) === salary) return;
    setSalaryDraft(String(round2(salary)));
  }, [salary, salaryDraft]);

  const handleSalaryChangeText = (text: string) => {
    setSalaryDraft(text);
    const parsed = Number.parseFloat(text);
    if (!Number.isNaN(parsed)) onChangeSalary(parsed);
  };

  return (
    <Card style={styles.card} elevation={1}>
      <Card.Content>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
          Modalidad 10 (opcional)
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
          Art. 222 LSS vigente — incorporación voluntaria al régimen obligatorio: sigues
          cotizando con un SBC entre el salario mínimo de tu zona y 25 UMA.
        </Text>

        {/* Toda la fila es táctil: el switch solo es la tira pequeña. */}
        <TouchableOpacity
          onPress={() => onChange({ active: !modalidad10.active })}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={getBrandGradient(theme.dark)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.m10Toggle, modalidad10.active ? {} : { opacity: 0.55 }]}
          >
            <Text variant="bodyMedium" style={{ color: BRAND_ON_COLOR, fontWeight: 'bold', flex: 1 }}>
              {modalidad10.active ? '✓ Cotizando en Modalidad 10' : '¿Deseas cotizar en Modalidad 10? Toca aquí'}
            </Text>
            <Switch
              value={modalidad10.active}
              onValueChange={(v) => onChange({ active: v })}
            />
          </LinearGradient>
        </TouchableOpacity>

        {modalidad10.active && (
          <>
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <TextInput
                  label="Salario de cotización M10 (diario, MXN) *"
                  value={salaryDraft}
                  onChangeText={handleSalaryChangeText}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <UMAStepper
                  value={umas}
                  min={range.minimumUMAs}
                  max={range.maximumUMAs}
                  onChange={onChangeUMAs}
                />
              </View>
            </View>
            <HelperText type="info" style={{ marginBottom: 12 }}>
              Rango legal (Art. 28 LSS vigente): mínimo {formatCurrency(range.minimumDailySalary)}/día
              {' '}(salario mínimo de tu zona = {range.minimumUMAs} UMA) y máximo {range.maximumUMAs} UMA
              {' '}({formatCurrency(range.maximumDailySalary)}/día).
            </HelperText>

            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                ¿Continúas trabajando mientras citas en Modalidad 10?
              </Text>
              <Switch
                value={modalidad10.continuesWorkingWhileContributing ?? true}
                onValueChange={(v) => onChange({ continuesWorkingWhileContributing: v })}
              />
            </View>
            <HelperText type="info" style={{ marginBottom: 12 }}>
              {modalidad10.continuesWorkingWhileContributing ?? true
                ? 'Se suma tu último salario registrado al SBC de la Modalidad 10 en el SBC promedio proyectado.'
                : 'Solo se usa el salario de la Modalidad 10 en el SBC promedio proyectado.'}
            </HelperText>

            <DataRow
              label="Costo mensual estimado de la Modalidad 10"
              value={`${formatCurrency(monthlyCost)}/mes`}
              theme={theme}
              highlight
              prominent
            />
            <HelperText type="info" style={{ marginBottom: 12 }}>
              Estimado, sobre el SBC declarado y sin la aportación a INFONAVIT.
            </HelperText>

            <DataRow
              label="Meses cotizando en M10 (proyectados)"
              value={`${months} ${months === 1 ? 'mes' : 'meses'}`}
              theme={theme}
              highlight
              prominent
            />
            <HelperText type="info" style={{ marginBottom: 12 }}>
              M10 va del día 1 del mes siguiente a hoy hasta el último día del mes de retiro,
              ambos inclusive.
            </HelperText>

            <TextInput
              label="Incremento salarial anual esperado (%) — opcional"
              value={
                modalidad10.annualSalaryIncrease != null
                  ? String(modalidad10.annualSalaryIncrease)
                  : ''
              }
              onChangeText={(v) => {
                const n = parseFloat(v);
                if (!isNaN(n)) onChange({ annualSalaryIncrease: n });
              }}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: -4, marginBottom: 8 }}>
              Ejemplo: si esperas que el salario de cotización M10 crezca ~5% cada año…
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
  /** Fila con el SBC declarado y su equivalente en UMAs. */
  fieldRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  field: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  m10Toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
});

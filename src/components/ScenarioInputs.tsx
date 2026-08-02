/**
 * Campos de entrada de un escenario del simulador (usado en SimulatorScreen).
 */
import React from 'react';
import { TextInput } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export interface Scenario {
  retirementAge: string;
  dailySalary: string;
  totalWeeks: string;
  dailyUMA: string;
}

export interface ScenarioInputsProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

export function ScenarioInputs({ scenario, onChange }: ScenarioInputsProps) {
  return (
    <>
      <TextInput label="Edad retiro" value={scenario.retirementAge} onChangeText={(v) => onChange({ ...scenario, retirementAge: v })} mode="outlined" keyboardType="numeric" style={styles.input} dense />
      <TextInput label="Salario diario ($)" value={scenario.dailySalary} onChangeText={(v) => onChange({ ...scenario, dailySalary: v })} mode="outlined" keyboardType="decimal-pad" style={styles.input} dense />
      <TextInput label="Semanas cotizadas" value={scenario.totalWeeks} onChangeText={(v) => onChange({ ...scenario, totalWeeks: v })} mode="outlined" keyboardType="numeric" style={styles.input} dense />
      <TextInput label="UMA diaria ($)" value={scenario.dailyUMA} onChangeText={(v) => onChange({ ...scenario, dailyUMA: v })} mode="outlined" keyboardType="decimal-pad" style={styles.input} dense />
    </>
  );
}

const styles = StyleSheet.create({
  input: { marginBottom: 8 },
});

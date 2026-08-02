/**
 * Pantalla de nueva simulación — formulario por pasos (stepper).
 * Reúne todos los datos necesarios para calcular la pensión.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { usePensionForm } from '../hooks/usePensionForm';
import { calculatePension, validateInput } from '../services/pension/PensionCalculator';
import { useHistory } from '../hooks/useHistory';
import { showAlert } from '../utils/alert';
import { PersonalDataStep } from '../components/PersonalDataStep';
import { WorkHistoryStep } from '../components/WorkHistoryStep';
import { SalaryStep } from '../components/SalaryStep';
import { UMAStep } from '../components/UMAStep';
import { Modalidad40Step } from '../components/Modalidad40Step';
import { BeneficiariesStep } from '../components/BeneficiariesStep';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Props = NativeStackScreenProps<RootStackParamList, 'NewSimulation'>;

const STEPS = [
  'Datos personales',
  'Historial laboral',
  'Salario (SBC)',
  'UMA',
  'Modalidad 40',
  'Beneficiarios',
];

export default function NewSimulationScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const {
    input,
    updatePersonalData,
    updateWorkHistory,
    updateDailySalary,
    updateMonthlySalary,
    selectUMAByYear,
    setCustomUMA,
    updateModalidad40,
    updateBeneficiaries,
  } = usePensionForm();
  const { save } = useHistory();

  const [step, setStep] = useState(0);
  const [monthlySalaryMode, setMonthlySalaryMode] = useState(false);
  const [customUMA, setCustomUMAMode] = useState(false);
  const [preloadedFromPdf, setPreloadedFromPdf] = useState(false);
  const [preloadedSbcIsAverage, setPreloadedSbcIsAverage] = useState(false);

  // Precarga el formulario con los datos revisados en ValidationScreen
  // (importación de PDF). Solo corre una vez, al entrar a la pantalla.
  useEffect(() => {
    const importedData = route.params?.importedData;
    if (!importedData) return;

    const { name, sex, birthDate, totalWeeks, averageSBC } = importedData;

    const parsedBirthDate = birthDate ? new Date(birthDate + 'T00:00:00') : undefined;
    updatePersonalData({
      ...(name ? { name } : {}),
      ...(sex ? { sex } : {}),
      ...(parsedBirthDate && !isNaN(parsedBirthDate.getTime()) ? { birthDate: parsedBirthDate } : {}),
    });
    if (totalWeeks) {
      updateWorkHistory({ totalWeeks });
    }
    // Solo se precarga cuando hay un SBC promedio calculado con el historial
    // detallado de modificaciones salariales — el último SBC registrado no
    // es el promedio y no debe usarse como si lo fuera (ver ValidationScreen).
    if (averageSBC) {
      updateDailySalary(averageSBC);
      setPreloadedSbcIsAverage(true);
    }
    setPreloadedFromPdf(true);
    // Solo debe correr cuando cambian los datos importados de la ruta, no en cada render.
  }, [route.params?.importedData]);

  const goToStep = (n: number) => setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + n)));

  const calculate = async () => {
    const validation = validateInput(input);
    if (!validation.valid) {
      showAlert('Datos insuficientes', validation.errors.join('\n'));
      return;
    }
    const result = calculatePension(input);
    const saved = await save(result, input.personalData.name ?? 'Simulación');
    navigation.navigate('Result', { simulationId: saved.id });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <PersonalDataStep personalData={input.personalData} onChange={updatePersonalData} theme={theme} />;
      case 1:
        return <WorkHistoryStep workHistory={input.workHistory} onChange={updateWorkHistory} theme={theme} />;
      case 2:
        return (
          <SalaryStep
            averageSalary={input.averageSalary}
            onChangeDaily={updateDailySalary}
            onChangeMonthly={updateMonthlySalary}
            monthlyMode={monthlySalaryMode}
            setMonthlyMode={setMonthlySalaryMode}
            theme={theme}
          />
        );
      case 3:
        return (
          <UMAStep
            uma={input.uma}
            onSelectYear={selectUMAByYear}
            onCustomize={setCustomUMA}
            isCustom={customUMA}
            setIsCustom={setCustomUMAMode}
            theme={theme}
          />
        );
      case 4:
        return <Modalidad40Step modalidad40={input.modalidad40} onChange={updateModalidad40} theme={theme} />;
      case 5:
        return <BeneficiariesStep beneficiaries={input.beneficiaries} onChange={updateBeneficiaries} theme={theme} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Indicador de progreso */}
      <View style={[styles.stepIndicator, { backgroundColor: theme.colors.surface }]}>
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </Text>
        <View style={styles.stepDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                { backgroundColor: i <= step ? theme.colors.primary : theme.colors.outline },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {preloadedFromPdf && (
          <Card style={[styles.card, { backgroundColor: '#E3F2FD', marginBottom: 16 }]} elevation={0}>
            <Card.Content>
              <Text variant="bodySmall" style={{ color: '#1565C0', lineHeight: 18 }}>
                📄 Este formulario se precargó con los datos de tu constancia IMSS. Revisa cada paso —
                {preloadedSbcIsAverage
                  ? ' el SBC es un promedio calculado a partir del historial detallado de modificaciones salariales de tus patrones; verifícalo.'
                  : ' tu constancia no incluía el historial de modificaciones salariales necesario para calcular el SBC promedio, así que ese campo quedó en blanco. Complétalo manualmente.'}
              </Text>
            </Card.Content>
          </Card>
        )}
        {renderStep()}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <Button
          mode="outlined"
          onPress={() => goToStep(-1)}
          disabled={step === 0}
          style={styles.btn}
        >
          Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button mode="contained" onPress={() => goToStep(1)} style={styles.btn}>
            Siguiente
          </Button>
        ) : (
          <Button mode="contained" onPress={calculate} style={styles.btn} icon="calculator">
            Calcular Pensión
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepIndicator: { padding: 16, alignItems: 'center', elevation: 2 },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: { borderRadius: 12 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  btn: { flex: 1 },
});

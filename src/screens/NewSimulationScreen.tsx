/**
 * Pantalla de nueva simulación — formulario por pasos (stepper).
 * Reúne todos los datos necesarios para calcular la pensión.
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { usePensionForm } from '../hooks/usePensionForm';
import { StepProgress } from '../components/StepProgress';
import { calculatePension, validateInput } from '../services/pension/PensionCalculator';
import { useHistory } from '../hooks/useHistory';
import { showAlert } from '../utils/alert';
import { MessageBanner } from '../components/MessageBanner';
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
      <StepProgress step={step} total={STEPS.length} label={STEPS[step] ?? ''} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {preloadedFromPdf && (
          <MessageBanner variant="info" style={[styles.card, { marginBottom: 16 }]}>
            Este formulario se precargó con los datos de tu constancia IMSS. Revisa cada paso —
            {preloadedSbcIsAverage
              ? ' el SBC es un promedio calculado a partir del historial detallado de modificaciones salariales de tus patrones; verifícalo.'
              : ' tu constancia no incluía el historial de modificaciones salariales necesario para calcular el SBC promedio, así que ese campo quedó en blanco. Complétalo manualmente.'}
          </MessageBanner>
        )}
        {renderStep()}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
        <Button
          mode="outlined"
          onPress={() => goToStep(-1)}
          disabled={step === 0}
          style={styles.btn}
        >
          Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button mode="contained" onPress={() => goToStep(1)} style={[styles.btn, styles.primaryBtn]} icon="arrow-right">
            Siguiente
          </Button>
        ) : (
          <Button mode="contained" onPress={calculate} style={[styles.btn, styles.primaryBtn]} icon="calculator">
            Calcular Pensión
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: { borderRadius: 16 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  btn: { flex: 1 },
  primaryBtn: { borderRadius: 12 },
});

/**
 * Hook para manejar el estado del formulario de nueva simulación.
 * Mantiene el estado completo del PensionInput entre los pasos del stepper.
 */
import { useState, useCallback, useMemo } from 'react';
import type {
  PensionInput,
  PersonalData,
  WorkHistory,
  Modalidad40,
  Beneficiaries,
} from '../models';
import { UMA_ACTUAL, calculateUMAFromDailyValue, getUMAByYear } from '../constants/uma';
import { calculateAge, calculateRetirementDate } from '../utils/date';
import { dailyToMonthly, monthlyToDaily } from '../utils/format';
import { calculateM40PlannedWeeks } from '../utils/modalidad40';
import { calculateWeeksProjection, estimateMonthsToRetirement } from '../utils/weeksProjection';

/** Fecha de nacimiento por defecto del formulario. */
const DEFAULT_BIRTH_DATE = new Date(1965, 0, 1);

/** Rango de meses de Modalidad 40 aceptado por el esquema (Zod). */
const M40_MIN_MONTHS = 1;
const M40_MAX_MONTHS = 600;

/** Acota los meses de Modalidad 40 al rango que acepta el esquema (Zod). */
function clampM40Months(months: number): number {
  return Math.min(M40_MAX_MONTHS, Math.max(M40_MIN_MONTHS, Math.round(months)));
}

/**
 * Meses de Modalidad 40 DERIVADOS del horizonte hasta la fecha de retiro.
 *
 * El campo no es editable (decisión de la persona usuaria): su valor siempre
 * sale de los meses que faltan entre hoy y la fecha de retiro, de modo que
 * nunca queda desactualizado frente a la edad o la edad de retiro.
 *
 * El horizonte se acota al rango que acepta el esquema (Zod): 1..600 meses.
 * - Si ya está en la edad de retiro el horizonte es 0 y se usa 1 (el esquema
 *   no admite 0 meses).
 * - Si el horizonte supera los 50 años (600 meses) que admite el esquema se
 *   acota a 600: el esquema no acepta más y la cifra sigue siendo una
 *   estimación del horizonte, no un dato cotizado.
 */
function expectedMonthsForHorizon(personalData: PersonalData): number {
  return clampM40Months(
    estimateMonthsToRetirement(personalData.age, personalData.retirementAge),
  );
}

const INITIAL_STATE: PensionInput = {
  personalData: {
    sex: 'masculino',
    birthDate: DEFAULT_BIRTH_DATE,
    // La edad real evita que la proyección de semanas hasta el retiro se
    // calcule sobre un horizonte inflado (por ejemplo, 65 años).
    age: calculateAge(DEFAULT_BIRTH_DATE),
    estimatedRetirementDate: calculateRetirementDate(DEFAULT_BIRTH_DATE, 65),
    retirementAge: 65,
  },
  workHistory: {
    totalWeeks: 0,
    employmentRelations: [],
  },
  averageSalary: {
    dailySalary: 0,
    monthlySalary: 0,
    isManual: true,
  },
  uma: {
    dailyUMA: UMA_ACTUAL.dailyUMA,
    monthlyUMA: UMA_ACTUAL.monthlyUMA,
    annualUMA: UMA_ACTUAL.annualUMA,
    year: UMA_ACTUAL.year,
    isCustom: false,
  },
  modalidad40: {
    active: false,
  },
  beneficiaries: {
    hasSpouse: false,
    hasMinorChildren: false,
    numberOfMinorChildren: 0,
    hasDependentParents: false,
    numberOfDependentParents: 0,
  },
};

export function usePensionForm() {
  const [input, setInput] = useState<PensionInput>(INITIAL_STATE);

  const updatePersonalData = useCallback(
    (data: Partial<PersonalData>) => {
      setInput((prev) => {
        const newData = { ...prev.personalData, ...data };
        // Recalcular edad automáticamente si cambia la fecha de nacimiento
        if (data.birthDate) {
          newData.age = calculateAge(data.birthDate);
        }
        // Recalcular la fecha de retiro si cambia la fecha de nacimiento o la
        // edad de retiro (si no, la fecha queda desactualizada).
        if ((data.birthDate || data.retirementAge !== undefined) && newData.birthDate) {
          newData.estimatedRetirementDate = calculateRetirementDate(
            newData.birthDate,
            newData.retirementAge,
          );
        }
        // El campo de meses de Modalidad 40 es DERIVADO del horizonte (no es
        // editable): si está activa, su valor se recalcula con la edad y la
        // edad de retiro actuales.
        const modalidad40 = prev.modalidad40.active
          ? {
              ...prev.modalidad40,
              expectedMonths: expectedMonthsForHorizon(newData),
            }
          : prev.modalidad40;
        return { ...prev, personalData: newData, modalidad40 };
      });
    },
    [],
  );

  const updateWorkHistory = useCallback((history: Partial<WorkHistory>) => {
    setInput((prev) => ({
      ...prev,
      workHistory: { ...prev.workHistory, ...history },
    }));
  }, []);

  const updateDailySalary = useCallback((dailySalary: number) => {
    setInput((prev) => ({
      ...prev,
      averageSalary: {
        ...prev.averageSalary,
        dailySalary,
        monthlySalary: dailyToMonthly(dailySalary),
        isManual: true,
      },
    }));
  }, []);

  const updateMonthlySalary = useCallback((monthlySalary: number) => {
    setInput((prev) => ({
      ...prev,
      averageSalary: {
        ...prev.averageSalary,
        dailySalary: monthlyToDaily(monthlySalary),
        monthlySalary,
        isManual: true,
      },
    }));
  }, []);

  const selectUMAByYear = useCallback((year: number) => {
    const record = getUMAByYear(year);
    if (record) {
      setInput((prev) => ({
        ...prev,
        uma: {
          dailyUMA: record.dailyUMA,
          monthlyUMA: record.monthlyUMA,
          annualUMA: record.annualUMA,
          year: record.year,
          isCustom: false,
        },
      }));
    }
  }, []);

  const setCustomUMA = useCallback((dailyUMA: number) => {
    const values = calculateUMAFromDailyValue(dailyUMA);
    setInput((prev) => ({
      ...prev,
      uma: {
        ...values,
        year: new Date().getFullYear(),
        isCustom: true,
      },
    }));
  }, []);

  const updateModalidad40 = useCallback((m40: Partial<Modalidad40>) => {
    setInput((prev) => {
      const modalidad40 = { ...prev.modalidad40, ...m40 };
      // El campo de meses es DERIVADO del horizonte hasta la fecha de retiro:
      // no es editable, así que su valor siempre se recalcula (y se borra si
      // Modalidad 40 se desactiva).
      modalidad40.expectedMonths = modalidad40.active
        ? expectedMonthsForHorizon(prev.personalData)
        : undefined;
      return { ...prev, modalidad40 };
    });
  }, []);

  /**
   * Proyección de semanas hasta la edad de retiro (ya cotizadas + proyectadas).
   * La calcula el formulario con la MISMA función que usa el motor, para que
   * la UI narre las mismas cifras sin recalcular nada (RNF-013).
   */
  const weeksProjection = useMemo(
    () =>
      calculateWeeksProjection({
        currentWeeks: input.workHistory.totalWeeks,
        age: input.personalData.age,
        retirementAge: input.personalData.retirementAge,
        m40PlannedWeeks: calculateM40PlannedWeeks(input.modalidad40),
      }),
    [
      input.workHistory.totalWeeks,
      input.personalData.age,
      input.personalData.retirementAge,
      input.modalidad40,
    ],
  );

  const updateBeneficiaries = useCallback((beneficiaries: Partial<Beneficiaries>) => {
    setInput((prev) => ({
      ...prev,
      beneficiaries: { ...prev.beneficiaries, ...beneficiaries },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setInput(INITIAL_STATE);
  }, []);

  return {
    input,
    weeksProjection,
    updatePersonalData,
    updateWorkHistory,
    updateDailySalary,
    updateMonthlySalary,
    selectUMAByYear,
    setCustomUMA,
    updateModalidad40,
    updateBeneficiaries,
    resetForm,
  };
}

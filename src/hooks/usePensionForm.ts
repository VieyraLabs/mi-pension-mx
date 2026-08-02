/**
 * Hook para manejar el estado del formulario de nueva simulación.
 * Mantiene el estado completo del PensionInput entre los pasos del stepper.
 */
import { useState, useCallback } from 'react';
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

const INITIAL_STATE: PensionInput = {
  personalData: {
    sex: 'masculino',
    birthDate: new Date(1965, 0, 1),
    age: 0,
    estimatedRetirementDate: new Date(),
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
        // Recalcular fecha de retiro si cambia la edad de retiro
        if (data.retirementAge !== undefined && newData.birthDate) {
          newData.estimatedRetirementDate = calculateRetirementDate(
            newData.birthDate,
            data.retirementAge,
          );
        }
        return { ...prev, personalData: newData };
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
    setInput((prev) => ({
      ...prev,
      modalidad40: { ...prev.modalidad40, ...m40 },
    }));
  }, []);

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

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
import { calculateM40PlannedWeeks, estimateM40Months } from '../utils/modalidad40';
import {
  calculateWeeksProjection,
  getLocalReferenceDate,
} from '../utils/weeksProjection';

/**
 * Fecha de nacimiento por defecto del formulario.
 *
 * Exportada para que los campos de fecha de nacimiento (`PersonalDataStep`,
 * `ValidationScreen`) abran su calendario en la misma fecha que precarga el
 * formulario cuando aún no hay una fecha válida.
 */
export const DEFAULT_BIRTH_DATE = new Date(1965, 0, 1);

/** Rango de meses de Modalidad 40 aceptado por el esquema (Zod). */
const M40_MAX_MONTHS = 600;

/** Acota los meses M40 a su máximo contractual vigente, permitiendo cero. */
function clampM40Months(months: number): number {
  return Math.min(M40_MAX_MONTHS, months);
}

/**
 * Meses de Modalidad 40 DERIVADOS de los meses contractuales entre la
 * referencia local y la fecha exacta de retiro. El valor cero es válido cuando
 * no hay un mes M40 completo por delante.
 */
function expectedMonthsForHorizon(referenceDate: Date, personalData: PersonalData): number {
  return clampM40Months(estimateM40Months(referenceDate, personalData.estimatedRetirementDate));
}

const INITIAL_STATE: PensionInput = {
  personalData: {
    sex: 'masculino',
    birthDate: DEFAULT_BIRTH_DATE,
    // La edad se conserva como metadato; las semanas futuras usan la fecha de retiro exacta.
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
  const referenceDate = getLocalReferenceDate();

  const updatePersonalData = useCallback(
    (data: Partial<PersonalData>) => {
      const updateReferenceDate = getLocalReferenceDate();
      setInput((prev) => {
        const newData = { ...prev.personalData, ...data };
        // Recalcular edad automáticamente si cambia la fecha de nacimiento
        if (data.birthDate) {
          newData.age = calculateAge(data.birthDate, updateReferenceDate);
        }
        // Recalcular la fecha de retiro si cambia la fecha de nacimiento o la
        // edad de retiro (si no, la fecha queda desactualizada).
        if ((data.birthDate || data.retirementAge !== undefined) && newData.birthDate) {
          newData.estimatedRetirementDate = calculateRetirementDate(
            newData.birthDate,
            newData.retirementAge,
          );
        }
        // Los meses M40 se derivan de la fecha exacta de retiro y se
        // recalculan cuando cambie esa fecha.
        const modalidad40 = prev.modalidad40.active
          ? {
              ...prev.modalidad40,
              expectedMonths: expectedMonthsForHorizon(updateReferenceDate, newData),
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
    const referenceDate = getLocalReferenceDate();
    setInput((prev) => {
      const modalidad40 = { ...prev.modalidad40, ...m40 };
      // Los meses contractuales se derivan de la fecha exacta de retiro y se
      // borran si Modalidad 40 se desactiva.
      modalidad40.expectedMonths = modalidad40.active
        ? expectedMonthsForHorizon(referenceDate, prev.personalData)
        : undefined;
      return { ...prev, modalidad40 };
    });
  }, []);

  /**
   * Proyección de semanas hasta la fecha exacta de retiro (ya cotizadas + proyectadas).
   * La calcula el formulario con la MISMA función que usa el motor, para que
   * la UI narre las mismas cifras sin recalcular nada (RNF-013).
   */
  const weeksProjection = useMemo(
    () =>
      calculateWeeksProjection({
        currentWeeks: input.workHistory.totalWeeks,
        age: input.personalData.age,
        retirementAge: input.personalData.retirementAge,
        referenceDate,
        retirementDate: input.personalData.estimatedRetirementDate,
        m40PlannedWeeks: input.modalidad40.active
          ? calculateM40PlannedWeeks(referenceDate, input.personalData.estimatedRetirementDate)
          : 0,
      }),
    [
      input.workHistory.totalWeeks,
      input.personalData.age,
      input.personalData.retirementAge,
      input.personalData.estimatedRetirementDate.getTime(),
      input.modalidad40.active,
      referenceDate.getTime(),
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

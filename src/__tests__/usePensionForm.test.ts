/**
 * Pruebas del hook usePensionForm (estado del formulario de nueva simulación).
 *
 * Para ejecutar: npm test
 */
import { renderHook, act } from '@testing-library/react-native';
import { usePensionForm } from '../hooks/usePensionForm';
import { calculateAge, calculateRetirementDate } from '../utils/date';
import { estimateMonthsToRetirement } from '../utils/weeksProjection';
import { calculatePension } from '../services/pension/PensionCalculator';

describe('usePensionForm', () => {
  test('inicia con el estado por defecto (65 años, sin beneficiarios)', () => {
    const { result } = renderHook(() => usePensionForm());

    expect(result.current.input.personalData.retirementAge).toBe(65);
    expect(result.current.input.workHistory.totalWeeks).toBe(0);
    expect(result.current.input.beneficiaries.hasSpouse).toBe(false);
  });

  test('el estado inicial ya trae la edad real de la fecha de nacimiento', () => {
    const { result } = renderHook(() => usePensionForm());

    const { birthDate, age, estimatedRetirementDate } = result.current.input.personalData;
    // Con `age: 0` la proyección de semanas hasta el retiro quedaba inflada
    // a 65 años de horizonte.
    expect(age).toBe(calculateAge(birthDate));
    expect(age).toBeGreaterThan(0);
    expect(estimatedRetirementDate).toEqual(
      calculateRetirementDate(birthDate, result.current.input.personalData.retirementAge),
    );
  });

  test('updatePersonalData recalcula la edad al cambiar la fecha de nacimiento', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ birthDate: new Date(1960, 0, 1) });
    });

    expect(result.current.input.personalData.age).toBeGreaterThan(0);
    expect(result.current.input.personalData.birthDate).toEqual(new Date(1960, 0, 1));
  });

  test('updatePersonalData recalcula la fecha de retiro al cambiar la edad de retiro', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ birthDate: new Date(1960, 0, 1) });
    });
    act(() => {
      result.current.updatePersonalData({ retirementAge: 60 });
    });

    expect(result.current.input.personalData.retirementAge).toBe(60);
    expect(result.current.input.personalData.estimatedRetirementDate.getFullYear()).toBe(2020);
  });

  test('updatePersonalData recalcula la fecha de retiro al cambiar la fecha de nacimiento', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ birthDate: new Date(1960, 0, 1) });
    });

    const { birthDate, retirementAge, estimatedRetirementDate } = result.current.input.personalData;
    expect(estimatedRetirementDate).toEqual(calculateRetirementDate(birthDate, retirementAge));
  });

  test('updateWorkHistory actualiza las semanas cotizadas', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateWorkHistory({ totalWeeks: 800 });
    });

    expect(result.current.input.workHistory.totalWeeks).toBe(800);
  });

  test('updateDailySalary actualiza el salario diario y su equivalente mensual', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateDailySalary(300);
    });

    expect(result.current.input.averageSalary.dailySalary).toBe(300);
    expect(result.current.input.averageSalary.monthlySalary).toBeCloseTo(300 * 30.4, 1);
  });

  test('updateMonthlySalary actualiza el salario mensual y su equivalente diario', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateMonthlySalary(9120);
    });

    expect(result.current.input.averageSalary.monthlySalary).toBe(9120);
    expect(result.current.input.averageSalary.dailySalary).toBeCloseTo(300, 1);
  });

  test('selectUMAByYear actualiza la configuración de UMA para un año válido', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.selectUMAByYear(2023);
    });

    expect(result.current.input.uma.year).toBe(2023);
    expect(result.current.input.uma.isCustom).toBe(false);
  });

  test('selectUMAByYear no cambia nada para un año sin registro', () => {
    const { result } = renderHook(() => usePensionForm());
    const before = result.current.input.uma;

    act(() => {
      result.current.selectUMAByYear(1999);
    });

    expect(result.current.input.uma).toEqual(before);
  });

  test('setCustomUMA marca la UMA como personalizada', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.setCustomUMA(120);
    });

    expect(result.current.input.uma.dailyUMA).toBe(120);
    expect(result.current.input.uma.isCustom).toBe(true);
  });

  test('updateModalidad40 actualiza los campos de Modalidad 40', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateModalidad40({ active: true, contributionSalary: 500 });
    });

    expect(result.current.input.modalidad40.active).toBe(true);
    expect(result.current.input.modalidad40.contributionSalary).toBe(500);
  });

  test('updateModalidad40 precarga los meses esperados al activar Modalidad 40', () => {
    const { result } = renderHook(() => usePensionForm());

    const { age, retirementAge } = result.current.input.personalData;
    const mesesEsperados = Math.max(1, estimateMonthsToRetirement(age, retirementAge));

    act(() => {
      result.current.updateModalidad40({ active: true, contributionSalary: 500 });
    });

    expect(result.current.input.modalidad40.expectedMonths).toBe(mesesEsperados);
  });

  test('al desactivar Modalidad 40 se borran los meses esperados', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateModalidad40({ active: true });
    });
    act(() => {
      result.current.updateModalidad40({ active: false });
    });

    expect(result.current.input.modalidad40.active).toBe(false);
    // El campo es derivado (no editable): sin Modalidad 40 no hay meses que
    // cotizar en M40, así que no queda valor.
    expect(result.current.input.modalidad40.expectedMonths).toBeUndefined();
  });

  test('al activar Modalidad 40 los meses se derivan del horizonte hasta la edad de retiro', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });

    expect(result.current.input.modalidad40.expectedMonths).toBe(
      estimateMonthsToRetirement(40, 65),
    );
    expect(result.current.input.modalidad40.expectedMonths).toBe(25 * 12);
  });

  test('al cambiar la edad con Modalidad 40 activa los meses se recalculan', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });
    act(() => {
      result.current.updatePersonalData({ age: 50 });
    });

    expect(result.current.input.modalidad40.expectedMonths).toBe(
      estimateMonthsToRetirement(50, 65),
    );
  });

  test('al cambiar la edad de retiro con Modalidad 40 activa los meses se recalculan', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });
    act(() => {
      result.current.updatePersonalData({ retirementAge: 60 });
    });

    expect(result.current.input.modalidad40.expectedMonths).toBe(
      estimateMonthsToRetirement(40, 60),
    );
  });

  test('los meses esperados no se pueden editar a mano: siempre derivan del horizonte', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });
    act(() => {
      result.current.updateModalidad40({ expectedMonths: 12 });
    });

    expect(result.current.input.modalidad40.expectedMonths).toBe(
      estimateMonthsToRetirement(40, 65),
    );
  });

  test('acota a 600 meses cuando el horizonte supera los 50 años que admite el esquema', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 10, retirementAge: 65 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });

    // 55 años de horizonte = 660 meses, pero el esquema (Zod) admite 1..600.
    expect(estimateMonthsToRetirement(10, 65)).toBe(660);
    expect(result.current.input.modalidad40.expectedMonths).toBe(600);
  });

  test('expone la proyección de semanas para que la UI no la recalcule', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateWorkHistory({ totalWeeks: 100 });
    });

    expect(result.current.weeksProjection.currentWeeks).toBe(100);
    expect(result.current.weeksProjection.projectedWeeks).toBe(25 * 52);
    expect(result.current.weeksProjection.targetWeeks).toBe(100 + 25 * 52);
    expect(result.current.weeksProjection.yearsToRetirement).toBe(25);
  });

  test('la proyección del formulario es la MISMA que la del motor', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ age: 40, retirementAge: 65 });
    });
    act(() => {
      result.current.updateWorkHistory({ totalWeeks: 100 });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });

    // La UI narra las cifras que el motor ya calculó (RNF-013).
    const motor = calculatePension(result.current.input);
    expect(result.current.weeksProjection).toEqual(motor.weeksProjection);
  });

  test('los meses de Modalidad 40 se actualizan al cambiar la edad de retiro', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updatePersonalData({ birthDate: new Date(1980, 0, 1) });
    });
    act(() => {
      result.current.updateModalidad40({ active: true });
    });
    act(() => {
      result.current.updatePersonalData({ retirementAge: 60 });
    });

    const { age, retirementAge } = result.current.input.personalData;
    expect(result.current.input.modalidad40.expectedMonths).toBe(
      Math.max(1, estimateMonthsToRetirement(age, retirementAge)),
    );
  });

  test('updateBeneficiaries actualiza los beneficiarios', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateBeneficiaries({ hasSpouse: true });
    });

    expect(result.current.input.beneficiaries.hasSpouse).toBe(true);
  });

  test('resetForm restaura el estado inicial', () => {
    const { result } = renderHook(() => usePensionForm());

    act(() => {
      result.current.updateWorkHistory({ totalWeeks: 800 });
    });
    expect(result.current.input.workHistory.totalWeeks).toBe(800);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.input.workHistory.totalWeeks).toBe(0);
  });
});

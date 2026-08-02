/**
 * Pruebas del hook usePensionForm (estado del formulario de nueva simulación).
 *
 * Para ejecutar: npm test
 */
import { renderHook, act } from '@testing-library/react-native';
import { usePensionForm } from '../hooks/usePensionForm';

describe('usePensionForm', () => {
  test('inicia con el estado por defecto (65 años, sin beneficiarios)', () => {
    const { result } = renderHook(() => usePensionForm());

    expect(result.current.input.personalData.retirementAge).toBe(65);
    expect(result.current.input.workHistory.totalWeeks).toBe(0);
    expect(result.current.input.beneficiaries.hasSpouse).toBe(false);
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

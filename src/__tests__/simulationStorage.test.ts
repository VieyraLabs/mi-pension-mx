/**
 * Pruebas del almacenamiento local de simulaciones (AsyncStorage).
 *
 * Para ejecutar: npm test
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories run before imports are available
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSimulations,
  saveSimulation,
  deleteSimulation,
  clearHistory,
} from '../storage/simulationStorage';
import { calculatePension } from '../services/pension/PensionCalculator';
import type { PensionInput } from '../models';

function buildResult() {
  const input: PensionInput = {
    personalData: {
      sex: 'masculino',
      birthDate: new Date(1960, 0, 1),
      age: 65,
      estimatedRetirementDate: new Date(2025, 0, 1),
      retirementAge: 65,
    },
    workHistory: { totalWeeks: 500, employmentRelations: [] },
    averageSalary: { dailySalary: 200, monthlySalary: 6080, isManual: true },
    uma: { dailyUMA: 113.14, monthlyUMA: 3439.46, annualUMA: 41296.1, year: 2025, isCustom: false },
    modalidad40: { active: false },
    beneficiaries: {
      hasSpouse: false,
      hasMinorChildren: false,
      numberOfMinorChildren: 0,
      hasDependentParents: false,
      numberOfDependentParents: 0,
    },
  };
  return calculatePension(input);
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getSimulations', () => {
  test('devuelve un arreglo vacío cuando no hay nada guardado', async () => {
    expect(await getSimulations()).toEqual([]);
  });

  test('devuelve un arreglo vacío si el valor guardado no es JSON válido', async () => {
    await AsyncStorage.setItem('@mi_prension_mx:simulaciones', 'esto no es JSON');
    expect(await getSimulations()).toEqual([]);
  });
});

describe('saveSimulation', () => {
  test('guarda una simulación y la devuelve con id y fecha generados', async () => {
    const saved = await saveSimulation(buildResult(), 'Mi simulación');
    expect(saved.id).toMatch(/^sim_/);
    expect(saved.name).toBe('Mi simulación');
    expect(new Date(saved.creationDate).toString()).not.toBe('Invalid Date');

    const all = await getSimulations();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(saved.id);
  });

  test('usa un nombre por defecto cuando no se especifica', async () => {
    const saved = await saveSimulation(buildResult());
    expect(saved.name).toContain('Simulación');
  });

  test('las simulaciones nuevas quedan primero', async () => {
    await saveSimulation(buildResult(), 'Primera');
    await saveSimulation(buildResult(), 'Segunda');

    const all = await getSimulations();
    expect(all[0]?.name).toBe('Segunda');
    expect(all[1]?.name).toBe('Primera');
  });

  test('conserva como máximo 20 simulaciones, descartando la más antigua', async () => {
    for (let i = 0; i < 21; i++) {
      await saveSimulation(buildResult(), `Sim ${i}`);
    }

    const all = await getSimulations();
    expect(all).toHaveLength(20);
    expect(all[0]?.name).toBe('Sim 20');
    expect(all.some((s) => s.name === 'Sim 0')).toBe(false);
  });
});

describe('deleteSimulation', () => {
  test('elimina solo la simulación con el id indicado', async () => {
    const a = await saveSimulation(buildResult(), 'A');
    const b = await saveSimulation(buildResult(), 'B');

    await deleteSimulation(a.id);

    const all = await getSimulations();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(b.id);
  });
});

describe('clearHistory', () => {
  test('elimina todas las simulaciones guardadas', async () => {
    await saveSimulation(buildResult(), 'A');
    await saveSimulation(buildResult(), 'B');

    await clearHistory();

    expect(await getSimulations()).toEqual([]);
  });
});

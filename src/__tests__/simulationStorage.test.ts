/**
 * Pruebas del almacenamiento local de simulaciones (AsyncStorage).
 *
 * Se usa un mock propio con store en memoria (mismas semánticas que el
 * paquete real: setItem guarda la cadena, getItem la devuelve o null) para
 * poder inyectar fallos puntuales con mockImplementationOnce sin mutar el
 * estado global entre tests.
 *
 * Para ejecutar: npm test
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => (key in store ? store[key] : null)),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = String(value);
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

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
    await AsyncStorage.setItem('@mi_pension_mx:simulaciones', 'esto no es JSON');
    expect(await getSimulations()).toEqual([]);
  });

  test('descarta registros de un esquema anterior en vez de crashear (p. ej. fechaCreacion en lugar de creationDate)', async () => {
    const registroAntiguo = {
      id: 'sim_viejo',
      name: 'Simulación vieja',
      fechaCreacion: '2023-01-01T00:00:00.000Z', // nombre de campo previo al rename
      result: { pensionMensual: 5000 }, // forma previa al rename de PensionResult
    };
    await AsyncStorage.setItem('@mi_pension_mx:simulaciones', JSON.stringify([registroAntiguo]));

    const all = await getSimulations();

    expect(all).toEqual([]);
    // Autolimpieza: la siguiente lectura ya no debe reprocesar el registro inválido.
    expect(await AsyncStorage.getItem('@mi_pension_mx:simulaciones')).toBe('[]');
  });

  test('conserva las simulaciones válidas y descarta solo las incompatibles', async () => {
    const valida = await saveSimulation(buildResult(), 'Válida');
    const actual = JSON.parse((await AsyncStorage.getItem('@mi_pension_mx:simulaciones')) ?? '[]');
    await AsyncStorage.setItem(
      '@mi_pension_mx:simulaciones',
      JSON.stringify([...actual, { id: 'sim_viejo', name: 'Vieja', fechaCreacion: '2023-01-01' }]),
    );

    const all = await getSimulations();

    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(valida.id);
  });
});

// ─────────────────────────────────────────────
// Degradación segura ante fallos y datos corruptos
// (RNF-009 / RNF-017 — CHG-20261024-002 / US-006)
// ─────────────────────────────────────────────

describe('Degradación segura del almacenamiento', () => {
  test('getItem que rechaza → getSimulations resuelve [] sin lanzar', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('almacenamiento corrupto')),
    );

    await expect(getSimulations()).resolves.toEqual([]);
  });

  test('getItem que lanza de forma síncrona → getSimulations resuelve [] sin lanzar', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(getSimulations()).resolves.toEqual([]);
  });

  test('entradas nulas, no-objeto o con fecha inválida se descartan y la autolimpieza persiste el arreglo filtrado', async () => {
    const valida = await saveSimulation(buildResult(), 'Válida');
    const actual = JSON.parse((await AsyncStorage.getItem('@mi_pension_mx:simulaciones')) ?? '[]');
    await AsyncStorage.setItem(
      '@mi_pension_mx:simulaciones',
      JSON.stringify([
        null, // entra al guard !value
        'registro suelto', // typeof value !== 'object'
        {
          id: 'x',
          name: 'Fecha inválida',
          creationDate: 'no-es-fecha', // isNaN(new Date(...).getTime())
          result: { monthlyPension: 1 },
        },
        ...actual,
      ]),
    );

    const all = await getSimulations();

    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(valida.id);
    // Autolimpieza: lo persistido queda solo con las simulaciones válidas.
    const persistido = JSON.parse((await AsyncStorage.getItem('@mi_pension_mx:simulaciones')) ?? '[]');
    expect(persistido).toHaveLength(1);
    expect(persistido[0]?.id).toBe(valida.id);
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

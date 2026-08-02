/**
 * Servicio de almacenamiento local para el historial de simulaciones.
 * Usa AsyncStorage para persistir las últimas 20 simulaciones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedSimulation } from '../models';

const STORAGE_KEY = '@mi_prension_mx:simulaciones';
const MAX_SIMULATIONS = 20;

/** Genera un ID único para la simulación. */
function generateId(): string {
  return `sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/** Obtiene todas las simulaciones guardadas. */
export async function getSimulations(): Promise<SavedSimulation[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as SavedSimulation[];
  } catch {
    return [];
  }
}

/** Guarda una nueva simulación. Elimina la más antigua si se superan las 20. */
export async function saveSimulation(
  result: SavedSimulation['result'],
  name?: string,
): Promise<SavedSimulation> {
  const simulations = await getSimulations();

  const newSimulation: SavedSimulation = {
    id: generateId(),
    name: name ?? `Simulación ${new Date().toLocaleDateString('es-MX')}`,
    creationDate: new Date().toISOString(),
    result,
  };

  const updated = [newSimulation, ...simulations].slice(0, MAX_SIMULATIONS);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSimulation;
}

/** Elimina una simulación por su ID. */
export async function deleteSimulation(id: string): Promise<void> {
  const simulations = await getSimulations();
  const filtered = simulations.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/** Elimina todas las simulaciones guardadas. */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

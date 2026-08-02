/**
 * Servicio de almacenamiento local para el historial de simulaciones.
 * Usa AsyncStorage para persistir las últimas 20 simulaciones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedSimulation } from '../models';

const STORAGE_KEY = '@mi_pension_mx:simulaciones';
const MAX_SIMULATIONS = 20;

/** Genera un ID único para la simulación. */
function generateId(): string {
  return `sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Valida que una simulación leída de AsyncStorage tenga la forma actual.
 * Descarta silenciosamente registros de versiones anteriores de la app
 * (p. ej. guardados antes de renombrar `fechaCreacion` a `creationDate`),
 * que de otro modo producirían fechas/montos inválidos al mostrarse.
 */
function isValidSavedSimulation(value: unknown): value is SavedSimulation {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<SavedSimulation>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.creationDate === 'string' &&
    !isNaN(new Date(s.creationDate).getTime()) &&
    typeof s.result?.monthlyPension === 'number'
  );
}

/** Obtiene todas las simulaciones guardadas. */
export async function getSimulations(): Promise<SavedSimulation[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json) as unknown[];
    const valid = parsed.filter(isValidSavedSimulation);

    if (valid.length !== parsed.length) {
      // Autolimpieza: persiste sin los registros incompatibles para no
      // volver a filtrarlos en cada lectura.
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid;
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

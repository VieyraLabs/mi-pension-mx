/**
 * Servicio de almacenamiento local para el historial de simulaciones.
 * Usa AsyncStorage para persistir las últimas 20 simulaciones.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SimulacionGuardada } from '../models';

const STORAGE_KEY = '@mi_prension_mx:simulaciones';
const MAX_SIMULACIONES = 20;

/** Genera un ID único para la simulación. */
function generarId(): string {
  return `sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/** Obtiene todas las simulaciones guardadas. */
export async function obtenerSimulaciones(): Promise<SimulacionGuardada[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as SimulacionGuardada[];
  } catch {
    return [];
  }
}

/** Guarda una nueva simulación. Elimina la más antigua si se superan las 20. */
export async function guardarSimulacion(
  resultado: SimulacionGuardada['resultado'],
  nombre?: string,
): Promise<SimulacionGuardada> {
  const simulaciones = await obtenerSimulaciones();

  const nuevaSimulacion: SimulacionGuardada = {
    id: generarId(),
    nombre: nombre ?? `Simulación ${new Date().toLocaleDateString('es-MX')}`,
    fechaCreacion: new Date().toISOString(),
    resultado,
  };

  const actualizadas = [nuevaSimulacion, ...simulaciones].slice(0, MAX_SIMULACIONES);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(actualizadas));
  return nuevaSimulacion;
}

/** Elimina una simulación por su ID. */
export async function eliminarSimulacion(id: string): Promise<void> {
  const simulaciones = await obtenerSimulaciones();
  const filtradas = simulaciones.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtradas));
}

/** Elimina todas las simulaciones guardadas. */
export async function limpiarHistorial(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

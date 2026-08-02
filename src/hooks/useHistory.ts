/**
 * Hook para gestionar el historial de simulaciones guardadas.
 */
import { useState, useEffect, useCallback } from 'react';
import type { SavedSimulation, PensionResult } from '../models';
import {
  getSimulations,
  saveSimulation,
  deleteSimulation,
  clearHistory,
} from '../storage/simulationStorage';

export function useHistory() {
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getSimulations();
    setSimulations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (result: PensionResult, name?: string) => {
    const newSimulation = await saveSimulation(result, name);
    setSimulations((prev) => [newSimulation, ...prev].slice(0, 20));
    return newSimulation;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSimulation(id);
    setSimulations((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(async () => {
    await clearHistory();
    setSimulations([]);
  }, []);

  return {
    simulations,
    loading,
    load,
    save,
    remove,
    clear,
  };
}

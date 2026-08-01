/**
 * Hook para gestionar el historial de simulaciones guardadas.
 */
import { useState, useEffect, useCallback } from 'react';
import type { SimulacionGuardada, PensionResult } from '../models';
import {
  obtenerSimulaciones,
  guardarSimulacion,
  eliminarSimulacion,
  limpiarHistorial,
} from '../storage/simulationStorage';

export function useHistory() {
  const [simulaciones, setSimulaciones] = useState<SimulacionGuardada[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const data = await obtenerSimulaciones();
    setSimulaciones(data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = useCallback(async (resultado: PensionResult, nombre?: string) => {
    const nueva = await guardarSimulacion(resultado, nombre);
    setSimulaciones((prev) => [nueva, ...prev].slice(0, 20));
    return nueva;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await eliminarSimulacion(id);
    setSimulaciones((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const limpiar = useCallback(async () => {
    await limpiarHistorial();
    setSimulaciones([]);
  }, []);

  return {
    simulaciones,
    cargando,
    cargar,
    guardar,
    eliminar,
    limpiar,
  };
}

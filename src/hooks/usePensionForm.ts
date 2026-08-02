/**
 * Hook para manejar el estado del formulario de nueva simulación.
 * Mantiene el estado completo del PensionInput entre los pasos del stepper.
 */
import { useState, useCallback } from 'react';
import type {
  PensionInput,
  DatosPersonales,
  HistorialLaboral,
  SalarioBCPromedio,
  ConfiguracionUMA,
  Modalidad40,
  Beneficiarios,
} from '../models';
import { UMA_ACTUAL, calcularUMADesdeValorDiario, getUMAPorAnio } from '../constants/uma';
import { calcularEdad, calcularFechaRetiro } from '../utils/date';
import { diarioAMensual, mensualADiario } from '../utils/format';

const ESTADO_INICIAL: PensionInput = {
  datosPersonales: {
    sexo: 'masculino',
    fechaNacimiento: new Date(1965, 0, 1),
    edad: 0,
    fechaRetiroEstimada: new Date(),
    edadRetiro: 65,
  },
  historialLaboral: {
    semanasTotales: 0,
    relacionesLaborales: [],
  },
  salarioPromedio: {
    salarioDiario: 0,
    salarioMensual: 0,
    esManual: true,
  },
  uma: {
    umaDiaria: UMA_ACTUAL.umaDiaria,
    umaMensual: UMA_ACTUAL.umaMensual,
    umaAnual: UMA_ACTUAL.umaAnual,
    anio: UMA_ACTUAL.anio,
    esPersonalizada: false,
  },
  modalidad40: {
    activa: false,
  },
  beneficiarios: {
    tieneConyuge: false,
    tieneHijosMenores: false,
    numeroHijosMenores: 0,
    tienePadresDependientes: false,
    numeroPadresDependientes: 0,
  },
};

export function usePensionForm() {
  const [input, setInput] = useState<PensionInput>(ESTADO_INICIAL);

  const actualizarDatosPersonales = useCallback(
    (datos: Partial<DatosPersonales>) => {
      setInput((prev) => {
        const nuevoDatos = { ...prev.datosPersonales, ...datos };
        // Recalcular edad automáticamente si cambia la fecha de nacimiento
        if (datos.fechaNacimiento) {
          nuevoDatos.edad = calcularEdad(datos.fechaNacimiento);
        }
        // Recalcular fecha de retiro si cambia la edad de retiro
        if (datos.edadRetiro !== undefined && nuevoDatos.fechaNacimiento) {
          nuevoDatos.fechaRetiroEstimada = calcularFechaRetiro(
            nuevoDatos.fechaNacimiento,
            datos.edadRetiro,
          );
        }
        return { ...prev, datosPersonales: nuevoDatos };
      });
    },
    [],
  );

  const actualizarHistorial = useCallback((historial: Partial<HistorialLaboral>) => {
    setInput((prev) => ({
      ...prev,
      historialLaboral: { ...prev.historialLaboral, ...historial },
    }));
  }, []);

  const actualizarSalarioDiario = useCallback((salarioDiario: number) => {
    setInput((prev) => ({
      ...prev,
      salarioPromedio: {
        ...prev.salarioPromedio,
        salarioDiario,
        salarioMensual: diarioAMensual(salarioDiario),
        esManual: true,
      },
    }));
  }, []);

  const actualizarSalarioMensual = useCallback((salarioMensual: number) => {
    setInput((prev) => ({
      ...prev,
      salarioPromedio: {
        ...prev.salarioPromedio,
        salarioDiario: mensualADiario(salarioMensual),
        salarioMensual,
        esManual: true,
      },
    }));
  }, []);

  const seleccionarUMAPorAnio = useCallback((anio: number) => {
    const registro = getUMAPorAnio(anio);
    if (registro) {
      setInput((prev) => ({
        ...prev,
        uma: {
          umaDiaria: registro.umaDiaria,
          umaMensual: registro.umaMensual,
          umaAnual: registro.umaAnual,
          anio: registro.anio,
          esPersonalizada: false,
        },
      }));
    }
  }, []);

  const establecerUMAPersonalizada = useCallback((umaDiaria: number) => {
    const valores = calcularUMADesdeValorDiario(umaDiaria);
    setInput((prev) => ({
      ...prev,
      uma: {
        ...valores,
        anio: new Date().getFullYear(),
        esPersonalizada: true,
      },
    }));
  }, []);

  const actualizarModalidad40 = useCallback((m40: Partial<Modalidad40>) => {
    setInput((prev) => ({
      ...prev,
      modalidad40: { ...prev.modalidad40, ...m40 },
    }));
  }, []);

  const actualizarBeneficiarios = useCallback((beneficiarios: Partial<Beneficiarios>) => {
    setInput((prev) => ({
      ...prev,
      beneficiarios: { ...prev.beneficiarios, ...beneficiarios },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setInput(ESTADO_INICIAL);
  }, []);

  const cargarSimulacion = useCallback((inputGuardado: PensionInput) => {
    setInput(inputGuardado);
  }, []);

  return {
    input,
    actualizarDatosPersonales,
    actualizarHistorial,
    actualizarSalarioDiario,
    actualizarSalarioMensual,
    seleccionarUMAPorAnio,
    establecerUMAPersonalizada,
    actualizarModalidad40,
    actualizarBeneficiarios,
    resetForm,
    cargarSimulacion,
  };
}

/**
 * Paso 1: Cálculo del salario promedio efectivo.
 * Incluye el ajuste por Modalidad 40 si está activa.
 *
 * Fuente: Art. 167 LSS 1973 — promedio de las últimas 250 semanas.
 */
import type { CalculationContext, CalculationStep } from '../types';
import {
  DIAS_PROMEDIO_MES,
  MODALIDAD_40_TOPE_VECES_UMA,
  SEMANAS_PROMEDIO_SBC,
  TOPE_SBC_VECES_UMA,
} from '../../../constants/ley73';
import { round2 } from '../../../utils/format';

/**
 * Calcula el salario promedio ajustado de las últimas 250 semanas,
 * considerando la Modalidad 40 si está activa.
 *
 * Supuesto M40: cuando M40 está activa, calculamos el promedio ponderado
 * aproximado entre el SBC del régimen obligatorio y el SBC de M40,
 * según los meses esperados de cotización M40 dentro de las 250 semanas.
 */
export const AverageSalaryStep: CalculationStep = (ctx): CalculationContext => {
  const { input } = ctx;
  const { salarioPromedio, uma, modalidad40 } = input;
  const advertencias = [...ctx.advertencias];
  const pasos = [...ctx.pasos];

  const topeUMADiario = TOPE_SBC_VECES_UMA * uma.umaDiaria;
  let salarioDiarioBase = salarioPromedio.salarioDiario;
  let esEstimacionSalario = false;
  let descripcionSalario = `Salario diario promedio ingresado: $${salarioDiarioBase.toFixed(2)}`;
  let formulaSalario = 'SBC promedio (250 semanas) — ingresado por el usuario';

  // Ajuste por Modalidad 40
  if (modalidad40.activa && modalidad40.salarioCotizacion && modalidad40.mesesEsperados) {
    const sbcM40 = modalidad40.salarioCotizacion;
    const sbcM40Topado = Math.min(sbcM40, MODALIDAD_40_TOPE_VECES_UMA * uma.umaDiaria);

    // Semanas totales del período de referencia
    const semanasRef = SEMANAS_PROMEDIO_SBC; // 250
    // Semanas de M40 dentro del período de referencia
    const semanasM40 = Math.min(modalidad40.mesesEsperados * 4.33, semanasRef);
    const semanasBase = semanasRef - semanasM40;

    // Incremento anual de M40 si aplica
    let salarioM40AjustadoDiario = sbcM40Topado;
    if (modalidad40.incrementoSalarialAnual && modalidad40.incrementoSalarialAnual > 0) {
      // Para simplificar, aplicamos el incremento promedio en la mitad del período
      const aniosM40 = semanasM40 / 52;
      const factorIncremento = 1 + (modalidad40.incrementoSalarialAnual / 100) * (aniosM40 / 2);
      salarioM40AjustadoDiario = Math.min(sbcM40Topado * factorIncremento, MODALIDAD_40_TOPE_VECES_UMA * uma.umaDiaria);
      esEstimacionSalario = true;
    }

    // Promedio ponderado
    const promedioPonderado =
      (salarioDiarioBase * semanasBase + salarioM40AjustadoDiario * semanasM40) / semanasRef;

    salarioDiarioBase = round2(promedioPonderado);
    descripcionSalario = `Promedio ponderado: ${semanasBase.toFixed(0)} sem. ordinarias ($${salarioPromedio.salarioDiario.toFixed(2)}/día) + ${semanasM40.toFixed(0)} sem. M40 ($${salarioM40AjustadoDiario.toFixed(2)}/día) = $${salarioDiarioBase.toFixed(2)}/día`;
    formulaSalario = '(SBC_ord × sem_ord + SBC_M40 × sem_M40) ÷ 250';
    esEstimacionSalario = true;
    advertencias.push(
      'El promedio salarial incluye un ajuste estimado por Modalidad 40. ' +
        'El IMSS calculará el promedio exacto con tu historial completo.',
    );
  }

  // Aplicar tope de 25 UMA
  const aplicoTope = salarioDiarioBase > topeUMADiario;
  const salarioEfectivoDiario = aplicoTope ? topeUMADiario : salarioDiarioBase;

  if (aplicoTope) {
    advertencias.push(
      `El SBC ($${salarioDiarioBase.toFixed(2)}/día) excede el tope de 25 UMA ` +
        `($${topeUMADiario.toFixed(2)}/día). Se utiliza el tope máximo. ` +
        `(Art. 28 LSS vigente; ref. DOF 27-ene-2016)`,
    );
  }

  pasos.push({
    id: 'salario_promedio',
    titulo: '1. Salario Base de Cotización Promedio',
    descripcion: aplicoTope
      ? `${descripcionSalario} → topado a 25 UMA = $${salarioEfectivoDiario.toFixed(2)}/día`
      : descripcionSalario,
    valor: salarioEfectivoDiario * DIAS_PROMEDIO_MES,
    formula: aplicoTope ? `min(${formulaSalario}, 25 × UMA_diaria)` : formulaSalario,
    baseLegal: 'Art. 167 LSS 1973 (promedio 250 semanas); Art. 28 LSS vigente (tope 25 UMA)',
    esEstimacion: esEstimacionSalario,
    supuesto: esEstimacionSalario
      ? 'Promedio ponderado estimado considerando Modalidad 40. El IMSS usará el historial exacto.'
      : undefined,
  });

  return {
    ...ctx,
    salarioEfectivoDiario,
    aplicoTope,
    pasos,
    advertencias,
  };
};

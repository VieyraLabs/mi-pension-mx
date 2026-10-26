/**
 * Pruebas del paso de historial laboral: los mensajes de semanas deben
 * narrar las MISMAS cifras que usa el motor (cotizadas hoy + proyectadas
 * hasta la edad de retiro = total con el que se jubila el asegurado).
 *
 * Para ejecutar: npm test
 */
import React from 'react';
import { screen } from '@testing-library/react-native';
import { renderScreen } from '../test-utils/renderScreen';
import { WorkHistoryStep } from '../components/WorkHistoryStep';
import { lightTheme } from '../theme';
import type { WorkHistory } from '../models';
import type { WeeksProjection } from '../utils/weeksProjection';

function renderStep(weeksProjection: WeeksProjection, totalWeeks: number) {
  const workHistory: WorkHistory = { totalWeeks, employmentRelations: [] };
  renderScreen(
    <WorkHistoryStep
      workHistory={workHistory}
      weeksProjection={weeksProjection}
      retirementAge={65}
      onChange={() => {}}
      theme={lightTheme}
    />,
  );
}

describe('WorkHistoryStep — mensaje de semanas al jubilarse', () => {
  test('con el mínimo cubierto al jubilarte muestra las tres cifras', () => {
    // 100 cotizadas + 1820 proyectadas hasta los 65 años = 1920 al jubilarse.
    renderStep(
      {
        currentWeeks: 100,
        projectedWeeks: 1820,
        targetWeeks: 1920,
        yearsToRetirement: 35,
      },
      100,
    );

    expect(
      screen.getByText(
        '✓ Al jubilarte tendrás 1920 semanas (100 cotizadas + 1820 proyectadas hasta los 65 años). ' +
          'Cumples el mínimo de 500 semanas (Arts. 138 y 145 LSS 1973). ' +
          'La proyección asume que sigues cotizando hasta los 65 años ' +
          '(puedes ajustarlo en el paso «Edad de retiro»).',
      ),
    ).toBeTruthy();
  });

  test('sin el mínimo cubierto dice cuántas semanas faltan para jubilarse', () => {
    // 50 cotizadas + 52 proyectadas (1 año hasta los 65) = 102 al jubilarse.
    renderStep(
      {
        currentWeeks: 50,
        projectedWeeks: 52,
        targetWeeks: 102,
        yearsToRetirement: 1,
      },
      50,
    );

    expect(
      screen.getByText(
        '⚠️ Mínimo requerido: 500 semanas (Arts. 138 y 145 LSS 1973). ' +
          'Te faltan 398 semanas para jubilarte: hoy tienes 50 y se proyectan 52 hasta los 65 años. ' +
          'La proyección asume que sigues cotizando hasta los 65 años ' +
          '(puedes ajustarlo en el paso «Edad de retiro»).',
      ),
    ).toBeTruthy();
  });

  test('el faltante se calcula contra el total al jubilarse, no contra las cotizadas hoy', () => {
    // Hoy hay 480 semanas (falta 20) pero al jubilarse tendrá 480 + 520 = 1000.
    renderStep(
      {
        currentWeeks: 480,
        projectedWeeks: 520,
        targetWeeks: 1000,
        yearsToRetirement: 10,
      },
      480,
    );

    // Cumple: no debe aparecer el aviso de semanas faltantes.
    expect(screen.queryByText(/Te faltan/)).toBeNull();
    expect(screen.getByText(/Al jubilarte tendrás 1000 semanas/)).toBeTruthy();
  });
});

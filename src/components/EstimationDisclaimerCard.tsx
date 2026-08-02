/**
 * Tarjeta de aviso de estimación/legal, usada en todas las pantallas que
 * muestran un resultado de cálculo. Antes cada pantalla redactaba su propia
 * versión de este aviso (7+ variantes distintas) — ahora usan un único
 * texto canónico (AVISO_ESTIMACION en constants/infoLegal.ts).
 */
import React from 'react';
import { MessageBanner } from './MessageBanner';
import { AVISO_ESTIMACION } from '../constants/infoLegal';

export function EstimationDisclaimerCard({ style }: { style?: object }) {
  return (
    <MessageBanner variant="warning" style={style}>
      {AVISO_ESTIMACION}
    </MessageBanner>
  );
}

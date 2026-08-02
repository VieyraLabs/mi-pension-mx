/**
 * Tarjeta de aviso de estimación/legal, usada en todas las pantallas que
 * muestran un resultado de cálculo. Antes cada pantalla redactaba su propia
 * versión de este aviso (7+ variantes distintas) — ahora usan un único
 * texto canónico (ESTIMATION_DISCLAIMER en constants/infoLegal.ts).
 */
import React from 'react';
import { MessageBanner } from './MessageBanner';
import { ESTIMATION_DISCLAIMER } from '../constants/infoLegal';

export function EstimationDisclaimerCard({ style }: { style?: object }) {
  return (
    <MessageBanner variant="warning" style={style}>
      {ESTIMATION_DISCLAIMER}
    </MessageBanner>
  );
}

# Spec-07 — Historial de cotización y promedio del SBC

- **Estado**: Vigente
- **Ámbito**: `src/services/pension/history/`

## Propósito

Reconstruir el historial semanal de cotización del asegurado y calcular el **salario base
de cotización promedio de las últimas 250 semanas cotizadas**, que es el insumo del
cálculo de la pensión (Art. 167 LSS 1973).

## Comportamiento

El módulo trabaja sobre el historial reconstruido a partir del texto de la constancia:

```ts
interface WeeklyContribution {
  date: Date;                       // inicio de la semana
  contributed: boolean;             // hubo cotización registrada
  salaryBaseContribution?: number;  // SBC diario de esa semana
}
```

`computeContributionSummary(history)` devuelve:

- `totalWeeksInHistory`, `contributedWeeks`, `skippedWeeks`.
- `selectedWeeks`: cuántas semanas entraron al promedio (250, o menos si el historial no
  alcanza).
- `averageSalary`: el SBC diario promedio.
- `firstWeekUsed` y `lastWeekUsed`: el rango real usado.
- `isComplete`: si se alcanzaron las 250 semanas cotizadas completas.

## Reglas de negocio

- **Son las últimas 250 semanas cotizadas, no las últimas 250 semanas calendario.** Las
  semanas sin cotización se conservan en el historial (sirven para el usuario) pero no
  entran al promedio: el recorrido salta hacia atrás hasta reunir 250 semanas con
  cotización.
- **Los empleos simultáneos se suman.** Si en un día hay dos patrones vigentes, el SBC de
  ese día es la suma de ambos, porque el asegurado cotizó a los dos. Pero **la semana se
  cuenta una sola vez**: tener dos empleos no genera dos semanas cotizadas.
- **Un cambio de salario a mitad de semana** se promedia ponderado por los días cubiertos.
- **El rango usado se muestra al usuario**, junto con el desglose de semanas. El usuario
  puede comprobar que el promedio tomó el periodo correcto.

## Fuera de alcance

- No se reconstruye el historial cuando el usuario captura los datos a mano: en ese caso
  el SBC promedio lo ingresa el usuario.
- No se importan constancias de otros años que no vengan en el mismo documento.
- No se corrigen los datos del historial contra la constancia: el módulo trabaja con lo
  que el parser produjo.

## Verificación

- `src/__tests__/contributionHistory.test.ts` — caso de las 250 semanas completas, caso
  con huecos laborales, caso de dos empleos simultáneos, caso de cambio de salario a
  mitad de semana, y caso de historial más corto que 250 semanas cotizadas.

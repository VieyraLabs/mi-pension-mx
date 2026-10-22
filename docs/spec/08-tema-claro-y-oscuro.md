# Spec-08 — Tema claro y oscuro

- **Estado**: Vigente
- **Ámbito**: `src/theme/`, `app.json`

## Propósito

Que la app sea legible en cualquier condición de luz, y que el cambio de tema no requiera
tocar las pantallas.

## Comportamiento

El tema sigue el ajuste del sistema (`userInterfaceStyle: "automatic"` en `app.json`), sin
un interruptor propio: el usuario decide en su sistema operativo y la app lo respeta.

`useAppTheme()` expone el tema activo y `isDark`. Los componentes que necesitan un color
concreto lo piden al tema; los que pintan avisos usan `getBannerColors(variant, isDark)`.

## Reglas de negocio

- **Ningún hex literal en las pantallas.** Todos los colores salen de `src/theme/index.ts`
  o de `useTheme()`. Es la regla que corrigió el bug de legibilidad del commit `9e996ac`.
- **Todo banner tiene su variante oscura.** `BANNER_COLORS` define los cuatro tipos
  (warning, success, error, info) con su par claro y oscuro, y `getBannerColors` es el
  único selector.
- **El aviso legal de estimación se ve siempre igual.** `EstimationDisclaimerCard` es un
  componente propio con su propio diseño, no un banner genérico, porque aparece en
  pantalla de resultado y en el reporte exportado.
- **La paleta del PDF exportado es la de la app.** El HTML del reporte usa los mismos
  colores defined en el tema, para que el documento se lea como parte de la app.

## Fuera de alcance

- No hay selector de tema dentro de la app.
- No hay tema de alto contraste adicional.
- No hay personalización de la paleta por el usuario.

## Verificación

- Verificación manual en ambos modos sobre las nueve pantallas.
- `src/__tests__/ResultScreen.test.tsx` y `ValidationScreen.test.tsx` renderizan
  componentes que dependen del tema, lo que detecta roturas de contrato en la API del
  tema.

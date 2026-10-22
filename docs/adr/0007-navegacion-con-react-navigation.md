# ADR-0007 — Navegación con React Navigation v7

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: `src/navigation/RootNavigator.tsx`

## Contexto

La app tiene nueve pantallas y dos formas de entrar a un resultado:

- **Tabs** para las secciones de primer nivel: Panel, Simulador, Historial, Información.
- **Stack** para las pantallas modales o de flujo: Nueva simulación, Resultado,
  Importar PDF, Validación, Preguntas frecuentes.

El resultado se puede abrir desde dos sitios distintos (el flujo de nueva simulación y el
historial), y al abrirlo desde el historial hay que poder pasarle el identificador de la
simulación guardada. Además, la pantalla de validación recibe el texto extraído del PDF.

Esto obliga a que los parámetros de ruta estén **tipados**: si el tipo del parámetro y el
tipo que espera la pantalla se separan, el error aparece en runtime, con la app ya
desplegada.

## Decisión

**React Navigation v7, con un Stack raíz que contiene un Tab navigator**, y los
parámetros de ruta declarados en tipos explícitos:

```ts
export type RootStackParamList = {
  MainTabs: undefined;
  NewSimulation: { importedData?: ImportedSimulationData } | undefined;
  Result: { simulationId?: string };
  PdfImport: undefined;
  Validation: { extractedText: string };
  FAQ: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Simulator: undefined;
  History: undefined;
  Info: undefined;
};
```

Reglas que acompañan la decisión:

- **El Stack raíz es el único que conoce las pantallas modales.** Los tabs cuelgan de
  `MainTabs`.
- **Los parámetros viajan tipados**: `Result` recibe `simulationId?` (opcional porque
  puede venir de una simulación recién calculada, que aún no está guardada) y
  `Validation` recibe el texto extraído.
- **Los iconos de los tabs son de `@expo/vector-icons`** (`MaterialCommunityIcons`), que
  ya viene con Expo: cero dependencias extra.
- El tema de React Navigation se toma del tema de React Native Paper (`useTheme`), de
  modo que la navegación y las superficies comparten paleta (ver
  [ADR-0008](0008-tema-material-design-3-claro-y-oscuro.md)).

## Consecuencias

### Positivas

- Los parámetros de ruta están tipados de extremo a extremo: `navigation.navigate('Result', { simulationId })`
  no compila con un parámetro que la pantalla no acepta.
- La estructura de tabs + stack es la que el usuario espera en una app de este tipo.
- Sin dependencias de navegación adicionales: `react-navigation` y sus dos paquetes de
  stack y tabs, más los iconos de Expo.

### Costes

- **React Navigation v7 con `react-native-screens` es una dependencia nativa.** La app
  requiere un development build o un build nativo para ejecutarse en dispositivo; en
  Expo Go funciona el flujo principal, pero no es el objetivo de distribución.
- Los tipos de rutas son una declaración manual: si se añade una pantalla y no se
  añade al `RootStackParamList`, la navegación a ella no está tipada. Se mitiga porque
  el compilador falla al navegar a una ruta inexistente.
- Un tipo por archivo de rutas: cuando el número de pantallas crece, se puede separar
  en varios archivos.

## Alternativas descartadas

- **Expo Router (enrutado por sistema de archivos).** Se descartó porque la app ya está
  construida con React Navigation tras el upgrade de SDK, y porque con nueve pantallas y
  dos modalities de entrada el enrutado por convención no aporta. Es la opción por
  defecto si la app se reescribiera desde cero, pero la migración no está justificada.
- **Un solo Stack sin tabs.** Se descartó porque obliga a navegar fuera de la sección
  actual para cambiar de sección, lo que rompe la sensación de "casa" del panel.
- **Navegación manual con un estado global.** Se descartó: reintroduce el acoplamiento
  que la navegación declarativa evita, y hace imposible el deep link.

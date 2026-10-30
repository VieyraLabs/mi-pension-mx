# Spec-02 — Simulador de escenarios A/B

- **Estado**: Vigente
- **Ámbito**: `src/screens/SimulatorScreen.tsx`, `calculateSimpleScenario`

## Propósito

Permitir comparar **dos escenarios** de valores que el usuario elige entre sí, sin
pasar por el formulario completo. Es la pantalla de exploración: "¿y si me jubilo a los 65
en vez de a los 60?", "¿y si gano más?".

## Comportamiento

La pantalla ofrece un conjunto reducido de entradas —semanas cotizadas, salario diario,
UMA diaria, edad de retiro y dependientes— y calcula el resultado de dos escenarios a
la vez. Cada escenario produce un monto mensual y el usuario ve la diferencia.

El cálculo del simulador **no reutiliza el formulario completo**: usa
`calculateSimpleScenario(params)`, que construye un `PensionInput` completo con valores por
omisión para los campos que el simulador no expone, y luego invoca el mismo motor.

## Reglas de negocio

- **El simulador y el motor no pueden divergir.** El simulador no reimplementa ninguna
  regla: arma un `PensionInput` y llama a `calculatePension`.
- **Los valores por omisión son explícitos** en la construcción del input: sexo
  masculino, sin empleos registrados, Modalidad 10 inactiva, sin dependientes salvo los que el
  usuario marque.
- **Si la entrada del simulador es inválida, el resultado es `0`** y no se muestra un
  desglose. `calculateSimpleScenario` llama a `validateInput` y devuelve `0` si el
  schema falla, en vez de calcular sobre datos que el motor rechazaría.
- **El simulador es una estimación de primera orden**: no muestra el desglose paso a
  paso, porque la granularidad del formulario completo es la que se reserva para el
  resultado definitivo.

## Fuera de alcance

- El simulador no guarda resultados en el historial: es un área de exploración, no un
  resultado que se quiera conservar. El historial lo alimentan las simulaciones creadas
  desde el flujo completo.
- El simulador no importa datos de la constancia en PDF.
- El simulador no compara contra un resultado ya guardado.

## Verificación

- `src/__tests__/pensionCalculator.test.ts` cubre `calculateSimpleScenario` en sus
  variantes de dependientes y de validación.
- `SimulatorScreen` se verifica de forma indirecta: la lógica vive en el motor, y la
  pantalla solo presentsa.

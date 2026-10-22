# Spec-06 — Captura y validación de datos

- **Estado**: Vigente
- **Ámbito**: `src/validation/pensionSchema.ts`, `src/hooks/usePensionForm.ts`, `src/components/`

## Propósito

Recopilar los datos del asegurado con la menor fricción posible, garantizando que lo que
llega al motor cumple las reglas de la ley.

## Comportamiento

La captura se organiza como un **flujo por pasos** (`NewSimulationScreen`), en lugar de un
formulario largo:

1. Datos personales (nombre, sexo, fecha de nacimiento, edad de retiro).
2. Historial laboral (semanas cotizadas).
3. Salario (salario diario o promedio).
4. UMA (valor por año o personalizado).
5. Modalidad 40 (activa o no, con sus meses y su salario de aportación).
6. Beneficiarios (cónyuge, hijos menores, padres dependientes).

Cada paso tiene su componente (`PersonalDataStep`, `SalaryStep`, `UMAStep`,
`Modalidad40Step`, `BeneficiariesStep`), y los componentes de fila (`DataRow`, `CompRow`,
`SummaryRow`) dan consistencia visual a todos ellos.

## Reglas de negocio

- **La validación es la de Zod**, y es la misma que usa el motor
  ([ADR-0004](../adr/0004-validacion-con-zod-como-fuente-unica.md)). Los mensajes de
  error citan el artículo legal cuando la regla tiene uno.
- **El mínimo de 500 semanas considera las semanas planeadas en Modalidad 40.** El
  mensaje de error muestra el desglose: "500 semanas cotizadas (480 cotizadas + 20
  planeadas en Modalidad 40 = 500)".
- **La edad de retiro va de 60 a 100 años**, con el mínimo justificado por la cesantía en
  edad avanzada.
- **Los mensajes están en español y son accionables.** No dicen "valor inválido": dicen
  qué se espera y por qué.
- **Los componentes de estado son compartidos**: `MessageBanner` (aviso, error, éxito,
  información), `LoadingView`, `EmptyState` y `EstimationDisclaimerCard`. No hay dos
  componentes que pinten el mismo tipo de aviso (commit `c74ca0a`).

## Fuera de alcance

- No hay validación asíncrona contra ningún servicio: la validación es local
  ([ADR-0002](../adr/0002-cero-backend-todo-en-el-dispositivo.md)).
- No hay guardado automático del formulario a medio completar: solo se guarda una
  simulación terminada.
- No hay cálculo mientras se escribe: el cálculo ocurre al confirmar.

## Verificación

- `src/__tests__/usePensionForm.test.ts` — reglas del schema, incluidos los casos
  límite de semanas y de edad.
- `src/__tests__/ValidationScreen.test.tsx` — pantalla de validación tras la
  importación de un PDF.

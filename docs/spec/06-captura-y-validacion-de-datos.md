# Spec-06 — Captura y validación de datos

- **Estado**: Vigente
- **Ámbito**: `src/validation/pensionSchema.ts`, `src/hooks/usePensionForm.ts`, `src/components/`

## Propósito

Recopilar los datos del asegurado con la menor fricción posible, garantizando que lo que
llega al motor cumple las reglas de la ley.

## Comportamiento

La captura se organiza como un **flujo por pasos** (`NewSimulationScreen`), en lugar de un
formulario largo:

1. Datos personales (nombre, sexo, fecha de nacimiento).
2. Historial laboral (semanas cotizadas **y** salario base de cotización, en el mismo paso).
3. Edad de retiro (edad de retiro y fecha estimada de retiro).
4. UMA (valor por año o personalizado).
5. Modalidad 40 (activa o no, con sus meses y su salario de aportación).
6. Beneficiarios (cónyuge, hijos menores, padres dependientes).

Cada paso tiene su componente (`PersonalDataStep`, `WorkHistoryStep`, `SalaryStep`,
`RetirementAgeStep`, `UMAStep`, `Modalidad40Step`, `BeneficiariesStep`), y los componentes de
fila (`DataRow`, `CompRow`, `SummaryRow`) dan consistencia visual a todos ellos.

El paso 2 puede mostrar dos tarjetas (`WorkHistoryStep` y `SalaryStep`): el historial
laboral y el SBC son las dos caras del mismo dato de entrada —las semanas cotizadas y el
salario con el que se cotizaron—, así que se capturan juntos.

La edad actual se deriva de la fecha de nacimiento, no se captura. La fecha de retiro se
recalcula cuando cambia la fecha de nacimiento o la edad de retiro.

## Reglas de negocio

- **La validación es la de Zod**, y es la misma que usa el motor
  ([ADR-0004](../adr/0004-validacion-con-zod-como-fuente-unica.md)). Los mensajes de
  error citan el artículo legal cuando la regla tiene uno.
- **El mínimo de 500 semanas se evalúa contra las semanas con las que se jubilaría el
  asegurado**, no solo contra las ya cotizadas: las semanas actuales más las proyectadas
  hasta la edad de retiro (las planeadas en Modalidad 40 caen dentro de ese horizonte y no
  se cuentan dos veces). El mensaje de error muestra el desglose: "500 semanas cotizadas
  (480 cotizadas + 20 planeadas en Modalidad 40 = 500)". La misma proyección usa el motor
  (ver [Spec-01](01-motor-de-calculo-ley-73.md) y
  [ADR-0012](../adr/0012-proyeccion-de-semanas-hasta-la-edad-de-retiro.md)).
- **La edad de retiro NO es un dato personal: es una decisión sobre cuándo se jubila la
  persona usuaria.** Por eso vive en su propio paso (el 3) y no en «Datos personales»:
  el paso 1 se llama «Datos personales» y solo lleva nombre, sexo y fecha de nacimiento. El
  paso «Edad de retiro» muestra además la **fecha estimada de retiro**, que el formulario
  calcula (`usePensionForm`) y la UI solo muestra, sin recalcular (RNF-013).
- **El paso de historial laboral muestra las semanas actuales frente a las objetivo.** Ya no
  dice "te faltan N semanas" contra lo cotizado hoy, sino contra lo que el asegurado
  tendrá al jubilarse, mostrando las tres cifras: las cotizadas hoy, las proyectadas hasta
  la edad de retiro y el total objetivo. El mensaje declara el supuesto de la proyección y
  remite al paso «Edad de retiro» para ajustarlo.
- **El campo «Meses cotizando en M40 (estimado)» es derivado y de solo lectura.** Su valor
  se precarga al activar Modalidad 40 con los meses que hay entre hoy y la fecha de retiro,
  y se recalcula si cambian la fecha de nacimiento o la edad de retiro. No es editable: si
  fuera editable, sus semanas se sumarían a un horizonte que ya las contiene. Un texto
  auxiliar explica de dónde sale el valor. El horizonte se acota al rango que admite el
  esquema (1 a 600 meses): si el asegurado ya está en la edad de retiro el valor es 1, y
  si el horizonte supera los 50 años se acota a 600.
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
  límite de semanas y de edad; derivación de la edad desde la fecha de nacimiento y
  recálculo de la fecha de retiro.
- `src/__tests__/ValidationScreen.test.tsx` — pantalla de validación tras la
  importación de un PDF.
- `src/__tests__/NewSimulationScreen.test.tsx` — el campo de meses de Modalidad 40 se
  muestra con el valor derivado del horizonte y no es editable; **la estructura de los
  pasos**: el paso 1 ya no pide la edad de retiro, el paso 2 reúne el historial laboral y
  el SBC, y el paso 3 pide la edad de retiro, muestra la fecha estimada y la recalcula al
  cambiarla.
- `src/__tests__/WorkHistoryStep.test.tsx` — el mensaje de semanas contrasta las
  cotizadas hoy con las objetivo al jubilarse, y declara el supuesto de la proyección.

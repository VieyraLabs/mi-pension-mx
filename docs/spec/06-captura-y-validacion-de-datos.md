# Spec-06 — Captura y validación de datos

- **Estado**: Vigente
- **Ámbito**: `src/validation/pensionSchema.ts`, `src/hooks/usePensionForm.ts`, `src/components/`

## Propósito

Recopilar los datos del asegurado con la menor fricción posible, garantizando que lo que
llega al motor cumple las reglas de la ley.

## Comportamiento

La captura se organiza como un **flujo por pasos** (`NewSimulationScreen`), en lugar de un
formulario largo. Son **cuatro pasos**, con estos títulos exactos:

1. **Datos personales** (nombre, sexo, fecha de nacimiento).
2. **Historial laboral** (semanas cotizadas **y** salario base de cotización, en el mismo paso).
3. **Edad de retiro** (fecha de retiro y **beneficiarios**).
4. **UMA** (valor por año o personalizado, **y Modalidad 40**).

Cada paso tiene su componente (`PersonalDataStep`, `WorkHistoryStep`, `SalaryStep`,
`RetirementAgeStep`, `UMAStep`, `Modalidad40Step`, `BeneficiariesStep`), y los componentes de
fila (`DataRow`, `CompRow`, `SummaryRow`) dan consistencia visual a todos ellos.

El paso 2 puede mostrar dos tarjetas (`WorkHistoryStep` y `SalaryStep`): el historial
laboral y el SBC son las dos caras del mismo dato de entrada —las semanas cotizadas y el
salario con el que se cotizaron—, así que se capturan juntos. El paso 3 puede mostrar dos
tarjetas (`RetirementAgeStep` y `BeneficiariesStep`) y el paso 4 otras dos (`UMAStep` y
`Modalidad40Step`).

El paso 3 elige la **fecha** de retiro con un **calendario de ruedas** (`DateWheelPicker`:
una rueda por año, por mes y por día) y la **edad se deriva de esa fecha**: el campo de
edad es de **solo lectura**. La fecha viene precargada con el cumpleaños de la persona en el
año en que cumpliría 65 años. Entre 60 y 65 años la edad se presenta con granularidad de
**medio año** (60, 60.5, 61, 61.5, …, 64.5, 65): es la granularidad que necesita el motor
para aplicar la regla del Art. 171 LSS 1973 (ver
[Spec-01](01-motor-de-calculo-ley-73.md)); fuera de ese rango la edad se muestra como
entero cumplido. La edad con fracción es la que se envía en `retirementAge`; el motor
calcula con ella la edad legal.

El calendario de ruedas se construyó con lo que ya había en el repositorio
(`react-native` + `react-native-paper`): **no se añadió ninguna dependencia nueva**.

La edad actual se deriva de la fecha de nacimiento, no se captura. La fecha estimada de
retiro la calcula el formulario (`usePensionForm`) y se recalcula cuando cambian la fecha
de nacimiento o la edad de retiro; cuando la persona elige una fecha en el calendario,
esa fecha es la que queda.

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
  paso «Edad de retiro» muestra la **fecha de retiro** que el formulario lleva
  (`personalData.estimatedRetirementDate`, calculada por `usePensionForm`): la UI solo la
  muestra, no la recalcula (RNF-013).
- **La edad de retiro se elige por FECHA, no se escribe.** El campo de fecha no es
  editable: se toca para abrir el calendario de ruedas, y la **edad se deriva de la fecha
  elegida** (de ahí el cumpleaños precargado, en el año en que la persona cumpliría 65 años).
  La edad que se muestra y la que se envía al motor es la **de presentación**: un múltiplo
  de medio año. La edad **legal** (Art. 171 LSS 1973: seis meses o más cumplidos se
  computan como el año siguiente) la calcula el motor, no la pantalla; cuando la edad
  presentable y la legal difieren, el paso lo dice («Cálculo del motor: 61 años (edad
  legal, Art. 171 LSS 1973)»).
- **El paso de historial laboral NO anticipa la proyección de semanas.** Ya no dice "al
  jubilarte tendrás N semanas": en ese momento la edad de retiro todavía no está decidida
  (se elige en el paso 3), así que sería una cifra que aún no es cierta. El paso solo
  ofrece una guía evergreen sobre dónde verificar las semanas cotizadas (el portal del
  IMSS con el NSS). El mínimo de 500 semanas se revisa al final, con la edad de retiro ya
  definida.
- **El campo «Meses cotizando en M40 (estimado)» es derivado y de solo lectura.** Su valor
  se precarga al activar Modalidad 40 con los meses que hay entre hoy y la fecha de retiro,
  y se recalcula si cambian la fecha de nacimiento o la edad de retiro. No es editable: si
  fuera editable, sus semanas se sumarían a un horizonte que ya las contiene. Un texto
  auxiliar explica de dónde sale el valor. El horizonte se acota al rango que admite el
  esquema (1 a 600 meses): si el asegurado ya está en la edad de retiro el valor es 1, y
  si el horizonte supera los 50 años se acota a 600.
- **La edad de retiro va de 60 a 100 años**, con el mínimo justificado por la cesantía en
  edad avanzada, y admite **fracciones de medio año** (60, 60.5, 61, …): el esquema
  rechaza, con mensaje, las edades que no son múltiplos de medio año.
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
  pasos**: son cuatro («Datos personales», «Historial laboral», «Edad de retiro», «UMA»),
  el paso 1 no pide la edad de retiro, el paso 2 reúne el historial laboral y el SBC, el
  paso 3 pide la fecha de retiro con el calendario y la muestra como derivada, y el paso 4
  es «UMA de 4 de 4» con la Modalidad 40. También las **reglas de presentación de la
  edad**: 60 años y 3 meses → 60, 60 y 6 → 60.5, 60 y 9 → 60.5, 64 y 7 → 64.5, 65 y 6 →
  65, 66 y 2 → 66, y el cumpleaños precargado (con el 29 de febrero ajustado al último día
  del mes en los años que no son bisiestos).
- `src/__tests__/DateWheelPicker.test.tsx` — el calendario de ruedas: abre el modal con
  las tres ruedas (año, mes y día), cada elemento es localizable por su
  `accessibilityLabel` («Año 2030», «Mes julio», «Día 1»), elegir y **aceptar** devuelve la
  fecha elegida, **cancelar** cierra sin devolver fecha, la rueda de años respeta la
  fecha mínima y la máxima, y la rueda de días se limita a los días del mes elegido.
- `src/__tests__/WorkHistoryStep.test.tsx` — el paso de historial laboral **no** narra la
  proyección de semanas (la edad de retiro aún no está decidida) y mantiene la guía
  evergreen sobre el portal del IMSS.
- `src/__tests__/pensionSchema.test.ts` — la edad de retiro con fracción de medio año
  (60.5) es válida y las edades que no son múltiplos de medio año se rechazan.

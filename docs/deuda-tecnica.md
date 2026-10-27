# Deuda técnica del motor de cálculo

Inventario de lo que el motor de cálculo **no** hace, verificado contra el código. No es
trabajo pendiente de la iteración actual: es **deuda documentada**, para que quien lea el
resultado de la app sepa qué puede haber detrás de una diferencia frente al cálculo oficial
del IMSS.

Cada ítem dice: qué falta, por qué importa (con la referencia legal), dónde está el código
afectado y qué **no** se hizo a propósito.

- **Ámbito**: `src/services/pension/`, `src/utils/weeksProjection.ts`
- **Estado**: Vigente (se actualiza cuando un ítem se resuelva o se descarte)
- **Relacionado con**: [Spec-01](spec/01-motor-de-calculo-ley-73.md),
  [ADR-0012](adr/0012-proyeccion-de-semanas-hasta-la-edad-de-retiro.md),
  [ADR-0010](adr/0010-sbc-promedio-desde-el-historial-de-cotizaciones.md)

## Cómo se lee este documento

La app no es el IMSS: es una **estimación auditable** ([ADR-0006](adr/0006-el-resultado-es-un-desglose-auditable.md)).
Por diseño, el motor aplica lo que está claramente publicado y verificable, y **declara** lo
que estima. Los ítems siguientes son los huecos conocidos entre lo que el motor calcula y
lo que el IMSS resuelve. Ninguno es un error: son límites del alcance, asumidos y publicados.

La numeración legal que se cita es la de la **Ley del Seguro Social de 1973**, que es la que
usa el repositorio de forma consistente (`Art. 167 LSS 1973` = tabla de cuantías básicas,
`Art. 170 LSS 1973` = pensión mínima garantizada, `Art. 171 LSS 1973` = cuantía de la
cesantía en edad avanzada y regla de los seis meses).

## Resumen

| # | Ítem | Gravedad | Estado |
|---|---|---|---|
| 1 | Techo del 100 % del salario promedio (Art. 169 LSS 1973) | Alta: puede inflar la pensión estimada | Documentado, sin resolver |
| 2 | Fracción de año en los incrementos (Art. 167 LSS 1973) | Media: subestima el incremento por semanas excedentes | Documentado, sin resolver |
| 3 | Supuestos de la proyección de semanas | Media: el resultado depende del horizonte supuesto | Documentado, sin resolver |
| 4 | Modalidad 40 y la ventana de 250 semanas | Media: el SBC capturado puede quedar fuera del promedio | Documentado, sin resolver |
| 5 | Porcentaje del Art. 171 sobre la cuantía básica, no sobre la vejez | Media: la cesantía se estima por debajo de la cantidad legal | Documentado, sin resolver |

---

## 1. Techo del 100 % del salario promedio (Art. 169 LSS 1973)

### Qué falta

El motor **no topa la cuantía** al 100 % del salario promedio. La cuantía se compone de la
cuantía básica, los incrementos anuales, el incremento del 11 %, el factor por edad, las
asignaciones familiares y la ayuda asistencial; ninguna de esas piezas se recorta contra un
techo del 100 % del salario promedio.

### Por qué importa

El Art. 169 LSS 1973 fija el techo de la cuantía de vejez: la pensión **no puede exceder el
100 % del salario promedio** que sirvió de base para el cálculo. Es un límite legal, no un
supuesto del método: un asegurado con muchas semanas cotizadas y un SBC alto puede tener
una cuantía básica y unos incrementos que, sumados, rebasan ese techo, y el resultado que
muestra la app quedaría por encima de lo que el IMSS resolvería.

Los topes que el motor **sí** aplica son otros dos, y no cubren este hueco:

- el **tope de cotización de 25 UMA** (Art. 28 LSS vigente), que limita el SBC *diario*
  que entra al cálculo (`src/services/pension/steps/AverageSalaryStep.ts:74`);
- el **tope de pensión de 25 UMA mensuales** y la **pensión mínima garantizada** (Art. 170
  LSS 1973), aplicados al final (`src/services/pension/steps/LimitsStep.ts:38` y
  `src/services/pension/steps/LimitsStep.ts:48`).

Ninguno de los dos es el techo del Art. 169: el tope de 25 UMA es mucho más alto que el
salario promedio de la mayoría de los asegurados, así que una cuantía puede estar por
debajo de 25 UMA y aun así rebasar el 100 % de su propio salario promedio.

### Dónde está el código afectado

- `src/services/pension/steps/BasicQuantityStep.ts:58` — calcula la cuantía básica sin
  techo: `effectiveDailySalary × 365 × basicQuantityPct ÷ 12`.
- `src/services/pension/steps/AnnualIncrementsStep.ts:34` — suma los incrementos anuales
  sobre la cuantía básica, sin techo.
- `src/services/pension/steps/FamilyAssignmentsStep.ts:21` y
  `src/services/pension/steps/AssistanceAidStep.ts:20` — suman asignaciones y ayuda
  asistencial sobre la cuantía con factor, también sin techo.
- `src/services/pension/steps/LimitsStep.ts:19` — calcula el total bruto y solo lo contrasta
  contra el tope de 25 UMA y la PMG. Es el punto natural donde entraría el techo del 100 %,
  porque es donde ya se conocen la cuantía y el salario promedio.

### Qué no se hizo a propósito

No se añadió el techo porque **no se pudo verificar el criterio operativo exacto** con el
que el IMSS lo aplica (sobre qué salario promedio, si incluye asignaciones y ayuda
asistencial, cómo se combina con el factor por edad y con el tope de 25 UMA). Implementar un
techo con una hipótesis propia sería peor que no tenerlo: la app publicaría un número con
apariencia de exacto detrás de una regla que nadie verificó. Se prefirió dejar el hueco
documentado, y que el usuario compare su resultado con la resolución oficial.

---

## 2. Fracción de año en los incrementos anuales (Art. 167 LSS 1973)

### Qué falta

El incremento anual por semanas excedentes se otorgan **solo por años completos**. El
cálculo es `floor(excessWeeks / 52)`: 26 semanas excedentes no otorgan ningún incremento, y
las fracciones de 13 a 26 semanas tampoco.

La ley reconoce la fracción: por cada año completo (52 semanas) cotizado por encima de las
500 semanas se incrementa la cuantía en el porcentaje de la cuantía básica, y las fracciones
de 13 a 26 semanas excedentes se reconocen con el **50 % del incremento** que corresponde a
un año completo.

### Por qué importa

El Art. 167 LSS 1973 es la fuente de la cuantía básica y de los incrementos por semanas
excedentes. El caso afectado es concreto: un asegurado con 520 semanas cotizadas tiene 20
semanas excedentes; con la regla actual el motor no otorga incremento alguno, mientras que
la ley reconocería la fracción. Cuanto más cerca de un múltiplo de 52 queda el total, mayor
es la diferencia entre lo que calcula el motor y lo que calcula el IMSS.

No es un error de redondeo: es una regla entera que descarta un derecho que la ley
reconoce. Como el propio motor declara su fórmula en el desglose
(`floor((semanas − 500) / 52) × …% × SBC_diario × 365 ÷ 12`), la diferencia es auditable.

### Dónde está el código afectado

- `src/services/pension/steps/AnnualIncrementsStep.ts:22` — `const excessYears =
  Math.floor(excessWeeks / WEEKS_PER_YEAR);` descarta la fracción.
- `src/services/pension/steps/AnnualIncrementsStep.ts:34` — `annualIncrements` multiplica el
  porcentaje del año completo por `excessYears`.
- `src/services/pension/steps/AnnualIncrementsStep.ts:46` — la fórmula que se publica en el
  desglose refleja el mismo `floor`.
- `src/constants/ley73.ts:286` — `WEEKS_PER_YEAR = 52`, la base del año cotizado completo.
- `src/constants/ley73.ts:61` — `ART167_TABLE`, con `annualIncrementPct` por rango salarial
  (el porcentaje del año completo; el de la fracción sería la mitad).

### Qué no se hizo a propósito

No se implementó la fracción porque requiere **dos decisiones que no son del motor**: el
porcentaje aplicable a la fracción (¿la mitad del incremento anual, como sugiere la regla
general?) y la forma de redondear la parte proporcional. Además, el umbral de 13 semanas
que activa la fracción y su interacción con el redondeo a dos decimales (`round2`) son
detalles que conviene contrastar con el protocolo del IMSS antes de fijarlos en código y
en las pruebas. Se dejó documentado en vez de fijar una constante legal sin fuente
verificada, porque `AGENTS.md` exige que las constantes normativas lleven su fuente.

---

## 3. Supuestos de la proyección de semanas hasta la edad de retiro

### Qué falta

La proyección a la edad de retiro asume **cotización continua** hasta jubilarse: se
proyectan `(edad de retiro − edad actual) × 52` semanas, sin huecos, y se supone el mismo
SBC que el capturado hoy. **No** se modela:

- ceses o periodos sin empleo antes de la edad de retiro;
- cambios de salario futuros (un aumento o una disminución);
- cotizaciones por debajo del salario mínimo general;
- la diferencia entre la fecha de la constancia y la fecha real de la estimación.

Tampoco hay una **prueba de sensibilidad**: ningún caso de la suite vary el horizonte para
medir cuánto se mueve el resultado.

### Por qué importa

La proyección no es decorativa: es la que determina **con qué total de semanas se calcula**
la pensión (Arts. 138 y 145 LSS 1973 para el mínimo de 500 semanas, y Art. 167 LSS 1973
para los años excedentes). Un asegurado a 40 años con 300 semanas cotizadas puede quedar
por encima o por debajo de las 500 según el horizonte que se suponga, y la cuantía cambia
con ello.

El motor sí declara el supuesto donde ocurre —el paso de incrementos anuales marca
`isEstimate` y su `assumption` cuando hay semanas proyectadas—, pero una estimación sin
sensibilidad medida es difícil de auditar frente a la respuesta oficial.

### Dónde está el código afectado

- `src/utils/weeksProjection.ts:62` — `yearsToRetirement` y `projectedWeeks` se calculan
  como una recta: `retirementAge − age` por 52 semanas.
- `src/utils/weeksProjection.ts:64` — `targetWeeks` suma las semanas actuales al mayor
  entre proyección y Modalidad 40.
- `src/services/pension/steps/AnnualIncrementsStep.ts:20` — `excessWeeks` sale de
  `targetWeeks`, es decir, del horizonte supuesto.
- `src/validation/pensionSchema.ts:8` — el mismo cálculo sostiene el mensaje de validación
  del mínimo de 500 semanas, de modo que el hueco se propaga a la captura.
- `src/components/WorkHistoryStep.tsx:46` — la nota que declara el supuesto al usuario.

### Qué no se hizo a propósito

No se modelaron ceses ni cambios de salario porque hacerlo exige **datos que la app no
tiene**: el usuario no declara su situación laboral futura. Se prefirió un supuesto
explícito y visible (el mismo texto que comparten el motor y la validación, ver
[ADR-0012](adr/0012-proyeccion-de-semanas-hasta-la-edad-de-retiro.md)) frente a un modelo
de simulación que se presentaría con más precisión de la que tiene. Tampoco se añadió la
prueba de sensibilidad porque es un caso de prueba sobre datos hipotéticos, no sobre
comportamiento verificable del sistema.

---

## 4. Modalidad 40 y la ventana de 250 semanas del promedio

### Qué falta

El paso del SBC promedio pondera el promedio de las 250 semanas de referencia así:

```
m40Weeks   = min(mesesM40 × 52/12, 250)
baseWeeks  = 250 − m40Weeks
promedio   = (SBC_régimen × baseWeeks + SBC_M40 × m40Weeks) ÷ 250
```

Con un horizonte de Modalidad 40 largo (p. ej. 420 meses hasta la edad de retiro), ese
mínimo **satura** las 250 semanas de referencia: `m40Weeks` vale 250, `baseWeeks` vale 0 y
el promedio ponderado es **exactamente el SBC de Modalidad 40**, sin ninguna semana del
régimen obligatorio. El SBC que el usuario capturó —que describe su historial real— puede
quedar completamente fuera del promedio ponderado.

### Por qué importa

El Art. 167 LSS 1973 exige el promedio del SBC de las últimas 250 semanas cotizadas. La
Modalidad 40 no es una cotización más: es una aportación voluntaria que se suma a las
semanas del régimen obligatorio, y el IMSS pondera **la historia real del asegurado** con
las semanas de M40. La ponderación actual es una aproximación que, en el extremo, sustituye
el promedio histórico por un solo valor.

El propio motor lo reconoce: cuando hay ajuste por M40 empuja un aviso de que "el IMSS
calculará el promedio exacto con tu historial completo", y marca el paso como
`isEstimate`. La consecuencia práctica es que **el SBC que el usuario ve en el formulario y
el que usa el motor no son el mismo número** en este escenario.

### Dónde está el código afectado

- `src/services/pension/steps/AverageSalaryStep.ts:46` — `const m40Weeks =
  Math.min(modalidad40.expectedMonths * WEEKS_PER_MONTH, referenceWeeks);` el `min` que
  satura.
- `src/services/pension/steps/AverageSalaryStep.ts:47` — `baseWeeks = referenceWeeks −
  m40Weeks`, que llega a cero.
- `src/services/pension/steps/AverageSalaryStep.ts:60` — el promedio ponderado que sale de
  esa división.
- `src/utils/modalidad40.ts:89` — el mismo `min` replicado en el resumen que muestran las
  pantallas (`calculateM40Summary`), para que la UI y el motor no se contradigan.
- `src/hooks/usePensionForm.ts:45` — `expectedMonthsForHorizon`: el horizonte de meses de
  M40 que alimenta el cálculo (por defecto, los meses hasta la edad de retiro, acotados a
  600).
- `src/components/Modalidad40Step.tsx:68` — el campo «Meses cotizando en M40 (estimado)»,
  derivado y de solo lectura, que es la fuente del horizonte.

### Qué no se hizo a propósito

No se resolvió porque **es una decisión de producto y legal, no de código**. Las salidas
posibles cambian lo que la app afirma:

1. **Advertir y no ponderar**: usar el SBC capturado y mostrar el SBC de M40 aparte, como
   referencia, sin alterar el promedio.
2. **Ponderar contra el horizonte real**: repartir el peso entre el régimen obligatorio y M40
   según un horizonte acotado, no según las 250 semanas de referencia.
3. **Pedir el dato**: que el usuario indique cuánto de su horizonte es M40 y qué SBC tendrá
   en ese periodo, y calcular el promedio ponderado con eso.

Ninguna se puede elegir sin contrastar el criterio del IMSS y sin decidir qué espera la
persona usuaria de la cifra que ve. Se dejó documentado en vez de fijar una regla en el
código que pudiera tener que deshacerse.

---

## 5. El porcentaje del Art. 171 se aplica sobre la cuantía básica, no sobre la vejez

### Qué falta

El Art. 171 LSS 1973 expresa la cuantía de la cesantía en edad avanzada como un
**porcentaje de la cuantía de la pensión de vejez** que le hubiera correspondido al
asegurado de haber alcanzado 65 años:

| Edad | Cuantía de la cesantía |
|---|---|
| 60 años | 75 % |
| 61 años | 80 % |
| 62 años | 85 % |
| 63 años | 90 % |
| 64 años | 95 % |

El motor aplica ese mismo porcentaje, pero **sobre la cuantía básica** (cuantía básica +
incrementos anuales + incremento del 11 % del decreto), no sobre la cuantía de vejez. La
diferencia es que la cuantía de vejez que la ley toma como referencia **ya traería
incorporados los incrementos de los años que a la edad avanzada todavía no se alcanzan**:
el asegurado que se jubila a los 60 años sí cotizó los años excedentes, pero la vejez
hipotética a los 65 los incorpora con más antigüedad y, con ella, con el porcentaje de
incremento anual que corresponde a esa antigüedad.

### Por qué importa

La ley no dice "75 % de tu cuantía básica", sino "75 % de la vejez que te habría
correspondido a los 65 años". Cuando el asegurado tiene **semanas excedentes** (más de 500
cotizadas), las dos bases son distintas y el motor **subestima la cesantía**: la cantidad
que el IMSS resolvería sería mayor que la que la app muestra.

El caso concreto: un asegurado con 600 semanas cotizadas y un SBC alto. Su cuantía de
vejez a los 65 años incluye incrementos anuales por los años excedentes; la cuantía de
cesantía al 75 % de esa vejez puede quedar por encima de la cuantía básica que el motor
multiplica por 0.75. La diferencia crece con las semanas excedentes y con el SBC, y es
mayor en el extremo más bajo de la escala (60 años) que en el de 64.

La diferencia no se puede cuantificar aquí sin decidir cómo el IMSS lleva la antigüedad
declarada a los 65 años (¿las mismas semanas, incrementadas con los años que faltan?), y
esa decisión no está publicada con el detalle que el motor necesita.

### Dónde está el código afectado

- `src/services/pension/steps/AgeFactorStep.ts:49` — `const quantityWithFactor =
  round2(subtotalBeforeFactor * ageFactor);`: el factor se aplica sobre
  `subtotalBeforeFactor`, no sobre una cuantía de vejez calculada aparte.
- `src/services/pension/steps/AgeFactorStep.ts:46` — `ageFactor =
  CESANTIA_AGE_FACTORS[clampedAge]`: la tabla de porcentajes del Art. 171.
- `src/services/pension/steps/DecreeIncrementStep.ts:39` — `subtotalBeforeFactor:
  subtotalWithDecree`: la base sobre la que se aplica el factor es la cuantía básica más
  los incrementos anuales más el 11 % del decreto.
- `src/services/pension/steps/AnnualIncrementsStep.ts:35` — `subtotalBeforeFactor =
  round2(basicAmount + annualIncrements)`: los incrementos anuales, que son precisamente
  la parte que separa la base del motor de la vejez de referencia.
- `src/constants/ley73.ts:237` — `CESANTIA_AGE_FACTORS`, la tabla 60→75 %, …, 64→95 %, con
  su fuente en el Art. 171 LSS 1973.

### Qué no se hizo a propósito

No se corrigió porque exigiría **calcular una cuantía de vejez hipotética a los 65 años**
—con sus propios incrementos anuales, calculados sobre las semanas que el asegurado
tendría a esa edad— y decidir después cuál de las dos cuantías es la base legal del
porcentaje. Eso es un supuesto normativo sobre el que el motor publicaría un número con
apariencia de exacto, y la diferencia entre las dos lecturas solo la puede desambiguar la
resolución oficial. La app prefiere **declarar** el criterio que usa (el propio desglose
publica la fórmula «Cuantía × 75 %») y dejar el hueco documentado, para que quien compare
su resultado con la respuesta del IMSS sepa que esta cifra puede quedarse corta.

---

## Relación con las specs

Las specs **no** contradicen este documento: describen lo que el sistema hace, y lo que el
sistema hace está aquí delimitado. Las remisiones explícitas viven en la sección «Fuera de
alcance» de cada spec afectada:

- [Spec-01](spec/01-motor-de-calculo-ley-73.md) — remite a los cinco ítems.
- [Spec-07](spec/07-historial-de-cotizacion-y-promedio-sbc.md) — remite al ítem 4 (el
  promedio del SBC y la ventana de 250 semanas).

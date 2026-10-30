# Investigación — Modalidad 10: incorporación voluntaria al régimen obligatorio

Bitácora documental de la revisión legal que acompaña al
[ADR-0014](../adr/0014-modalidad-10-incorporacion-voluntaria-al-régimen-obligatorio.md).

**Regla de este documento:** se citan literalmente los artículos que se pudo abrir y leer en
su fuente primaria. Lo que no se pudo comprobar queda anotado como pendiente, nunca como
hecho.

---

## 1. Fuentes consultadas

| # | Documento | Fuente | Estado |
|---|---|---|---|
| 1 | Ley del Seguro Social **vigente** (última reforma DOF 15-ene-2026) | `https://www.imss.gob.mx/sites/all/statics/pdf/leyes/LSS.pdf` | Texto leído |
| 2 | **Ley del Seguro Social de 1973** (Ley 73, última reforma DOF 29-dic-1994) | `https://www.imss.gob.mx/sites/all/statics/pdf/leyes/4129_LSS_1973.pdf` | Texto leído |
| 3 | **Anexo A — Informe del Consejo Técnico del IMSS** (dic-2024), Cuadro A.1 "Modalidades de aseguramiento por tipo de régimen" | `https://www.imss.gob.mx/sites/all/statics/pdf/informes/20242025/15-anexos.pdf` | Texto leído |
| 4 | **Acuerdo ACDO.AS2.HCT.101026/302.P.DG** (Consejo Técnico del IMSS, aprobado 10-oct-2026, DOF 21-oct-2026, vigente 22-oct-2026) | DOF / SIDOF nota 5801708 | **Pendiente**: no se pudo abrir el articulado; el resumen proviene de la nota de prensa de Infobae del 22-oct-2026 |
| 5 | **Reglamento de la Ley del Seguro Social** (el artículo que nombra "Modalidad 10") | — | **Pendiente**: no se pudo abrir el texto reglamentario |

---

## 2. Lo que dice la ley, literalmente

### 2.1 Sujetos de la incorporación voluntaria — Art. 13 fr. I LSS vigente

> **I. Los trabajadores independientes o por cuenta propia**;
> *(fracción reformada DOF 01-dic-2023)*

### 2.2 El capítulo de la incorporación voluntaria — Arts. 222 a 233 LSS vigente

> **Artículo 222.** La incorporación voluntaria de los sujetos a que se refiere el presente
> capítulo, se realizará **por convenio** y se sujetará a las siguientes modalidades:

> **Artículo 224.** Los sujetos de aseguramiento comprendidos en este capítulo cotizarán por
> mensualidad, bimestralidad, semestralidad o anualidad adelantadas, a elección del asegurado.
> En el caso de pago en parcialidades **no se les aplicarán al importe a pagar
> actualizaciones ni recargos**.

> **Artículo 227.** Las cuotas obrero patronales correspondientes a los sujetos de este
> capítulo se cubrirán con base en:
> **I. Los ingresos reportados** provenientes de la actividad que dio origen al
> aseguramiento, para los sujetos a que se refiere la fracción I del artículo 13 de esta Ley.
> Para efectos del cálculo de las cuotas obrero patronales se considerarán los **límites
> establecidos en el artículo 28** de la presente Ley.

> **Artículo 228.** A las bases de cotización señaladas en el artículo anterior, se les
> aplicarán las **primas de financiamiento** que establece esta Ley y que corresponden a los
> seguros que, en cada caso, comprenda el esquema de protección, **reduciendo la parte
> proporcional** relativa a las prestaciones que se excluyen.

> **Artículo 231.** La incorporación voluntaria al régimen obligatoria establecida en el
> artículo 13, fracciones I y V, termina por declaración expresa firmada por el sujeto o
> grupo de asegurados, o por no pagar las cuotas correspondientes.

**Qué se deduce para el código:** la base es el **ingreso declarado**; la cuota se arma con
las primas de financiamiento de los ramos incluidos y **reduce** la parte de las prestaciones
que se excluyen (de ahí el criterio de excluir INFONAVIT, que es ahorro adicional y no una
prima); y la cotización es **por adelantado**, sin meses retroactivos.

### 2.3 Los límites del SBC — Art. 28 LSS vigente

> **Artículo 28.** Los asegurados se inscribirán con el salario base de cotización que
> perciban en el momento de su afiliación, estableciéndose como **límite superior** el
> equivalente a **veinticinco veces el salario mínimo general** que rija en el Distrito Federal
> y como **límite inferior el salario mínimo general del área geográfica respectiva**.

La misma regla, con la redacción de 1973, está en el **Art. 33 de la Ley 73**:

> **Artículo 33.-** Los asegurados se inscribirán con el salario base de cotización que
> perciban en el momento de su afiliación, estableciéndose como límite superior el equivalente
> a veinticinco veces el salario mínimo general que rija en el Distrito Federal y como límite
> inferior el salario mínimo general del área geográfica respectiva.

**Qué se deduce para el código:** el rango del SBC declarado es
**[salario mínimo de la zona, 25 UMA]**. La app no conoce la zona y usa el SMG de la Zona A
(CDMX), el más alto — el mismo proxy que ya usa para la pensión mínima garantizada.

### 2.4 El promedio — Art. 167 Ley 73

> **Artículo 167.** Las pensiones anuales de invalidez y de vejez se compondrán de una cuantía
> básica y de incrementos anuales computados de acuerdo con el número de cotizaciones
> semanales reconocidas al asegurado con posterioridad a las primeras quinientas semanas de
> cotización.
> […]
> Para los efectos de determinar la cuantía básica anual de la pensión y sus incrementos, se
> considera como **salario diario el promedio correspondiente a las últimas doscientas
> cincuenta semanas de cotización**. […]
> El salario diario que resulte se expresará en **veces el Salario Mínimo General** para el
> Distrito Federal vigente en la fecha en que el asegurado se pensione, a fin de determinar el
> grupo de la tabla en que el propio asegurado se encuentre. […]
> El derecho al incremento anual se adquiere por **cada cincuenta y dos semanas** más de
> cotización.

**Qué se deduce para el código:** el promedio es de **250 semanas cotizadas** (no calendario)
y los meses de M10 son cotizaciones: entran al promedio con el SBC con el que se cotizan.
Por eso la app los integra en la línea temporal y no los pondera aparte.

### 2.5 La continuidad del régimen anterior — Art. 194 Ley 73

> **Artículo 194.** El asegurado con un mínimo de cincuenta y dos cotizaciones semanales
> acreditadas en el régimen obligatorio, al ser dado de baja tiene el derecho a **continuar
> voluntariamente** en el mismo, bien sea en los seguros conjuntos de Enfermedades y
> maternidad y de invalidez, vejez, cesantía en edad avanzada y muerte, o bien en cualquiera de
> ambos a su elección, pudiendo quedar inscrito en el grupo de salario a que pertenecía en el
> momento de la baja o en el grupo inmediato inferior o superior.

**Qué se deduce para el código:** la continuidad voluntaria existe también en el régimen
anterior, pero atada al **grupo de salario**. La app deja elegir el SBC de forma continua y
**no modela** esas bandas: es un supuesto declarado, no una regla reproducida.

### 2.6 El catálogo de modalidades — Anexo A del Informe del Consejo Técnico (dic-2024)

> **Régimen Obligatorio — Modalidad 10 — "Trabajadores permanentes y eventuales de la
> ciudad"** (con derecho a SRT, SEM, SIV, SRCV y SGPS).
> […]
> **Régimen Voluntario — Modalidad 40 — "Continuación voluntaria en el Régimen Obligatorio"**.

**Qué se deduce para el código:** el número de modalidad tiene más de un uso en la práctica
del IMSS: en el catálogo de modalidades de aseguramiento la 40 es la continuación voluntaria
y la 10 es la del trabajador permanente y eventual; en las guías de
`imss.gob.mx/personas-trabajadoras-independientes` la **Modalidad 10 es el esquema de
incorporación voluntaria del trabajador independiente**. El producto usa este segundo
significado, que es el que corresponde al sujeto del Art. 13 fr. I.

---

## 3. El acuerdo de octubre de 2026 (contexto)

**ACDO.AS2.HCT.101026/302.P.DG**, aprobado por el Consejo Técnico del IMSS el 10-oct-2026,
publicado en el DOF el 21-oct-2026, vigente desde el 22-oct-2026. Según la nota de prensa
de Infobae del 22-oct-2026, la medida es **temporal** y:

- las nuevas inscripciones a la Modalidad 40 se hacen con el **último salario registrado o
  hasta una UMA por encima** (UMA 2026: $117.31/día según esa nota);
- **se eliminan los pagos retroactivos**: "los nuevos aseguramientos a la Continuación
  Voluntaria se realizarán exclusivamente a partir de la fecha de la solicitud";
- la Modalidad 10 (trabajador independiente) **no puede coexistir** con la Modalidad 40;
- la cuota no cambia en esa modificación.

**Qué se deduce para el código:** el acuerdo **no modifica la Modalidad 10** y sí explica por
qué el asegurado del régimen anterior conviene a esta modalidad. Además, su regla de "sin
pagos retroactivos" coincide con lo que la app ya hacía: el periodo de M10 empieza el 1º del
mes siguiente a la fecha de referencia.

> **Pendiente**: el articulado del acuerdo debe abrirse en el DOF (SIDOF nota 5801708) antes
> de publicar la app, para citarlo sin depender de la nota de prensa.

---

## 4. Lo que queda pendiente de verificar

1. **El artículo del Reglamento de la Ley del Seguro Social que nombra "Modalidad 10"** y su
   redacción exacta. La constante `MODALIDAD_10_ARTICLE` cita el Art. 222 de la LSS vigente
   (el fundamento de la incorporación voluntaria, verificado) y **no** un artículo
   reglamentario sin comprobar. Si al abrir el texto reglamentario se confirma un artículo
   específico, se documenta en la constante con su fecha de publicación.
2. **La cuota base de la Modalidad 10 sin INFONAVIT ni Riesgos de Trabajo.** La constante
   `MODALIDAD_10_BASE_CUOTA_PCT` (18.30 %) viene de fuentes secundarias y de la calculadora
   pública del IMSS; la fuente primaria es el **Acuerdo de la Junta Directiva** que fija las
   cuotas y las primas de financiamiento por ramo, publicado en el DOF. Hasta confirmarlo, el
   campo de costo se presenta como **estimado**.
3. **La clase de riesgo laboral y su prima de Riesgos de Trabajo.** Las primas por clase
   (`MODALIDAD_10_RT_PRIMA`) son oficiales (Art. 71 LSS vigente); lo que falta verificar es el
   catálogo **División/Grupo → clase** (`src/constants/ocupaciones.ts`), que es una muestra
   parcial de dos niveles y no sustituye al RACERF (que asigna la clase por fracción).
4. **La UMA 2026 y el SMG de la Frontera Norte.** `UMA_ACTUAL` y `smgFronteraNorte` 2026
   siguen marcadas como estimación en `src/constants/uma.ts`; el SMG general 2026 sí tiene
   fuente oficial (CONASAMI). El piso de la Modalidad 10 depende del SMG de la zona, no de la UMA.

---

## 5. Cómo se comprueba en el código

| Regla legal | Dónde vive | Cómo se verifica |
| --- | --- | --- |
| Piso = SMG y techo = 25 UMA | `src/constants/ley73.ts` (`MODALIDAD_10_CAP_TIMES_UMA`), `src/utils/modalidad10.ts` (`m10SalaryRange`, `clampM10Salary`) | `src/__tests__/modalidad10.test.ts` |
| Ingreso declarado como base | `src/hooks/usePensionForm.ts` (`setModalidad10ContributionSalary`, `setModalidad10UMAs`) | `src/__tests__/usePensionForm.test.ts` |
| Cotización por adelantado, sin meses retroactivos | `src/utils/modalidad10.ts` (`getM10StartDate`) | `src/__tests__/modalidad10.test.ts` |
| Prima de financiamiento sin INFONAVIT | `src/constants/ley73.ts` (`MODALIDAD_10_BASE_CUOTA_PCT`, `MODALIDAD_10_CUOTA_EXCLUDES_INFONAVIT`) | `src/__tests__/modalidad10.test.ts` |
| Prima de Riesgos de Trabajo por clase | `src/constants/ley73.ts` (`MODALIDAD_10_RT_PRIMA`, `MODALIDAD_10_RISK_CLASS_LABELS`) | `src/__tests__/modalidad10.test.ts` |
| Ocupación → clase de riesgo | `src/constants/ocupaciones.ts` (`M10_OCCUPATION_CATALOG`, `resolveRiskClass`) | `src/__tests__/ocupaciones.test.ts` |
| Promedio de 250 semanas cotizadas con los meses de M10 | `src/services/pension/history/projectedSBC.ts` | `src/__tests__/projectedSBC.test.ts` |
| El desglose narra los mismos números | `src/services/pension/steps/AverageSalaryStep.ts` | `src/__tests__/pensionCalculator.test.ts` |
| Los límites se validan antes de calcular | `src/validation/pensionSchema.ts` | `src/__tests__/pensionSchema.test.ts` |

# ADR-0005 — Las constantes legales viven en módulos separados del código

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: `src/constants/`

## Contexto

El cálculo depende de valores normativos que cambian con cada reforma y con cada
actualización administrativa:

- La **tabla del Art. 167 LSS 1973** (cuantía básica e incrementos anuales por rango
  salarial).
- Los valores de **UMA y SMG** por año, con su fecha de vigencia.
- El **incremento del 11 %** del decreto DOF 2001/2004.
- Los **topes**: 25 UMA de cotización (Art. 28 LSS vigente), y la pensión mínima
  garantizada.
- Las **constantes de cálculo**: 250 semanas de promedio, 30.4 días por mes, 52 semanas
  por año.

Estos valores son la parte del sistema que **cambia con más frecuencia** y la que, si
está mal, produce un error legal. Al mismo tiempo, son los más atractivos para un
desarrollador que quiere "optimizar" un archivo: son constantes que se pueden inlinear
en una expresión sin que nada falle.

## Decisión

**Los valores normativos viven en módulos dedicados, fuera del código de cálculo.**

- `src/constants/ley73.ts` — tabla del Art. 167, constantes de la ley (500 semanas
  mínimas, 250 semanas de promedio, topes, días por mes), y el incremento por decreto.
- `src/constants/uma.ts` — valores de UMA y SMG por año, con la fecha de vigencia.
- `src/constants/infoLegal.ts` — los textos educativos y las referencias legales que
  muestra la sección de información.

Reglas que acompañan la decisión:

- **Cada constante lleva su origen en el comentario.** No hay un número mágico sin
  fuente: artículo, decreto o tabla.
- **Los valores que son estimaciones están marcados como tales.** El comentario de la
  tabla del Art. 167 dice explícitamente que los porcentajes están interpolados de la
  tabla oficial y que hay que verificarlos con el IMSS. La app no disimula qué sabe y qué
  supone.
- **Una constante tiene un solo hogar.** Si un valor aparece en dos archivos, es un
  bug: el motor consume la constante compartida.
- **Actualizar un valor no toca el motor.** El procedimiento está en
  [`../runbooks/05-actualizar-uma-y-constantes-legales.md`](../runbooks/05-actualizar-uma-y-constantes-legales.md).

## Consecuencias

### Positivas

- **Actualizar la ley es una edición localizada**: se toca un archivo, no una búsqueda
  en el motor.
- La provenance de cada valor es auditable leyendo el archivo. Quien audita el software
  puede contrastar número por número contra la fuente.
- Las pruebas del motor son estables: si cambia una tabla, se actualiza el caso de test
  esperado, no la lógica.
- La separación hace visible qué parte del software es *código* y qué parte es *derecho*.

### Costes

- **Los datos normativos son código y hay que mantenerlos.** Una tabla legal transcrita
  a mano es un commitment: cada reforma exige actualizarla.
- El motor tiene que importar de varios módulos de constantes, lo que suma imports en
  cada paso del pipeline.
- Hay una tentación permanente de "optimizar" un módulo de constantes. Se mitiga con la
  regla de que los valores no se tocan sin actualizar su comentario de origen.

## Alternativas descartadas

- **Constantes inlineadas en cada paso.** Se descartó porque el día que un valor se
  corrige en un archivo y no en otro, el motor queda inconsistente sin que nada falle.
- **Un único archivo `constants.ts`.** Se descartó porque mezcla la ley con lo que no es
  ley; el corte por dominio legal hace la auditoría más simple.
- **Tablas en JSON externo.** Se descartó porque perderían el comentario de origen, que
  es justo lo que hace auditable la tabla. JSON no admite comentarios.
- **Fetch de las tablas desde un servidor.** Se descartó por
  [ADR-0002](0002-cero-backend-todo-en-el-dispositivo.md) y porque convierte cada cálculo
  en una llamada de red.

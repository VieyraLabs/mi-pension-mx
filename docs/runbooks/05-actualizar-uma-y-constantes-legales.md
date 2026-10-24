# Runbook-05 — Actualizar UMA y constantes legales

## Cuándo se usa

Cuando el IMSS publica una nueva Unidad de Medida y Actualización (UMA), cuando cambia la
tabla del Art. 167, o cuando hay una reforma a la Ley del Seguro Social.

## Antes de empezar

- [ ] La fuente oficial está identificada: la publicación del DOF o del portal del IMSS.
      **No se transcriben valores de memoria ni de un blog.**
- [ ] Se sabe desde **qué fecha** aplica el valor nuevo, y qué pasa con el histórico.

## Pasos

### 1. Actualizar los valores de UMA

En `src/constants/uma.ts`:

- Añadir la entrada del año nuevo con su valor y **su fecha de vigencia**.
- Actualizar el valor vigente por defecto, que es el que usa la app cuando el usuario no
  indica un año.
- Actualizar el año por defecto.

Cada entrada lleva su comentario con la referencia de la publicación.

### 2. Actualizar la tabla del Art. 167 (si cambió)

En `src/constants/ley73.ts`, en `ART167_TABLE`:

- Actualizar los porcentajes de cuantía básica y de incremento anual por rango salarial.
- **Cada entrada conserva su comentario de origen**: artículo, tabla y la advertencia de
  que los porcentajes son de referencia y hay que verificarlos con el IMSS.

### 3. Actualizar los topes y la pensión mínima garantizada

En `src/constants/ley73.ts`:

- `SBC_CAP_TIMES_UMA` (tope de cotización, 25 UMA por el Art. 28 LSS vigente).
- `MODALIDAD_40_CAP_TIMES_UMA` (tope de la Modalidad 40).
- El mínimo de la pensión garantizada, si cambió.

### 4. Registrar la provenancia documental (obligatorio)

Toda constante nueva o modificada en `src/constants/ley73.ts` y `src/constants/uma.ts`
debe quedar con su comentario de provenancia: fuente (artículo de la Ley o del
Reglamento; INEGI/CONASAMI para UMA/SMG), publicación de origen (DOF, con fecha)
y vigencia o año aplicable. Si el valor es una estimación o un criterio operativo
(no proviene del texto legal), se marca explícitamente como tal.

Este registro **no es opcional**: sin él, el cambio no está completo aunque los
tests pasen — la suite no valida la fuente; solo una revisión humana puede.

### 5. Revisar el uso del año en el resto del código

La app usa el año de la UMA en:

- `src/hooks/usePensionForm.ts` (valor por omisión del selector).
- `src/screens/UMAStep.tsx` (selector de año).
- `src/services/pension/steps/AverageSalaryStep.ts` (cálculo del tope).

Revisar que el año por omisión apunte al nuevo.

### 6. Actualizar las pruebas

Los casos del motor fijan valores esperados. Con una UMA nueva, esos valores cambian.

```bash
npm run test:run
```

**Un test que falla aquí no es un test que se actualiza a ciega.** Hay que comprobar que
el nuevo valor esperado sale de la fuente oficial, no de "lo que devuelve el código".

### 7. Si cambió una regla de cálculo

Un cambio en las reglas no es un cambio de constantes: es un cambio de motor. En ese
caso se sigue el [Runbook-03](03-agregar-una-etapa-al-pipeline.md) y se escribe el ADR
que lo explica.

## Verificación

- [ ] Toda constante tocada lleva comentario de provenancia: fuente (DOF/INEGI/CONASAMI o artículo), fecha de publicación y vigencia/año.
- [ ] Los valores nuevos coinciden con la fuente oficial, comprobados uno por uno.
- [ ] La app usa el valor vigente por omisión.
- [ ] La suite pasa.
- [ ] Un cálculo de referencia con el valor anterior y con el nuevo da el resultado
      esperado, y la diferencia se explica con la norma.
- [ ] Si hubo cambio de reglas, hay un ADR y una spec actualizados.

## Si algo falla

**Los tests fallan en masa.** Es lo esperable: el motor depende del valor de UMA a
través del tope y del mínimo garantizado. Revisar cada fallo con la fuente a la vista.

**El mínimo garantizado no cuadra.** El valor del mínimo suele venir en fracciones de
UMA y hay que convertirlo a pesos con la UMA del año correspondiente. Revisar el redondeo
en `LimitsStep`.

**El usuario reporta un resultado distinto al del IMSS.** Comparar el desglose paso a
paso. La diferencia suele estar en el promedio del SBC (no en la UMA): ver
[Spec-07](../spec/07-historial-de-cotizacion-y-promedio-sbc.md).

# ADR-0006 — El resultado es un desglose auditable de pasos, no un número

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: `src/models/`, `src/services/pension/`

## Contexto

Una estimación de pensión es, para el usuario, una cifra que puede llevar a una ventanilla del
IMSS. El valor de la app no es el número: es **la confianza de que el número se sostiene**.

Un resultado que solo devuelve "la pensión mensual estimada es $12,345.67 MXN" es
indistinguible de un resultado inventado. El usuario no tiene forma de saber de dónde
salió, si el topé se aplicó, ni qué parte es estimación y qué parte es ley.

El sector tiene además una asimetría: el usuario sabe mucho más de su caso que la app, y
va a compararlo con la respuesta oficial. Si la app no muestra su trabajo, cualquier
diferencia se lee como error de la app.

## Decisión

**El resultado del cálculo es un desglose, y el número es su último paso.**

`PensionResult` incluye un array `steps: CalculationStepResult[]`. Cada paso lleva:

| Campo | Qué aporta |
|---|---|
| `title` | Nombre del paso, con su número de orden |
| `description` | Qué pasó, en prosa, con los valores concretos |
| `value` | El monto o porcentaje que produjo ese paso |
| `formula` | La fórmula aplicada, escrita como la escribiría un humano |
| `legalBasis` | El artículo, decreto o tabla que lo respalda |
| `isEstimate` | Si el valor es exacto o estimado |
| `assumption` | El supuesto concreto que se hizo, cuando lo hay |

Reglas que acompañan la decisión:

- **Cada paso del pipeline empuja su propio rastro** a `ctx.steps`. El desglose no se
  arma al final: se arma durante el cálculo, por el mismo código que produce los números.
- **El último paso es el resultado final**, con la fórmula y el aviso legal.
- **Todo resultado lleva el aviso legal**: `isEstimate: true` y una advertencia fija
  que dice que la resolución oficial corresponde al IMSS.
- **El desglose viaja a donde el usuario lo necesita**: la pantalla de resultado lo
  muestra y el PDF exportado lo reproduce tabla por tabla (`pdfExport.ts`), con la
  referencia legal y la marca de estimación en cada fila.

## Consecuencias

### Positivas

- **El usuario puede auditar el cálculo** y comparar paso a paso con la respuesta
  oficial. Cuando hay diferencia, sabe en cuál.
- **Los supuestos son visibles.** Por ejemplo, el promedio con Modalidad 40 ponderada
  está marcado como estimado, con la explicación de que el IMSS usará el historial exacto.
- **El PDF exportado es un documento defendible**: no es una cifra suelta, es un
  desarrollo con fundamento legal por línea.
- **Los pasos son datos de prueba.** `steps[]` se puede afirmar en un test: no hace
  falta que el resultado final coincida para detectar una regresión en una regla.

### Costes

- **Cada paso tiene que escribir su rastro**, no solo calcular. Más código por regla.
- El array `steps` crece con el número de reglas y se serializa completo en cada
  resultado guardado. Aceptable: son decenas de entradas de texto corto.
- **Mantener el formato del desglose es un commitment**: la UI y el PDF dependen de esos
  campos. Un campo nuevo obliga a revisar ambos consumidores.

## Alternativas descartadas

- **Devolver solo la cifra final.** Se descartó porque no es auditable y porque un
  resultado no auditable en un dominio normativo es un resultado que no se puede usar.
- **Explicar el cálculo en un texto estático.** Se descartó porque el texto estático no
  refleja los valores concretos del caso del usuario: se quedaría obsoleto en cuanto una
  regla cambiara.
- **Recalcular el desglose al mostrarlo.** Se descartó por ser una segunda
  implementación: divergiría del cálculo real. El desglose viaja con el resultado.

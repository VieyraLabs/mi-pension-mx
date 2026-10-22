# Spec-09 — Alcance de la estimación y aviso legal

- **Estado**: Vigente
- **Ámbito**: `src/services/pension/PensionCalculator.ts`, `src/components/EstimationDisclaimerCard.tsx`, `src/constants/infoLegal.ts`

## Propósito

Declarar sin ambigüedad **qué es** lo que la app calcula y **qué no**, para que nadie la
use como si su resultado fuera una resolución oficial.

## Comportamiento

Toda estimación producida por la app lleva tres marcas:

1. `isEstimate: true` en el `PensionResult`.
2. Una advertencia fija que dice que el resultado es una estimación con fines informativos
   y que la resolución oficial de la pensión corresponde exclusivamente al IMSS conforme a
   sus procedimientos institucionales.
3. La tarjeta `EstimationDisclaimerCard`, visible en la pantalla de resultado.

El PDF exportado repite la advertencia en el pie y marca cada paso estimado en su propia
fila.

## Reglas de negocio

- **El aviso legal es parte del resultado, no un elemento opcional de la interfaz.** El
  motor lo agrega a `warnings[]`, de modo que no se puede mostrar un resultado sin él.
- **Cada supuesto se declara donde ocurre.** Un paso estimado lleva su propio
  `assumption` (por ejemplo, el promedio ponderado de Modalidad 40), que se muestra en la
  fila del desglose y no en un aviso genérico al final.
- **Los porcentajes de la tabla del Art. 167 están marcados como referencia
  bibliográfica** en el propio archivo de constantes. La app no afirma tener la tabla
  oficial verificada.
- **El texto educativo de la sección de información** (`infoLegal.ts`) explica el marco
  normativo y los conceptos que la app usa (UMA, SMG, Modalidad 40, pensión de vejez).

## Fuera de alcance

- La app **no** gestiona trámites ante el IMSS.
- La app **no** ofrece protección legal ni puede usarse como evidencia en un proceso.
- La app **no** sustituye la consulta oficial. La sección de preguntas frecuentes lo dice
  de forma explícita.

## Verificación

- `src/__tests__/pdfExport.test.ts` — el aviso legal aparece en el HTML del reporte.
- `src/__tests__/pensionCalculator.test.ts` — `isEstimate` es `true` y la advertencia
  legal está presente en el resultado.

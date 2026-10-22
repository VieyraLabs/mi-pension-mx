# Runbook-03 — Agregar una etapa al pipeline de cálculo

## Cuándo se usa

Cuando hay que incorporate una regla nueva al cálculo de la pensión: un incremento, un
factor, un tope, un ajuste.

## Antes de empezar

- [ ] La regla tiene **fuente legal identificada**: artículo, decreto o tabla. Una regla
      sin fuente no entra al motor.
- [ ] Se sabe en qué **posición** del pipeline va, y por qué antes o después de los pasos
      que ya existen.
- [ ] Se sabe si la regla **es exacta o estimada**. Si es estimada, necesita su propio
      campo `assumption` en el paso (ver [Spec-09](../spec/09-alcance-de-la-estimacion-y-aviso-legal.md)).

## Pasos

### 1. Escribir el paso

Crear `src/services/pension/steps/<Nombre>Step.ts`. La forma es fija:

```ts
import type { CalculationContext, CalculationStep } from '../types';

export const <Nombre>Step: CalculationStep = (ctx): CalculationContext => {
  const steps = [...ctx.steps];
  const warnings = [...ctx.warnings];

  // ... la regla ...

  steps.push({
    id: '<id_estable>',
    title: 'N. <Título del paso>',
    description: `<Qué pasó, en prosa, con los valores concretos>`,
    value: <monto o porcentaje>,
    formula: '<La fórmula, como la escribiría un humano>',
    legalBasis: '<Artículo, decreto o tabla>',
    isEstimate: <true | false>,
    assumption: <opcional: el supuesto concreto>,
  });

  return { ...ctx, <campos nuevos del contexto>, steps, warnings };
};
```

Reglas del estilo:

- **Una regla por archivo.** Si el archivo hace dos cosas, son dos pasos.
- **El paso no muta el contexto.** Se copia (`[...ctx.steps]`) y se devuelve uno nuevo.
- **El `id` del paso es estable.** Se usa en las pruebas y no se renombra.
- **La `formula` se escribe con los valores del caso**, no con nombres de variable: es lo
  que va a leer el usuario en el desglose.
- **Si el paso necesita un campo nuevo en el contexto**, se añade a `CalculationContext`
  (`src/services/pension/types.ts`) con su comentario, y se inicializa en
  `createInitialContext`.

### 2. Registrar el paso en el pipeline

En `src/services/pension/PensionCalculator.ts`:

```ts
const PIPELINE = [
  AverageSalaryStep,
  BasicQuantityStep,
  <Nombre>Step,   // ← aquí, en su posición
  ...
] as const;
```

**El orden es normativo.** Insertar en medio cambia el resultado de los pasos
posteriores. Si la regla debe ir después de otro, el motivo se anota en un comentario.

### 3. Escribir las pruebas

En `src/__tests__/pensionCalculator.test.ts`:

- El **caso nominal**: el paso produce el valor esperado.
- Los **casos límite**: el mínimo, el máximo, y el caso en que la regla no aplica.
- El **caso de no aplicación**: la regla se activa condicionalmente; hay que probar que
  **no** se activa cuando no debe. Es el error más común: un paso que siempre suma.
- La **cadena completa**: el resultado final con el paso nuevo.

### 4. Verificar

```bash
npm run typecheck && npm run lint && npm run test:run && npm run test:coverage
```

## Verificación

- [ ] El paso aparece en el desglose con su fórmula y su referencia legal.
- [ ] El paso no se aplica cuando la regla no procede, y el desglose lo refleja.
- [ ] La cobertura del área `src/services/pension/**` no bajó.
- [ ] El PDF exportado muestra la fila nueva (el desglose se genera desde `result.steps`,
  así que debería salir sin cambios en `pdfExport.ts`).

## Si algo falla

**El resultado cambia en casos que no eran el objetivo.** Casi siempre es el orden: la
regla nueva se insertó antes de un paso del que depende. Revisar `PIPELINE`.

**El paso se aplica dos veces.** Se está empujando el rastro al `ctx` original en lugar
de a la copia, o el paso está en la lista dos veces.

**Un test viejo falla.** Puede ser un test correcto que codificaba el resultado sin la
regla nueva. Si la regla nueva es correcta, el test se actualiza **con la fuente legal a
la vista**; si no lo es, se revierte el paso.

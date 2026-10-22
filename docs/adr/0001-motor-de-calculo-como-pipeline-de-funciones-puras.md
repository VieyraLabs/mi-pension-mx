# ADR-0001 — El motor de cálculo es un pipeline de funciones puras

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: `src/services/pension/`

## Contexto

El cálculo de una pensión bajo la Ley del Seguro Social de 1973 encadena reglas que se
aplican en un orden fijo: salario promedio → cuantía básica → incrementos anuales →
incremento por decreto → factor por edad → asignaciones familiares → ayuda asistencial →
topes. Cada regla depende del resultado de la anterior y algunas se activan condicionalmente
(tope de 25 UMA, pensión mínima garantizada).

El dominio es **normativo y cambiante**: las reglas tienen número de artículo, año de
reforma y casos límite (Modalidad 40,-weather reimbursement,_topes). El error más caro en
este dominio no es una app caída: es un cálculo silenciosamente equivocado que el usuario
presenta al IMSS creyendo que es oficial.

Se necesitaba una estructura que permitiera:
1. Agregar o corregir una regla sin reescribir el motor.
2. Probar cada regla aislada.
3. Explicar al usuario de dónde sale cada número.

## Decisión

El motor es un **pipeline de funciones puras**. Cada regla es un paso con la firma:

```ts
type CalculationStep = (ctx: CalculationContext) => CalculationContext;
```

El contexto (`src/services/pension/types.ts`) es un objeto plano que acumula el estado
intermedio del cálculo. El orquestador (`PensionCalculator.ts`) ejecuta una lista constante
de pasos con un `reduce`:

```ts
const PIPELINE = [
  AverageSalaryStep,
  BasicQuantityStep,
  AnnualIncrementsStep,
  DecreeIncrementStep,
  AgeFactorStep,
  FamilyAssignmentsStep,
  AssistanceAidStep,
  LimitsStep,
] as const;

const finalContext = PIPELINE.reduce<CalculationContext>(
  (ctx, step) => step(ctx),
  createInitialContext(input),
);
```

Reglas que acompañan la decisión:

- **Ninguna regla toca UI, navegación ni estado global.** Un paso no sabe qué pantalla lo
  invocó; recibe datos y devuelve datos.
- **El contexto es acumulativo y explícito.** Cada campo del contexto tiene un significado
  definido por la ley (por ejemplo `effectiveDailySalary` es el SBC promedio ya topado y
  ajustado por Modalidad 40, no el salario que el usuario escribió).
- **Cada paso deja su propio rastro** en `ctx.steps`, que es lo que la app muestra como
  desglose (ver [ADR-0006](0006-el-resultado-es-un-desglose-auditable.md)).
- **El paso se añade al final de la lista, nunca en medio**, salvo que una corrección legal
  lo justifique explícitamente. El orden del pipeline es la ley.

## Consecuencias

### Positivas

- Cada regla es un archivo con sus propias pruebas. `src/services/pension/steps/` tiene un
  archivo por regla y cada uno tiene cobertura de rama.
- Agregar una regla (por ejemplo el incremento del 11 % del decreto DOF 2001/2004) es
  agregar un archivo y una entrada en la lista: no tocar el motor.
- El motor es determinista y no tiene efectos secundarios: se puede correr en un test, en
  una prueba de regresión o en un worker sin ninguna diferencia.
- El desglose que ve el usuario sale del mismo código que produce el número: no hay una
  segunda implementación "para explicar".

### Costes

- El contexto crece: cada regla nueva puede requerir un campo nuevo, y el objeto se
  serializa entero. Es un coste aceptable mientras el número de reglas sea el de la ley.
- Los pasos se comunican por un objeto compartido, no por tipos distintos por etapa. A
  cambio de esa debilidad, todos los pasos son intercambiables y el motor es uniforme.
- Un orden incorrecto en `PIPELINE` produce un resultado plausible pero incorrecto. Se
  mitiga con pruebas que fijan el resultado esperado de la cadena completa
  (`src/__tests__/pensionCalculator.test.ts`).

## Alternativas descartadas

- **Clase `PensionCalculator` con métodos encadenados.** Se descartó porque el estado
  intermedio queda en campos mutables de la instancia: dos llamadas concurrentes
  (simulador A/B) comparten estado y el resultado depende del orden de ejecución.
- **Motor de reglas declarativo** (JSON/YAML con expresiones). Se descartó porque las
  reglas que faltan (Modalidad 40 ponderada, decreto 11 %, topes combinados) no se
  expresan cleanly en un DSL, y porque el motor tendría que interpretar el DSL en runtime:
  más código, menos control y peor depuración.
- **Servicio de cálculo remoto.** Se descartó por [ADR-0002](0002-cero-backend-todo-en-el-dispositivo.md).

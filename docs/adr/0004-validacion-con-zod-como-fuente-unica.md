# ADR-0004 — Zod es la fuente única de verdad de la validación

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: `src/validation/`, `src/hooks/usePensionForm.ts`

## Contexto

Los datos de entrada de la app son numerosos y normativos: semanas cotizadas (mínimo 500
para vejez, Arts. 138 y 145), edad de retiro (60 a 100), UMA, salario diario, Modalidad 40,
beneficiarios. Cada uno tiene un rango y un mensaje de error.

El riesgo clásico de este tipo de formulario es la **validación duplicada**: la misma
regla escrita en el formulario (para el mensaje), en el modelo (para el tipo) y en el
cálculo (para el comportamiento). Las tres copias divergen, y la divergencia produce el
peor tipo de bug en un dominio normativo: un dato que el formulario acepta y que el
cálculo trata de forma distinta.

Además hay una regla que cruza campos: el mínimo de 500 semanas debe considerar **las
semanas ya cotizadas más las que el usuario planea cotizar en Modalidad 40**, que viven
en otro campo.

## Decisión

**`PensionInputSchema` (Zod) es la única definición de las reglas de validación.**

- El schema (`src/validation/pensionSchema.ts`) define cada campo con su tipo, su rango y
  su mensaje de error en español, con el artículo legal citado en el mensaje cuando
  corresponde.
- Los formularios usan `react-hook-form` con el resolver de Zod: la validación del
  formulario **y** la del motor son la misma función.
- El motor (`validateInput` en `PensionCalculator.ts`) llama a
  `PensionInputSchema.safeParse(input)` y traduce sus `issues` a una lista de errores. No
  reimplementa ninguna regla.
- La regla que cruza campos (500 semanas efectivas, contando Modalidad 40) vive en el
  `superRefine` del schema, no en el formulario ni en el motor.
- Las **advertencias no bloqueantes** (por ejemplo: "estás en el mínimo de semanas") se
  generan en el motor, porque dependen del resultado del cálculo y no de la forma del
  dato. Son advertencias: no impiden calcular.

## Consecuencias

### Positivas

- **Una sola definición por regla.** El mensaje que ve el usuario, el tipo que acepta el
  formulario y el comportamiento del motor no pueden divergir: salen del mismo objeto.
- Los mensajes pueden citar el artículo legal sin duplicar ese texto en varios archivos.
- Las reglas de rango son legibles y auditables en un solo archivo, que es donde un
  revisor busca primero.
- El schema es datos: se puede derivar el tipo (`z.infer`) sin escribirlo dos veces.

### Costes

- El schema tiene que conocer detalles del dominio (el mínimo de 500 semanas, los límites
  de edad), lo que lo ata al cálculo. Se acepta: son la misma regla legal.
- `superRefine` con reglas que cruzan campos es más difícil de leer que un `if` en el
  formulario, y devuelve un error con `path` anidado. Se acepta por la garantía.
- Zod es una dependencia de producción con un coste de runtime en el arranque del
  formulario. Aceptable para el volumen de campos.

## Alternativas descartadas

- **Validación manual en cada `onChange` del formulario.** Se descartó por ser la fuente
  de la divergencia que esta decisión evita.
- ** Yup.** Se descartó porque su inferencia de tipos es peor y porque Zod ya es la
  dependencia del ecosistema Expo.
- **Validar solo en el motor (submit).** Se descartó: el usuario descubriría los errores
  después de haber llenado todo el formulario.
- **Derivar el schema del motor.** Se descartó porque el motor no tiene forma de
  declararse; el schema es la forma declarativa, y el motor la consume.

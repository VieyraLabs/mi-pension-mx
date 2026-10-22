# Spec-01 — Motor de cálculo Ley 73

- **Estado**: Vigente
- **Ámbito**: `src/services/pension/`, `src/constants/ley73.ts`

## Propósito

Calcular la pensión mensual estimada bajo la Ley del Seguro Social de 1973 (Ley 73) a
partir de los datos del asegurado, aplicando las reglas en el orden que la ley establece
y devolviendo un desglose auditable de cada paso.

## Comportamiento

`calculatePension(input: PensionInput): PensionResult` ejecuta el pipeline completo y
devuelve:

- `monthlyPension`, `annualPension` y `dailyAmount` (redondeados a dos decimales con
  `round2`).
- El desglose: `steps[]`, un elemento por regla aplicada más el paso de resultado final.
- `warnings[]`, con el aviso legal siempre presente al final.
- `isEstimate: true`, siempre.

El pipeline tiene ocho pasos, en este orden:

1. `AverageSalaryStep` — SBC promedio de las últimas 250 semanas cotizadas, ajustado por
   Modalidad 40 y topado a 25 UMA.
2. `BasicQuantityStep` — cuantía básica según la tabla del Art. 167.
3. `AnnualIncrementsStep` — incrementos anuales por cada 52 semanas excedentes.
4. `DecreeIncrementStep` — incremento del 11 % (decreto DOF 2001/2004).
5. `AgeFactorStep` — factor por edad (cesantía en edad avanzada, Arts. 138–140).
6. `FamilyAssignmentsStep` — asignaciones familiares (Arts. 163–164).
7. `AssistanceAidStep` — ayuda asistencial (Art. 165).
8. `LimitsStep` — tope de 25 UMA (Art. 28 LSS vigente) y pensión mínima garantizada
   (Art. 170).

## Reglas de negocio

| Regla | Valor | Fuente |
|---|---|---|
| Semanas mínimas para pensión de vejez | 500 | Arts. 138 y 145 LSS 1973 |
| Semanas del promedio salarial | 250 | Art. 167 LSS 1973 |
| Tope de cotización | 25 UMA | Art. 28 LSS vigente (DOF 27-ene-2016) |
| Pensión mínima garantizada | según tabla UMA vigente | Art. 170 LSS 1973 |
| Factor por edad | 0.75 a 1.0 | Arts. 138–140 LSS 1973 |
| Asignaciones familiares | spouse e hijos menores | Arts. 163–164 LSS 1973 |
| Ayuda asistencial | 0.08 a 0.20 de la cuantía básica | Art. 165 LSS 1973 |
| Días por mes para conversión salarial | 30.4 | Constante de cálculo |
| Redondeo | 2 decimales | `round2` en `src/utils/format.ts` |

Reglas transversales:

- **El orden del pipeline es normativo.** Cada paso consume el resultado del anterior.
- **Todo resultado es una estimación.** El campo `isEstimate` es `true` siempre, y las
  advertencias incluyen el aviso legal.
- **Los valores normativos vienen de `src/constants/`**, nunca están escritos en el
  motor (ver [ADR-0005](../adr/0005-constantes-legales-en-modulos-separados.md)).
- **Los pasos son puros**: mismo `input`, mismo resultado, sin efectos secundarios.

## Fuera de alcance

- La Modalidad 40 se estima con un promedio ponderado, no con el historial exacto: se
  marca como estimación en el paso y en las advertencias.
- No se calculan Zackarias por viudez, orfandad o Accidente de trabajo.
- No se calcula la pensión de invalidez ni la de cesantía en edad avanzada como
  tipos separados: el factor por edad cubre el caso de edad avanzada.
- No se resuelve ningún trámite ante el IMSS.

## Verificación

- `src/__tests__/pensionCalculator.test.ts` — cadena completa, orden de los pasos,
  topes, Modalidad 40,UMO personalizada y validación de entrada.
- `src/services/pension/steps/` — cada paso tiene su propia cobertura de rama dentro
  del mismo archivo de pruebas del motor.
- Cobertura del área de cálculo (`src/services/pension/**`): **96 % de sentencias,
  100 % de funciones** en la última ejecución de la suite.

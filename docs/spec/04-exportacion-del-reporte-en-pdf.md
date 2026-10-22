# Spec-04 — Exportación del reporte en PDF

- **Estado**: Vigente
- **Ámbito**: `src/services/export/pdfExport.ts`

## Propósito

Generar, en el dispositivo, un documento PDF con el desglose completo del cálculo que el
usuario pueda compartir o llevar a una ventanilla del IMSS.

## Comportamiento

`exportPensionResult(result: PensionResult)` construye un documento HTML y lo convierte en
PDF con `expo-print`, y lo comparte con `expo-sharing`. El documento contiene:

- **Encabezado**: título, fecha del cálculo y los datos personales del asegurado.
- **Resultado**: pensión mensual, anual y diaria estimada.
- **Desglose**: una tabla con una fila por paso del pipeline. Cada fila lleva el título del
  paso, su descripción, el valor, y —en una fila aparte— la referencia legal y la marca de
  estimación cuando aplica.
- **Advertencias**: la lista completa, con el aviso legal.
- **Pie**: la aclaración de que el resultado es una estimación y de que la resolución
  oficial corresponde al IMSS.

## Reglas de negocio

- **El PDF reproduce el desglose del resultado, no lo recalcula.** Las filas salen de
  `result.steps`: no hay una segunda implementación del cálculo para el documento
  (ver [ADR-0006](../adr/0006-el-resultado-es-un-desglose-auditable.md)).
- **Cada paso con fundamento legal lo muestra.** La columna de referencia legal se
  renderiza cuando `step.legalBasis` está presente.
- **Cada paso marcado como estimación lo dice**, en la propia fila, no solo en el pie.
- **El documento se genera en el dispositivo.** `expo-print` renderiza el HTML localmente;
  no hay servicio de conversión en la nube.
- **El sharing es del sistema operativo**, con `expo-sharing`: el usuario decide a dónde
  va el archivo.

## Fuera de alcance

- No se genera un PDF de la constancia importada: solo del resultado.
- No se envía el PDF a ningún destino por sí mismo: la app lo entrega al selector de
  compartir del sistema.
- No hay plantillas multinivel ni logotipo en el documento.

## Verificación

- `src/__tests__/pdfExport.test.ts` — generación del HTML: presencia de las secciones,
  render de los pasos con y sin referencia legal, render de la marca de estimación, y
  render de las advertencias.

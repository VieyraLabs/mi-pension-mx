# ADR-0002 — Cero backend: todo el dato del usuario vive en el dispositivo

- **Estado**: Aceptada
- **Fecha**: 2026-08-01
- **Ámbito**: arquitectura general, `src/storage/`

## Contexto

La aplicación maneja datos sensibles de una persona: fecha de nacimiento, CURP, NSS,
salario promedio, historial de cotización y constancias de semanas cotizadas del IMSS.
Un historial de cotización es, en la práctica, un documento laboral y financiero completo.

Al mismo tiempo, el producto es una **herramienta de estimación**: el resultado depende
enteramente de los datos que el usuario ingresa, y el cálculo es determinista. No hay
nada que un servidor pueda hacer mejor que el dispositivo: la app no necesita cuentas,
ni sincronización, ni recuperación de sesión.

Ese diseño elimina de raíz una categoría entera de problemas y de responsabilidad:
autenticación, autorización, respaldo, cumplimiento de datos personales, coste de
infraestructura y superficie de ataque.

## Decisión

**No hay backend.** La app no habla con ningún servidor propio ni de terceros.

- El cálculo ocurre íntegramente en el dispositivo.
- La persistencia local es **AsyncStorage** (`src/storage/simulationStorage.ts`), con un
  máximo de 20 simulaciones y una clave de espacio de nombres (`@mi_pension_mx:simulaciones`).
- El historial de cotización se reconstruye **en memoria**, a partir del texto extraído
  del PDF que el usuario elige con el selector de archivos del sistema.
- El PDF se lee con `expo-document-picker` + `expo-file-system` (nativo) o con
  `pdfjs-dist` (web). El archivo nunca se sube: se lee desde el sandbox de la app.
- El reporte en PDF se genera en el dispositivo con `expo-print` y se comparte con
  `expo-sharing`.

Ver también [ADR-0009](0009-cero-telemetria-y-cero-servicios-de-terceros.md): no hay
telemetría que reporte nada.

## Consecuencias

### Positivas

- **Ninguna fuga de datos es posible por construcción**: no hay servidor al que filtrar.
- La app funciona sin conexión y sin cuenta. Se instala, se usa y se resuelve.
- No hay costos de infraestructura ni de mantenimiento de backend.
- No hay superficie de ataque de red: no hay API que auditar.
- Publicar la app en una tienda no requiere una política de privacidad de servidor.

### Costes

- **No hay sincronización entre dispositivos.** Quien rehace la simulación en otro
  dispositivo empieza de cero. Aceptable: el costo de reingresar datos es menor que el
  de mantener cuentas.
- **La pérdida de datos borra el historial.** AsyncStorage no tiene respaldo. Se mitiga
  exportando el reporte en PDF, que es la vía de salida natural del producto.
- **No se puede "corregir" un cálculo a posteriori.** Si cambia la ley o un valor, cada
  usuario tiene la versión que se descargó. Se mitiga con el aviso de estimación y con
  publicar la versión de las constantes legales usada.
- El almacenamiento local no es cifrado. El dato es del propio usuario, en su propio
  dispositivo, bajo el aislamiento de la plataforma.

## Alternativas descartadas

- **API propia con autenticación.** Se descartó por el coste de construcción y
  mantenimiento, y porque elimina el beneficio de "sin cuenta, sin red" sin aportar nada
  al cálculo.
- **Supabase / Firebase.** Se descartaron por la misma razón, y porque introducen un
  tercero en el manejo de datos personales.
- **SQLite local (`expo-sqlite`).** Es técnicamente mejor para consultas, pero el volumen
  de datos (20 simulaciones) no lo justifica: `AsyncStorage` es suficiente y no añade
  una dependencia nativa.
- **Cifrado local de AsyncStorage.** Se descartó por coste/beneficio: el modelo de
  amenaza asumido es alguien con acceso físico al dispositivo desbloqueado, escenario en
  el que el aislamiento de la app de Android e iOS ya aporta la protección principal.

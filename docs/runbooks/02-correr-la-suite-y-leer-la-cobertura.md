# Runbook-02 — Correr la suite y leer la cobertura

## Cuándo se usa

Antes de commitear cualquier cambio, y cuando hay que entender qué parte del código está
sin probar.

## Antes de empezar

- [ ] Las dependencias están instaladas: `npm ci` (o `npm install` si se cambió el
      lockfile).
- [ ] Node en la versión del proyecto (22 o superior).

## Pasos

### 1. Los tres controles

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint src --ext .ts,.tsx
npm run test:run    # jest --watchAll=false
```

Los tres tienen que salir en verde. El CI ejecuta exactamente estos tres, en ese orden.

### 2. La cobertura

```bash
npm run test:coverage
```

Imprime una tabla por archivo y un resumen. La cobertura se mide solo sobre el código que
importa decisiones, según `collectCoverageFrom` en `package.json`:

```
src/services/**/*.ts
src/hooks/**/*.ts
src/storage/**/*.ts
```

Es una decisión deliberada: **no se mide la cobertura de las pantallas ni de los
componentes de presentación**. Medir todo obligaría a subir la cifra sin subir la
calidad, y la cobertura de una pantalla es un indicador pobre: un snapshot que se
actualiza a ciega no prueba nada.

### 3. Correr un subconjunto

Para iterar rápido sobre un archivo:

```bash
npx jest src/services/pension --watch
```

### 4. Un solo caso

```bash
npx jest -t "topa de 25 UMA"
```

## Verificación

- [ ] `typecheck`, `lint` y `test` en verde.
- [ ] La cobertura no bajó respecto de la última ejecución.

## Si algo falla

**`npm ci` falla por lockfile desincronizado.** El `package.json` y el
`package-lock.json` no coinciden: alguien cambió una dependencia sin regenerar el
lockfile. Solución: `npm install` y commitear ambos archivos.

**Un test falla solo en local y no en CI.** Suele ser un test que depende del reloj
(`new Date()`), del idioma o del orden de ejecución. Ejecuta la suite completa en local
antes de asumir que pasa.

**Un test falla por la cobertura de un archivo que se movió.** `collectCoverageFrom` usa
rutas: si se movió un directorio, la ruta deja de coincidir y la cobertura baja sin que
haya tests rotos.

**La suite pasa pero el resultado es incorrecto.** Un caso de test puede estar
codificando el comportamiento equivocado. En ese caso el test es el bug: corregirlo con
la referencia legal a la vista, no la expectativa.

# Runbook-01 — Publicar una versión

## Cuándo se usa

Cuando hay que cortar una versión de la app: una corrección importante, una actualización
de las constantes legales, o una versión mayor con funcionalidad nueva.

## Antes de empezar

- [ ] La rama de trabajo está limpia: `git status` sin cambios pendientes.
- [ ] `npm run typecheck`, `npm run lint` y `npm run test:run` pasan en local.
- [ ] La versión de la app y la del build coinciden: `app.json` (`expo.version`) y
      `package.json` (`version`).
- [ ] El número de build nativo se incrementa (lo hace EAS al publicar; si se publica un
      build local, hay que subirlo a mano).

## Pasos

### 1. Cerrar la versión en el repositorio

```bash
git switch main
git pull --ff-only
git switch -c release/v1.2.0
```

Trabaja en una rama de release, no directamente en `main`.

### 2. Actualizar la versión

La versión la gestiona EAS (`appVersionSource: "remote"` en `eas.json`): el
`production` profile la incrementa solo en cada build (`autoIncrement`). No hay que
subir la versión a mano.

Lo que sí se versiona en el repositorio es el **número de versión de la app**, que se
lee de `package.json` y se muestra en la sección de información:

```json
{ "version": "1.2.0" }
```

### 3. Publicar el build

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

Para una build de staging, usar el perfil `preview` y el canal de EAS Update `staging`:

```bash
npx eas-cli build --platform all --profile preview
npx eas-cli update --channel staging --message "Ajustes de la tabla del Art. 167"
```

Los builds de producción requieren la credencial `EXPO_TOKEN` configurada en el entorno.
Si no está, el build falla con un error de autenticación: ver
[Si algo falla](#si-algo-falla).

### 4. Abrir la puerta de promoción

El workflow `promotion-gate.yml` es el que autoriza el paso a producción:

1. Verifica que el commit candidato tenga una ejecución verde de `ci.yml`.
2. Verifica que la ejecución de staging indicada haya terminado con `success`.
3. **Se detiene y espera la aprobación manual** en el environment `production`.
4. Tras la aprobación, produce el artefacto `AUTORIZACION.md` con el commit
   autorizado, los identificadores de las ejecuciones verificadas y el aprobador.

La aprobación es un environment protegido de GitHub: hay que tener reviewers
configurados en `Settings → Environments → production`. Sin reviewers, la puerta se
aprueba sola y pierde su sentido.

> **Este workflow no publica en producción.** No hay un proyecto de EAS vinculado ni
> publicación en tiendas, así que no hay un target al que desplegar. Lo que produce es
> la **evidencia de autorización**: el artefacto que cita el paso 5. Si publicas sin
> él, el release queda sin la aprobación registrada.

Para ejecutarlo:

```bash
gh workflow run promotion-gate.yml \
  --ref main \
  -f ref="v1.2.0" \
  -f staging_run_id="<id de la ejecución de Deploy staging>"
```

### 5. Publicar la actualización OTA (opcional)

Si el cambio es solo de JavaScript, se puede publicar sin pasar por las tiendas:

```bash
npx eas-cli update --channel production --message "Corrección del cálculo de la Modalidad 40"
```

Este paso va **después** de tener el artefacto de autorización del paso 4: es el punto
en el que el cambio llega a los usuarios.

### 6. Cerrar el release

```bash
git add package.json
git commit -m "chore(release): v1.2.0"
git tag -a v1.2.0 -m "v1.2.0"
git push origin release/v1.2.0 --follow-tags
```

El tag dispara `release.yml`, que genera el release de GitHub con el changelog.

## Verificación

- [ ] La app instala y arranca en un dispositivo físico.
- [ ] El flujo principal (nueva simulación → resultado) funciona.
- [ ] La versión mostrada en la app coincide con la del release.
- [ ] El reporte en PDF se genera y se comparte correctamente.
- [ ] La puerta de promoción quedó registrada en el historial del workflow, con su
      artefacto de autorización.

## Si algo falla

**El build de EAS pide autenticación.** `EXPO_TOKEN` no está configurado o venció.
Generar uno en el panel de Expo y configurarlo como secreto del repositorio
(`Settings → Secrets and variables → Actions → EXPO_TOKEN`).

**La puerta de promoción no aparece.** La ejecución del workflow no llegó al job de
aprobación: revisar si `ci.yml` está verde en el commit candidato. Si el environment
`production` no tiene reviewers configurados, la aprobación es automática y el paso no se
detiene.

**El build falla solo en iOS.** Casi siempre es la firma: la credencial de Apple no
está en el proyecto de EAS o el certificado expiró. Revisar `npx eas-cli credentials`.

**La app instalada no refleja el código nuevo.** Hay una actualización OTA pendiente que
toma precedencia. Publicar con `npx eas-cli update --channel production` o reinstalar
la app.

# Configuración de acceso real para automatización con GitHub Issues

## Objetivo

Dejar operativo el flujo de automatización desde GitHub Issues en entorno local o GitHub Actions.

---

## 1. Token recomendado

Usar uno de estos secretos o variables:

- `SDD_GITHUB_TOKEN`
- `GITHUB_TOKEN`
- `GH_TOKEN`
- `GITHUB_PAT`

### Permisos mínimos

- `Contents: Read`
- `Issues: Read and Write`
- `Pull requests: Read and Write`
- acceso explícito al repositorio `carlosamesar/framework-sdd`

> Si el token es fine-grained, debe incluir este repositorio manualmente.

---

## 2. Variables esperadas

- `GITHUB_OWNER=carlosamesar`
- `GITHUB_REPO=framework-sdd`
- `SDD_DRY_RUN=1` para pruebas seguras

---

## 3. Comandos de verificación

### Diagnóstico de acceso

Ejecutar:

PowerShell:

```powershell
npm run issue:doctor
```

### Smoke test del flujo

```powershell
npm run issue:smoke
```

### Ejecución segura del runner

```powershell
$env:SDD_DRY_RUN='1'
node bin/sdd-issue-runner.cjs
```

> Los archivos heredados [scripts/auto-issue-runner.cjs](scripts/auto-issue-runner.cjs) y [scripts/auto-issue-runner.js](scripts/auto-issue-runner.js) ahora redirigen al entrypoint oficial.

---

## 4. En GitHub Actions

El workflow actual usa el token del repositorio y lo expone también como `SDD_GITHUB_TOKEN` para el runner.

Si se necesita un PAT dedicado, basta con cambiar el mapeo de variables del workflow para apuntar a un secreto personalizado.

---

## 5. Modo alterno ya operativo

Si GitHub sigue devolviendo 404 o problemas de permisos, el framework ahora puede seguir trabajando con un store local en:

- [data/local-issues.json](data/local-issues.json)

Comandos útiles:

```powershell
npm run issue:doctor
npm run issue:local-smoke
node bin/gd-create-issue.cjs
node bin/sdd-issue-runner.cjs
```

## 6. Señales de éxito

- el doctor responde con acceso remoto válido o con fallback local habilitado;
- el orquestador puede listar o crear issues remotos o locales;
- los issues con label `sdd-auto` o trigger `/gd:start` ejecutan el flujo.

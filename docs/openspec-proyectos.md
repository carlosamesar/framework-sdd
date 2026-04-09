# OpenSpec multi-proyecto (alineado con `/develop`)

## Problema

Un solo `openspec/changes/` mezcla **N productos** del monorepo; los slugs chocan y cuesta saber qué spec pertenece a qué app.

## Solución en este repo

1. **Árbol por producto** bajo `openspec/projects/`, espejando `develop/` (ver [`openspec/projects/README.md`](../openspec/projects/README.md)).
2. **`openspec/config.yaml`** declara cada proyecto en `projects:` con su `changes_root`.
3. **`active_project`** en el YAML o la variable de entorno **`FRAMEWORK_SDD_OPENSPEC_PROJECT`** elige en qué proyecto se valida y verifica.

## Variables

| Variable | Efecto |
|----------|--------|
| `FRAMEWORK_SDD_PROJECT_ROOT` | Raíz del monorepo (donde está `openspec/`). Igual que antes. |
| `FRAMEWORK_SDD_OPENSPEC_PROJECT` | Clave del mapa `projects:` en `config.yaml` (p. ej. `framework`, `sigat_orchestation`). |

## Comandos afectados

- `npm run spec:validate` — solo changes del proyecto activo.
- `npm run spec:verify -- <slug>` / `--all` — slugs bajo ese mismo `changes_root`.

No afecta por sí solo a:

- `npm run spec:implements` — sigue recorriendo **todo** `openspec/` (referencias `implements:` en cualquier `.md`).
- `npm run spec:validate-react` — plantillas globales en `openspec/templates/`.

## Ejemplo de flujo

```bash
export FRAMEWORK_SDD_OPENSPEC_PROJECT=sigat_orchestation   # tras registrarlo en config.yaml
npm run spec:validate
npm run spec:verify -- mi-change-slug
```

Para volver al núcleo del framework:

```bash
export FRAMEWORK_SDD_OPENSPEC_PROJECT=framework
# o unset FRAMEWORK_SDD_OPENSPEC_PROJECT y usar active_project: framework en config.yaml
```

## Referencias

- [`openspec/config.yaml`](../openspec/config.yaml)
- [`openspec/README.md`](../openspec/README.md)
- [`docs/orquestador-agente-sdd.md`](orquestador-agente-sdd.md) — agente + variables

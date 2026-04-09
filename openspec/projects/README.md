# OpenSpec por proyecto (`openspec/projects/`)

Los **changes** (delta specs) pueden vivir **separados por producto**, en lugar de un único `openspec/changes/` mezclado.

## Convención de carpetas

Espejá la ruta bajo `develop/`:

| Código del producto | Carpeta recomendada para changes |
|---------------------|-----------------------------------|
| `develop/backend/sigat-orchestation/` | `openspec/projects/develop/backend/sigat-orchestation/changes/` |
| `develop/frontend/gooderp-client/` | `openspec/projects/develop/frontend/gooderp-client/changes/` |

Cada carpeta `changes/` tiene la misma forma que siempre: `<slug>/proposal.md`, `design.md`, `tasks.md`, `specs/*.md`, y opcionalmente `archive/<slug>/`.

## Configuración

En [`../config.yaml`](../config.yaml):

1. Añadí una entrada bajo `projects:` con `changes_root` apuntando a esa carpeta `changes/`.
2. Poné `active_project: <clave>` o exportá **`FRAMEWORK_SDD_OPENSPEC_PROJECT=<clave>`** para trabajar en ese producto.

`npm run spec:validate` y `npm run spec:verify` usan solo el **`changes_root` del proyecto activo**.

## Specs globales del framework

Las specs **compartidas** (p. ej. `openspec/specs/saga/`) pueden seguir en `openspec/specs/`; no forman parte de un `changes/` concreto. `check-spec-implements` sigue recorriendo todo `openspec/` para el frontmatter `implements:`.

## Agentes y CI

- **`npx sdd-agent`** / **`FRAMEWORK_SDD_PROJECT_ROOT`**: sigue siendo la raíz del **monorepo**.
- **`FRAMEWORK_SDD_OPENSPEC_PROJECT`**: elige qué bloque de `projects` en `config.yaml` aplica al validar/verificar.

Documentación: [`docs/openspec-proyectos.md`](../../docs/openspec-proyectos.md).

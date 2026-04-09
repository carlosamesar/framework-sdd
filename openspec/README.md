# OpenSpec (Framework-SDD)

## Multi-proyecto (recomendado en monorepos)

Para **no mezclar** specs de distintos productos, usá **`openspec/projects/…/changes/`** espejando `develop/` y registrá cada árbol en **`config.yaml`** → `projects`. El proyecto activo es **`active_project`** o la variable **`FRAMEWORK_SDD_OPENSPEC_PROJECT`**. Guía: [**`docs/openspec-proyectos.md`**](../docs/openspec-proyectos.md) · convención de carpetas: [`openspec/projects/README.md`](projects/README.md).

---

Este directorio concentra **especificaciones en delta** bajo `changes/` (global o por proyecto). La estructura modular `modules/XX-module-*/changes/` descrita en `project.md` aplica cuando el monorepo incluye el árbol ERP completo; en repos mínimos basta con `openspec/changes/<slug>/` o con un único proyecto `framework` en `config.yaml`.

| Archivo | Rol |
|---------|-----|
| `MEMORY.md` | Enlaces a memoria SDD, RAG, índice de documentación |
| `config.yaml` | Rutas, **`projects`** y `active_project` / `FRAMEWORK_SDD_OPENSPEC_PROJECT` para `spec:validate` y `spec:verify` |
| `changes/<slug>/proposal.md` | Intención y alcance (recomendado) |
| `changes/<slug>/design.md` | Arquitectura y decisiones |
| `changes/<slug>/tasks.md` | Checklist con `- [ ]` / `- [x]` |
| `changes/<slug>/specs/**/*.md` | Requisitos y escenarios (Gherkin o **Dado/Cuando/Entonces**) |
| `templates/react-outputs/*.schema.json` | Esquemas JSON de salida para encadenar agentes (ReAct) |
| `tools-manifest.yaml` | Registro de herramientas para orquestación |
| `specs/saga/spec.md` | Spec activa SAGA NestJS (certificación) |
| `specs/saga/admin-unified-orchestrator-transaction-types.md` | Spec **APPROVED** — tipos administrativos orquestador Lambda unificado |
| `specs/workspace/spec.md` | Spec workspace (p. ej. SIGAT) |
| `changes/archive/` | Changes cerrados con `proposal`, `design`, `tasks`, `CIERRE-SPEC.md` |

Validación: desde la raíz del repo, `npm run spec:validate`. Esquemas ReAct + ejemplos: `npm run spec:validate-react`. **Drift `implements:`** (rutas bajo `openspec/`, `docs/`, `scripts/`, `rag/`, `.github/` deben existir): `npm run spec:implements` (`--root /otro/repo` para comprobar otro árbol; `--verbose` lista refs externas tipo `lib/`). Prueba real automatizada: `npm run test:implements-e2e`; smoke completo: `npm run framework:test`. **Runtime ReAct (plan):** `npm run react:smoke` o `node scripts/react-runner.mjs --plan scripts/fixtures/react-plan-smoke.json` (lee `openspec/tools-manifest.yaml`). **JSON del modelo por stdin:** `node scripts/validate-react-schemas.mjs --stdin --schema specify` (un objeto JSON en stdin). **CLI publicado (`npx framework-sdd` / `npx sdd`):** mismos gates que `npm run spec:*` en un proyecto con `openspec/`; ver README raíz § “Uso con npx”.

**Transcript con markdown:** `spec:extract-json` (primer objeto); **`--all`** emite NDJSON (varios objetos). Cadena: `… | node scripts/extract-json-block.mjs --all | node scripts/validate-react-schemas.mjs --stdin-ndjson --schema specify`. **ReAct:** `--dry-run`, **`npm run react:list-tools`**. Validar **un JSON arbitrario** contra un esquema: `npm run spec:validate-react -- --data ruta/salida.json --schema specify` (nombres: `specify`, `plan`, `breakdown`, `verify`, o ruta a `*.schema.json`). Reportes de checklist: `npm run spec:verify -- <slug>` (estado `FAIL` = tareas pendientes, no rompe CI).

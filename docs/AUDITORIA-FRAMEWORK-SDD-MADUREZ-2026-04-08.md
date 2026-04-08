# Auditoría de madurez — Framework-SDD (ReAct / SDD)

**Fecha informe base:** 2026-04-08  
**Última actualización de estado:** 2026-04-11  
**Alcance:** repositorio `Framework-SDD` — OpenSpec, CI, RAG, gate `implements:`, pruebas E2E de herramientas y documentación canónica.

---

## 1. Resumen ejecutivo

El framework consolidó un **núcleo verificable y probado en ejecución**: además de OpenSpec + Ajv + reportes `verify-*.json`, incorpora **`spec:implements`** (drift de rutas internas), **`validate-spec`** compatible con `openspec/changes/archive/<slug>/`, **E2E** en sandboxes (`test:implements-e2e`) y smoke **`framework:test`**. Con RAG operativo en entorno configurado, **`rag:test`** valida conexión, embeddings y retrieval. Existe **`react-runner`** (`npm run react:smoke`) que ejecuta planes JSON contra `openspec/tools-manifest.yaml`, y **`spec:validate-react --stdin`** para validar en caliente un JSON pegado o redirigido. **`spec:verify --all`** recorre también `openspec/changes/archive/<slug>/`.

**Madurez global estimada (2026-04-11): ~4,0 / 5** (promedio de la rúbrica §2; ver matiz abajo). **5,0 pleno** en todas las dimensiones sigue limitado sobre todo por **memoria/EKB no obligatoria en CI** y ausencia de **sandbox de ejecución fuerte** + **LLM embebido** en el runner.

**Matiz:** el subconjunto **“gates + CI + runtime ReAct mínimo + validación JSON en caliente”** ronda **~4,7 / 5**; la dimensión **Memoria / RAG / Engram** (~3,2) arrastra el promedio global.

En **AGENTS.md** (complejidad), el framework como producto se sitúa entre **nivel 2 (Standard)** y **3 (Complex)** — *2+ / inicio de 3*: orquestación mecánica de herramientas existe; no hay agente autónomo con políticas de seguridad de producción.

---

## 2. Rúbrica actualizada (1–5)

| Dimensión | Inicial (abr. 2026) | **Estado 2026-04-11** | Notas |
|-----------|---------------------|------------------------|--------|
| **Especificación y OpenSpec** | 3,0 | **4,0** | `config.yaml`, `changes/` + `archive/`, escenarios en specs |
| **Automatización ejecutable** | 2,0 | **4,0** | `framework:ci`, `framework:test`, `react:smoke`, CI con E2E + runner |
| **Verificación y evidencia** | 2,0 | **4,1** | `verify` por slug `archive/...`; JSON observaciones ReAct; `--stdin` para salida modelo |
| **Memoria / RAG / Engram** | 2,0 | **3,2** | `rag:test` + index; EKB/Engram opcional; sin gate obligatorio en CI |
| **Base ReAct (tooling + observations)** | 2,0 | **4,3** | `react-runner.mjs` + manifiesto YAML; planes `--plan` / NDJSON `--stdin`; políticas `max_tool_iterations` |
| **Consistencia docs ↔ código** | 2,0 | **4,0** | `implements:`, manifiesto parseable (YAML válido), workflows alineados |

**Promedio simple de la tabla: ~3,93 → redondeo operativo 4,0/5.**

---

## 3. Evidencia objetiva (artefactos)

| Artefacto | Función |
|-----------|---------|
| `openspec/config.yaml` | Rutas y convenciones |
| `scripts/validate-spec.mjs` | Estructura `changes/` + escenarios en specs |
| `scripts/verify-change.mjs` | `reports/verify-<slug>.json` |
| `scripts/validate-react-schemas.mjs` | Ajv sobre `*.schema.json` + `examples/*.example.json` |
| `scripts/check-spec-implements.mjs` | Frontmatter `implements:` vs existencia (prefijos framework); `--root` |
| `scripts/e2e-spec-implements.mjs` | Prueba real: 4 casos en sandboxes temporales |
| `scripts/react-runner.mjs` | Runtime ReAct mínimo (plan JSON / stdin NDJSON) |
| `scripts/fixtures/react-plan-smoke.json` | Plan de humo read-only para CI |
| `package.json` / `package-lock.json` | Scripts (`framework:test`, `test:implements-e2e`, RAG, memoria) |
| `.github/workflows/sdd-framework.yml` | CI: validate + validate-react + implements + E2E + verify --all |
| `openspec/tools-manifest.yaml` | Registro de herramientas para orquestación |
| `openspec/changes/.../proposal.md` | Admin change alineado a protocolo |
| `openspec/modules/README.md` | Placeholder ERP sin inventar árbol falso |

**Comandos verificados localmente (referencia):** `npm run framework:test` → OK; `npm run rag:test` → OK con Postgres/embeddings configurados; `npm run spec:verify -- --all` → informativo (la carpeta top-level `archive` puede tratarse como un “change” sintético hasta mejorar el listado de `--all`).

---

## 4. Brechas residuales (hacia 4,5–5,0)

1. **Motor ReAct en Node (MVP):** existe `react-runner` con plan fijo o stdin; el **bucle con LLM** (Thought → JSON acción → ejecución → Observation al modelo) sigue siendo responsabilidad del IDE u orquestador externo.
2. **RAG:** el código vive en `rag/` del framework; la brecha operativa es **disponibilidad de Postgres pgvector + embeddings** (p. ej. `npm run rag:db:up` + `rag/.env`). Sin eso, `query.mjs` no aporta valor. **Engram** sigue usando el repo anidado `engineering-knowledge-base/` (a menudo **gitignored** en el padre; ver [`validacion-memoria-engram-rag.md`](validacion-memoria-engram-rag.md)).
3. **`spec:verify --all`:** **resuelto (2026-04-11):** se expanden slugs `archive/<carpeta>/` y los reportes usan nombres seguros (`verify-archive__….json`).
4. **Cobertura de drift código↔spec:** parcial — `spec:implements` valida rutas del árbol del framework; enlaces a `lib/lambda` / microservicios siguen siendo referencias cruzadas al monorepo backend (sin fallo en CI).
5. **Validación de salidas del modelo:** **mayormente resuelto (2026-04-11+)** — `spec:extract-json` / `extract-json-block.mjs` saca el primer objeto de fences \`\`\`json o texto mixto; encadenable a `validate-react-schemas --stdin`. Sigue faltando **parsing multi-turno** (varias observaciones en un solo log) sin heurística adicional.

---

## 5. Próximos pasos recomendados (tercera ola)

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| P0 | Añadir `tasks.md` al change admin con checklist real | **Hecho y archivado:** `openspec/changes/archive/2026-04-08-admin-transactions-saga-expansion/tasks.md` (spec publicada en `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`) |
| P1 | Script que valide un JSON arbitrario contra un esquema | **Hecho:** `node scripts/validate-react-schemas.mjs --data <path> --schema specify|plan|breakdown|verify` (ver `openspec/README.md`) |
| P1 | ~~Submódulo o script bootstrap RAG~~ | **Hecho en repo:** `rag/`, `rag:db:*`, daemons; mantener docs al día |
| P2 | Job opcional: grep de `implements:` en specs vs `git ls-files` | **Hecho (2026-04-10):** `npm run spec:implements` (`scripts/check-spec-implements.mjs`) — falla si rutas internas (`openspec/`, `docs/`, `scripts/`, `rag/`, `.github/`) no existen; refs `lib/`, `servicio-*`, etc. solo informativas |
| P2 | Prueba real del gate `implements:` | **Hecho:** `npm run test:implements-e2e`; `npm run framework:test` = CI local ampliado |
| P2 | Contenedor o `npx` wrapper “agente SDD” con máximo de iteraciones leyendo `tools-manifest.yaml` | **Parcial:** `react-runner.mjs` + `npm run react:smoke` + **`bin/framework-sdd.mjs`** (`npx framework-sdd` / `npx sdd`, `files` + dependencias runtime); sandbox rutas en verify/validate/react-runner |
| P3 | **5,0 global** | Memoria/EKB en CI opcional obligatoria, sandbox ejecución, extracción JSON desde transcripts, MCP unificado en runner |

---

## 6. Conclusión

El Framework-SDD cumple el rol de **base verificable y parcialmente probada en ejecución** (gates npm, CI, E2E de `implements:`, RAG con `rag:test` cuando el entorno está configurado). El salto a **plataforma ReAct autónoma** sigue condicionado a un **runtime de orquestación** y a **validación en caliente** de salidas del modelo; ver sección 10 para el nivel explícito.

---

## 7. Auditoría de eficiencia (ULTRA-ECONOMIZER)

- **Tokens / alcance:** revisión dirigida de workflows y package; sin releer `AGENTS.md` completo.  
- **Técnica:** cambios mínimos acoplados (proposal + script + ejemplos + doc de auditoría).

---

## 8. Addendum (2026-04-09) — Documentación y RAG en repo

- **`rag/`** forma parte del repositorio Framework-SDD (scripts, `docker-compose.postgres.yml`, `npm run rag:db:*` en la raíz).
- **Índice maestro:** [`INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md) y [`openspec/MEMORY.md`](../openspec/MEMORY.md).
- **Rúbrica (histórico):** en abril 2026 *Memoria / RAG / Engram* pasó de **2,0** a **2,8**; la tabla vigente en **sección 2** usa **3,0** al incorporar evidencia operativa `rag:test` (entorno con Postgres + embeddings).
- **Brecha #2 (sección 4):** el texto original asumía RAG “ausente”; queda sustituido por la distinción código-in-repo vs entorno configurado.

---

## 9. Addendum (2026-04-10) — Gate `implements:`

- **Script:** `scripts/check-spec-implements.mjs` — npm `spec:implements`, incluido en `framework:ci` y en `.github/workflows/sdd-framework.yml`.
- **Criterio:** rutas relativas bajo `openspec/`, `docs/`, `scripts/`, `rag/`, `.github/` deben existir (filesystem o `git ls-files`). Rutas `lib/`, `servicio-*`, `develop/`, `terraform/` se tratan como referencias al monorepo de producto y no rompen el gate.
- **E2E:** `npm run test:implements-e2e` — cuatro casos en `$TMPDIR`; **smoke:** `npm run framework:test` = `framework:ci` + E2E.

---

## 10. Lectura ejecutiva — ¿En qué nivel estamos?

| Pregunta | Respuesta breve |
|----------|------------------|
| **Nota global (1–5)** | **~4,0/5** (ver matiz §1: pilar ejecución ~4,7; memoria ~3,2). |
| **Nivel SDD/GAF del framework** | **2+ / inicio de 3** — gates + `react-runner` + verify archive; sin agente autónomo productivo. |
| **Qué está maduro** | OpenSpec + CI + E2E implements + **react:smoke**, **validate-react --stdin**, verify por `archive/*`, manifiesto YAML operativo. |
| **Qué falta para 5,0** | Bucle con LLM integrado, sandbox fuerte, EKB/memoria en CI obligatoria, extracción JSON desde texto libre, empaquetado `npx` publicado. |

---

## 11. Addendum (2026-04-10) — Sincronía documentación

- Índice y README raíz listan `framework:test`, `spec:implements`, E2E y CI actualizado.
- `project.md` fecha y bullets de layout OpenSpec ampliados.

---

## 12. Addendum (2026-04-11) — Objetivo 5,0 (incremento runtime)

- **Dependencia:** `yaml` (dev) para parsear `tools-manifest.yaml`.
- **Scripts npm:** `react:run`, `react:smoke`, `framework:platform-smoke` (= `framework:test` + `react:smoke`).
- **CI:** paso `ReAct runner smoke` tras E2E implements.
- **YAML:** notas del manifiesto sin backticks en flow style (compatibilidad parser strict).

---

## 13. Addendum — Extracción JSON + dry-run runner

- **`scripts/extract-json-block.mjs`**, `npm run spec:extract-json`, `npm run test:extract-json-e2e` (incluido en `framework:test`).
- **`react-runner --dry-run`:** valida plan contra manifiesto, `input_schema` (Ajv), `HANDLERS` y reglas p. ej. `spec_verify_report`.
- **Manifiesto:** `test_implements_e2e`, `spec_verify_report` sin `required` rígido en YAML (slug o `all`).
- **CI:** E2E extract + dry-run del plan de humo.
- **Posterior:** `extract-json-block --all` (NDJSON), `validate-react-schemas --stdin-ndjson`, `react:list-tools`; `spec:validate` acepta escenarios tipo lista `- GIVEN` y encabezados `#### Scenario`.
- **Sandbox rutas:** `verify-change` valida slugs (sin `..` / absolutos); `validate-react-schemas` (adhoc/stdin) exige `data` y `schema` resueltos bajo repo; `react-runner` aplica lo mismo en `spec_verify_report` y `spec_validate_react_data`; E2E `test:path-sandbox-e2e`.

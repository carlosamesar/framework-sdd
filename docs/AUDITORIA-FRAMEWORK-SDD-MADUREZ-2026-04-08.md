# Auditoría de madurez — Framework-SDD (ReAct / SDD)

**Fecha:** 2026-04-08  
**Alcance:** repositorio `Framework-SDD` tras segunda iteración (gates mecánicos, esquemas JSON, CI, `proposal` admin, módulos documentados).

---

## 1. Resumen ejecutivo

El framework pasó de una base **documental densa con automatización parcial** a un **núcleo verificable**: OpenSpec estructural, reportes `verify-*.json`, esquemas ReAct validados con **Ajv** en CI, y alineación del change `admin-transactions-saga-expansion` con `proposal.md`.  
La madurez global sube aproximadamente **de ~2,3/5 a ~3,4/5**: todavía no es una plataforma de agentes autónoma cerrada, pero **sí** una base repetible para **ReAct supervisado** (prompts `/gd:*` + herramientas `npm` + artefactos parseables).

---

## 2. Rúbrica actualizada (1–5)

| Dimensión | Antes (auditoría inicial) | Ahora | Notas |
|-----------|-------------------------|-------|--------|
| **Especificación y OpenSpec** | 3,0 | **4,0** | `config.yaml`, `changes/` validados, `proposal.md` en admin, README módulos opcional |
| **Automatización ejecutable** | 2,0 | **3,5** | `framework:ci`, workflow con `npm ci`, dos validadores Node |
| **Verificación y evidencia** | 2,0 | **3,5** | `verify-change.mjs` + JSON; ReAct examples + schema compile |
| **Memoria / RAG / Engram** | 2,0 | **2,8** | `rag/` en repo + Docker Postgres + daemons/MCP documentados; EKB sigue clon aparte y opcional para CI |
| **Base ReAct (tooling + observations)** | 2,0 | **3,5** | `tools-manifest.yaml`, esquemas + ejemplos + Ajv; falta runtime propio |
| **Consistencia docs ↔ código** | 2,0 | **3,5** | AGENTS ejemplo CI alineado; `project.md` dual layout explícito |

**Madurez global estimada: 3,4 / 5** (promedio ponderado ~70 % hacia “plataforma lista”) en la fecha original del informe. **Addendum 2026-04-09:** la fila *Memoria / RAG / Engram* se reevalúa en **2,8** (ver sección 8); el promedio global subiría ligeramente si se recalcula con ese valor.

---

## 3. Evidencia objetiva (artefactos)

| Artefacto | Función |
|-----------|---------|
| `openspec/config.yaml` | Rutas y convenciones |
| `scripts/validate-spec.mjs` | Estructura `changes/` + escenarios en specs |
| `scripts/verify-change.mjs` | `reports/verify-<slug>.json` |
| `scripts/validate-react-schemas.mjs` | Ajv sobre `*.schema.json` + `examples/*.example.json` |
| `package.json` / `package-lock.json` | Scripts y dependencia `ajv` |
| `.github/workflows/sdd-framework.yml` | CI: `npm ci` + validate + validate-react + verify --all |
| `openspec/tools-manifest.yaml` | Registro de herramientas para orquestación |
| `openspec/changes/.../proposal.md` | Admin change alineado a protocolo |
| `openspec/modules/README.md` | Placeholder ERP sin inventar árbol falso |

**Comandos verificados localmente:** `npm run framework:ci` → OK; `npm run spec:verify -- --all` → OK.

---

## 4. Brechas residuales (hacia 4,5–5,0)

1. **Sin motor ReAct dedicado:** el bucle Thought–Action–Observation lo ejecuta el IDE/LLM; no hay proceso Node que invoque herramientas hasta criterio de parada salvo CI puntual.
2. **RAG:** el código vive en `rag/` del framework; la brecha operativa es **disponibilidad de Postgres pgvector + embeddings** (p. ej. `npm run rag:db:up` + `rag/.env`). Sin eso, `query.mjs` no aporta valor. **Engram** sigue usando el repo anidado `engineering-knowledge-base/` (a menudo **gitignored** en el padre; ver [`validacion-memoria-engram-rag.md`](validacion-memoria-engram-rag.md)).
3. **`admin-transactions-saga-expansion`:** sigue **SPEC_ONLY** en verify (sin `tasks.md`); añadir breakdown cuando se retome la implementación.
4. **Cobertura de drift código↔spec:** no hay análisis AST ni enlaces automáticos `implements:` → archivos existentes (solo frontmatter humano).
5. **Validación de salidas del modelo:** los esquemas validan **ejemplos** fijos, no el JSON que emite el agente en cada sesión (haría falta un paso de “extract JSON del transcript” o salida a archivo obligatoria).

---

## 5. Próximos pasos recomendados (tercera ola)

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| P0 | Añadir `tasks.md` al change admin con checklist real | `verify` pasa a medir progreso |
| P1 | Script que valide un JSON arbitrario contra un esquema (`node scripts/validate-react-schemas.mjs --data path.json --schema specify`) | Agentes pueden autocorregir antes de commit |
| P1 | ~~Submódulo o script bootstrap RAG~~ | **Hecho en repo:** `rag/`, `rag:db:*`, daemons; mantener docs al día |
| P2 | Job opcional: grep de `implements:` en specs vs `git ls-files` | Detección temprana de drift |
| P2 | Contenedor o `npx` wrapper “agente SDD” con máximo de iteraciones leyendo `tools-manifest.yaml` | Acerca madurez ReAct a 4,5 |

---

## 6. Conclusión

El Framework-SDD cumple ahora el rol de **base fundamental verificable** para equipos y agentes: **especificaciones estructuradas, CI explícito y contratos JSON para observaciones**. Para ser **100 % plataforma ReAct autónoma** aún faltan runtime de orquestación, memoria integrada y validación en caliente de salidas del modelo; la hoja de ruta anterior prioriza `tasks.md` del admin y un validador ad-hoc de JSON de agente.

---

## 7. Auditoría de eficiencia (ULTRA-ECONOMIZER)

- **Tokens / alcance:** revisión dirigida de workflows y package; sin releer `AGENTS.md` completo.  
- **Técnica:** cambios mínimos acoplados (proposal + script + ejemplos + doc de auditoría).

---

## 8. Addendum (2026-04-09) — Documentación y RAG en repo

- **`rag/`** forma parte del repositorio Framework-SDD (scripts, `docker-compose.postgres.yml`, `npm run rag:db:*` en la raíz).
- **Índice maestro:** [`INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md) y [`openspec/MEMORY.md`](../openspec/MEMORY.md).
- **Rúbrica:** la dimensión *Memoria / RAG / Engram* se actualiza de **2,0** a **2,8** en la tabla de la sección 2 (código y procedimientos documentados; sigue siendo opcional operar Postgres/embeddings en cada máquina).
- **Brecha #2 (sección 4):** el texto original asumía RAG “ausente”; queda sustituido por la distinción código-in-repo vs entorno configurado.

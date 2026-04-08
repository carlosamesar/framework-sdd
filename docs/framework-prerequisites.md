# Prerrequisitos del Framework-SDD

Qué es **obligatorio** en este repo frente a qué es **opcional** pero recomendado (memoria, RAG, monorepo ERP completo).

## Índice maestro

- **[`INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md)** — mapa de toda la documentación relevante.
- **[`openspec/MEMORY.md`](../openspec/MEMORY.md)** — puente a memoria SDD y enlaces rápidos.

---

## Lineamiento: memoria automática (obligatorio si usas Engram + RAG)

Si trabajas con **Engram** y **RAG**, debes dejar en marcha los **daemons** de sync Engram y reindex RAG (o systemd equivalente). Ver **[`lineamiento-memoria-automatica.md`](lineamiento-memoria-automatica.md)** y `./scripts/start-memory-daemons.sh` o `npm run memory:daemons:start`.

---

## Núcleo mínimo (siempre en este repo)

| Componente | Uso |
|------------|-----|
| `AGENTS.md` | Contrato maestro de implementación |
| `openspec/config.yaml` + `openspec/changes/` | Delta specs |
| `npm run spec:validate` | Estructura OpenSpec |
| `npm run spec:validate-react` | Validación Ajv de esquemas ReAct + ejemplos |
| `npm run framework:ci` | Ambas validaciones (local / CI) |
| `npm run spec:verify -- <slug>` | Reporte JSON en `reports/verify-<slug>.json` |
| `openspec/tools-manifest.yaml` | Registro de herramientas para orquestación |

---

## RAG (`rag/`) — código en el repo; operación opcional

El directorio **`rag/`** forma parte de Framework-SDD: scripts de migración, indexación y consulta (`rag/scripts/*.mjs`). No hace falta “traer” RAG desde otro lado.

| Paso | Comando / doc |
|------|----------------|
| Dependencias del paquete RAG | `cd rag && npm install` (o vía `npm run rag:migrate` que instala) |
| Postgres con pgvector (recomendado local) | `npm run rag:db:up` — ver [`rag/README.md`](../rag/README.md) y `rag/docker-compose.postgres.yml` |
| Variables | `rag/.env` desde `rag/.env.example` (`RAG_DB_*`, embeddings OpenAI/Ollama) |
| Esquema | `npm run rag:migrate` |
| Índice | `npm run rag:index` (el daemon lo repite) |
| Consulta | `npm run rag:query -- "pregunta"` (equivale a `node rag/scripts/query.mjs`) |

Si **no** configuras Postgres ni embeddings, puedes seguir trabajando con `project.md`, `registry.md` y búsqueda en el IDE; **no** bloquea `spec:validate` ni `framework:ci`.

---

## Engram / `engineering-knowledge-base` (repo anidado)

- **Ubicación:** `engineering-knowledge-base/` **junto a** la raíz de Framework-SDD (clon de [engineering-knowledge-base](https://github.com/carlosamesar/engineering-knowledge-base)).
- **Importante:** esa carpeta suele estar en **`.gitignore`** del repo `Framework-SDD`; no aparece en `git status` del padre, pero **debe existir en disco** con `engram.db` y su propio `.git` si usas MCP `mem_*` con sync.
- **Validación detallada:** [`validacion-memoria-engram-rag.md`](validacion-memoria-engram-rag.md).
- **Push del daemon:** `ENGRAM_GIT_TOKEN` en `~/.config/framework-sdd/engram-daemon.env` (nunca en el repo). Plantilla: `config/engram-daemon.env.example`.
- **Sin EKB clonado:** cerrar trabajo vía `registry.md` / `project.md` hasta tener memoria Engram operativa.

---

## Opcional — árbol modular `openspec/modules/`

- **Cuándo:** monorepo ERP completo con módulos numerados.
- **Si solo existe `openspec/changes/`:** válido; `project.md` documenta ambos layouts.

---

## Cursor / Claude Code / OpenCode

- Comandos `/gd:*` viven en `.claude/commands/gd/`. Son instrucciones al modelo; los gates mecánicos siguen siendo `npm run spec:validate`, `npm run framework:ci`, etc.

## Orquestación Multi-Agente y Enforcement SDD

| Módulo | Propósito |
|--------|-----------|
| `packages/sdd-orchestrator/` | Orquestador central del ciclo SDD, enforcement y notificación |
| `packages/sdd-sdd-management/` | Gestión, validación y enforcement del SDD |
| `packages/sdd-ticket-management/` | Integración con tickets (GitHub/Jira/Trello) |
| `packages/sdd-agent-delegation/` | Delegación y trazabilidad multi-agente |
| `packages/sdd-messaging-tool/` | Mensajería omnicanal (email, Slack, Telegram) |

**Flujo recomendado:**
Todos los comandos gd:* pueden ser orquestados y auditados. El orquestador valida el SDD, crea tickets, delega tareas y notifica a agentes y usuario, con enforcement automático y trazabilidad.

# Índice — Documentación Framework-SDD

> Estado 2026-04-11: OpenSpec + CI + **react-runner** (`react:smoke`), orquestador **`sdd-agent`** (`pipeline`, `gd-cycle`), guía **producción** del agente, validación ReAct por **stdin**, `spec:verify` con `archive/*`, RAG con `rag:test`.

---

## Contrato y modelos

| Documento | Contenido |
|-----------|-----------|
| [`AGENTS.md`](../AGENTS.md) | Contrato maestro: arquitectura, multi-tenant, SAGA, TDD, pruebas, **memoria Engram + RAG**, prohibiciones |
| [`MODELS.md`](../MODELS.md) | Regla única para cualquier modelo → `AGENTS.md` |
| [`CLAUDE.md`](../CLAUDE.md), [`GEMINI.md`](../GEMINI.md), [`QWEN.md`](../QWEN.md) | Guías por herramienta (ultra-economizer + memoria) |
| [`openspec/MEMORY.md`](../openspec/MEMORY.md) | Puente a memoria SDD e índice de docs |

---

## OpenSpec, CI y agentes (ReAct)

| Documento / ruta | Contenido |
|------------------|-----------|
| [`openspec/README.md`](../openspec/README.md) | Layout `changes/`, `specs/`, `config.yaml`, validación |
| [**`docs/openspec-proyectos.md`**](openspec-proyectos.md) | **Multi-proyecto:** `openspec/projects/` espejando `develop/`, `FRAMEWORK_SDD_OPENSPEC_PROJECT`, `active_project` |
| [`openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`](../openspec/specs/saga/admin-unified-orchestrator-transaction-types.md) | Spec **APPROVED** — SAGA admin (Lambda orquestador) |
| [`openspec/config.yaml`](../openspec/config.yaml) | Rutas OpenSpec |
| [`openspec/tools-manifest.yaml`](../openspec/tools-manifest.yaml) | Herramientas para orquestación (`spec_validate`, `rag_query`, `memory_daemons_start`, …) |
| [**`docs/orquestador-agente-sdd.md`**](orquestador-agente-sdd.md) | **Instalación y uso del agente (dev):** `npm run agent:install`, `npx sdd-agent`, `pipeline`, **`gd-cycle`**, LLM, variables |
| [**`docs/orquestador-produccion.md`**](orquestador-produccion.md) | **Producción:** `agent:install:production`, secretos, CI vs LLM, checklist, `npm pack`, hardening |
| [`.claude/commands/gd/auditar-inventario-lambdas.md`](../.claude/commands/gd/auditar-inventario-lambdas.md) | **/gd:auditar-inventario-lambdas** + CLI `npx sdd-agent audit-inventario` (madurez lambdas inventario × SAGA) |
| [`openspec/templates/react-outputs/`](../openspec/templates/react-outputs/) | JSON Schema salidas `/gd:specify`, `plan`, `breakdown`, `verify` |
| [`.github/workflows/sdd-framework.yml`](../.github/workflows/sdd-framework.yml) | CI: validate + ReAct + implements + E2E + **react:smoke** + verify |
| [`docs/AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md`](AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md) | Madurez **~4,0/5** (pilar ejecución ~4,7); GAF **2+**; secciones 1–2, 10 y 12 |

**Comandos raíz:** `npm run framework:ci`, `npm run framework:test` (incluye orquestador + pipeline), `npm run framework:platform-smoke`, `npm run react:smoke`, `npm run react:list-tools`, **`npm run agent:install`**, **`npm run agent:install:production`**, **`npx sdd-agent`** (`pipeline` \| `gd-cycle` \| **`audit-inventario`** \| `list-tools` \| `llm` \| `demo`), **`npm run orchestrator:audit-inventario`**, **`npx framework-sdd`** / **`npx sdd`**, `packages/sdd-agent-orchestrator` (`graph:*`), `spec:extract-json` (`--all` → NDJSON), `validate-react-schemas --stdin-ndjson`, `spec:verify`, `react-runner --dry-run`

---

## Memoria persistente (Engram) y RAG

| Documento | Contenido |
|-----------|-----------|
| [**`lineamiento-memoria-automatica.md`**](lineamiento-memoria-automatica.md) | **Obligatorio en dev:** daemons Engram + RAG, systemd, variables |
| [`validacion-memoria-engram-rag.md`](validacion-memoria-engram-rag.md) | EKB anidado, gitignore, MCP, seguridad token |
| [`mcp-engram-multi-ide.md`](mcp-engram-multi-ide.md) | Cursor, Claude Code, OpenCode, Gemini, `engram-mcp.sh` |
| [`../README.md`](../README.md) | Sección *Memoria Persistente* + pasos de instalación |
| [`../rag/README.md`](../rag/README.md) | RAG: embeddings, **Postgres Docker** (`rag:db:up`), migrate, index, daemon |
| [`../config/README.md`](../config/README.md) | Plantillas `engram-daemon.env`, `rag-daemon.env`, MCP local |

**Comandos:** `npm run memory:daemons:start|stop|status`, `npm run rag:db:up|down`, `npm run rag:migrate|index|query`, `./scripts/engram-sync-daemon.sh`, `./scripts/rag-index-daemon.sh`

---

## Estado OpenSpec ERP (histórico / módulos)

| Documento | Contenido |
|-----------|-----------|
| [`project.md`](../project.md) | Índice maestro módulos + layout `openspec/changes/` |
| [`registry.md`](../registry.md) | IDs de cambios |

---

## Guías de uso IDE / flujo SDD

| Documento | Contenido |
|-----------|-----------|
| [`EJEMPLO-USO-GAF-OPENCODE.md`](EJEMPLO-USO-GAF-OPENCODE.md) | Instalación GAF, comandos `/gd:*`, memoria y RAG |
| [`framework-prerequisites.md`](framework-prerequisites.md) | Núcleo vs opcional, checklist desarrollador |
| [`sigat-workspace.md`](sigat-workspace.md) | Dominio SIGAT (si aplica al clon) |

---

## Configuración local (secretos)

| Plantilla | Destino típico |
|-----------|----------------|
| `config/engram-daemon.env.example` | `~/.config/framework-sdd/engram-daemon.env` |
| `config/rag-daemon.env.example` | `~/.config/framework-sdd/rag-daemon.env` |
| `rag/.env.example` | `rag/.env` (gitignored): BD RAG + OpenAI/Ollama |
| `.cursor/mcp.json` | MCP Engram en proyecto (Cursor) |

**No commitear** secretos; `rag/.env` y `config/*.local.env` están ignorados por git.

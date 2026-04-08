# Índice — Documentación Framework-SDD

> Actualizado con el estado del repo: OpenSpec validable, RAG + Postgres local Docker, Engram con daemons y MCP, lineamientos de memoria automática.

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
| [`openspec/README.md`](../openspec/README.md) | Layout `changes/`, `config.yaml`, validación |
| [`openspec/config.yaml`](../openspec/config.yaml) | Rutas OpenSpec |
| [`openspec/tools-manifest.yaml`](../openspec/tools-manifest.yaml) | Herramientas para orquestación (`spec_validate`, `rag_query`, `memory_daemons_start`, …) |
| [`openspec/templates/react-outputs/`](../openspec/templates/react-outputs/) | JSON Schema salidas `/gd:specify`, `plan`, `breakdown`, `verify` |
| [`.github/workflows/sdd-framework.yml`](../.github/workflows/sdd-framework.yml) | CI: `spec:validate`, `spec:validate-react`, `spec:verify` |
| [`docs/AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md`](AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md) | Auditoría de madurez (referencia histórica; contrastar con estado actual) |

**Comandos raíz:** `npm run spec:validate`, `npm run spec:validate-react`, `npm run framework:ci`, `npm run spec:verify -- <slug>|--all`

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

# Memoria SDD (OpenSpec)

Este archivo enlaza el protocolo de **memoria de proyecto** descrito en el contrato maestro.

## Dónde está la guía completa

| Tema | Documento |
|------|-----------|
| Contrato maestro (Engram, RAG, TDD, gates) | [`AGENTS.md`](../AGENTS.md) |
| Índice de toda la documentación del framework | [`docs/INDICE-DOCUMENTACION-FRAMEWORK.md`](../docs/INDICE-DOCUMENTACION-FRAMEWORK.md) |
| Prerrequisitos, RAG, OpenSpec, MCP | [`docs/framework-prerequisites.md`](../docs/framework-prerequisites.md) |
| **Obligatorio:** daemons Engram + RAG | [`docs/lineamiento-memoria-automatica.md`](../docs/lineamiento-memoria-automatica.md) |
| Engram vs RAG, EKB anidado | [`docs/validacion-memoria-engram-rag.md`](../docs/validacion-memoria-engram-rag.md) |
| MCP `mem_*` multi-IDE | [`docs/mcp-engram-multi-ide.md`](../docs/mcp-engram-multi-ide.md) |
| Estado módulos / cambios OpenSpec | [`project.md`](../project.md), [`registry.md`](../registry.md) |

## Comandos frecuentes

- RAG: `npm run rag:query -- "pregunta"` (desde la raíz; equivale a `node rag/scripts/query.mjs`)
- OpenSpec: `npm run spec:validate`, `npm run framework:ci`
- Memoria automática: `npm run memory:daemons:start` o `./scripts/start-memory-daemons.sh`

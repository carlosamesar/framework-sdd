# Tareas — agent-factory-langgraph

- [x] Crear paquete `packages/sdd-agent-orchestrator` con LangGraph y demo ejecutable
- [x] Documentar arquitectura CERO DEV + mapa `/gd:*` ↔ nodos
- [x] Propuesta OpenSpec (este change)
- [x] Adaptador `openspec/tools-manifest.yaml` → LangChain tools (`load-tools-manifest`, `build-langchain-tools`, `execute-manifest-tool`)
- [x] Nodo LLM + tool-calling acotado al manifiesto (`run-llm-react-agent.mjs`, tools `read_only` por defecto)
- [x] Human-in-the-loop con `interrupt()` (`sdd-orchestrated-graph.mjs`; `SDD_SKIP_HUMAN_GATE=1` en CI)
- [x] Checkpointer en memoria (`MemorySaver`) + `thread_id`; persistencia SQLite/Postgres = roadmap
- [x] Integración CI: paso en `.github/workflows/sdd-framework.yml` + `orchestrator:*` en `package.json` raíz
- [x] Alineación `/gd:*` ↔ fases: `design/GD-PHASE-SCHEMAS.md`
- [x] Ciclo completo `/gd:start` vía grafo (`sdd-gd-cycle-graph.mjs`, `run-gd-cycle.mjs`, `npx sdd-agent gd-cycle`, `npm run orchestrator:gd-cycle`)

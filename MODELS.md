# Cualquier modelo (IA) en este repositorio

**Regla única**: Todo agente o modelo que trabaje en este repo debe seguir **AGENTS.md** como contrato maestro.

- **Memoria primero**: Toda pregunta debe pasar primero por la Memoria: estado en [project.md](project.md) y [registry.md](registry.md); preguntas sobre reglas o cambios pasados vía RAG (`rag/scripts/query.mjs`). No responder sin consultar. Ver [openspec/MEMORY.md](openspec/MEMORY.md).
- **Maestro**: [AGENTS.md](AGENTS.md) — arquitectura, multi-tenant, ResponseBuilder, SAGA, TDD/BDD, planes de pruebas, RAG, migraciones (solo Node.js), prohibiciones.
- **Memoria infinita**: Al cerrar un change, actualizar [registry.md](registry.md) y [project.md](project.md). Ver [openspec/MEMORY.md](openspec/MEMORY.md).
- **Ultra-economizer**: Lectura mínima (3–5 archivos, bloques 100–150 líneas), SPEC antes de código, copiar patrones maduros, emitir auditoría de tokens al final.
- **Guías por herramienta** (opcional): [GEMINI.md](GEMINI.md), [CLAUDE.md](CLAUDE.md), [COPILOT.md](COPILOT.md) repiten y refuerzan lo anterior para cada producto.

Cualquier otro modelo (nuevo LLM, asistente interno, etc.): apuntar su contexto o system prompt a **AGENTS.md** y, si aplica, a este archivo.

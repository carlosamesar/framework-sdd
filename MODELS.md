# Cualquier modelo (IA) en este repositorio

**Regla única**: Todo agente o modelo que trabaje en este repo debe seguir **AGENTS.md** como contrato maestro.

- **Memoria primero**: Toda pregunta debe pasar primero por la Memoria: estado en [project.md](project.md) y [registry.md](registry.md); preguntas sobre reglas o cambios pasados vía RAG (`npm run rag:query -- "pregunta"`). No responder sin consultar. Ver [openspec/MEMORY.md](openspec/MEMORY.md) y [docs/INDICE-DOCUMENTACION-FRAMEWORK.md](docs/INDICE-DOCUMENTACION-FRAMEWORK.md).
- **Maestro**: [AGENTS.md](AGENTS.md) — arquitectura, multi-tenant, ResponseBuilder, SAGA, TDD/BDD, planes de pruebas, RAG, migraciones (solo Node.js), prohibiciones.
- **Memoria infinita**: Al cerrar un change, actualizar [registry.md](registry.md) y [project.md](project.md). Ver [openspec/MEMORY.md](openspec/MEMORY.md) y el índice [docs/INDICE-DOCUMENTACION-FRAMEWORK.md](docs/INDICE-DOCUMENTACION-FRAMEWORK.md).
- **Ultra-economizer**: Lectura mínima (3–5 archivos, bloques 100–150 líneas), SPEC antes de código, copiar patrones maduros, emitir auditoría de tokens al final.
- **Guías por herramienta**: [CLAUDE.md](CLAUDE.md), [OPENCODE.md](OPENCODE.md), [QWEN.md](QWEN.md), [GEMINI.md](GEMINI.md), [COPILOT.md](COPILOT.md) y [.github/copilot-instructions.md](.github/copilot-instructions.md) deben estar alineadas y cumplirse sin excepción.

## Orquestación gd:* obligatoria para todos los modelos

Todo trabajo debe seguir el mismo flujo severo y auditable:

```text
/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive
```

Reglas no negociables:
- no saltar gates sin autorización humana explícita;
- `/gd:review` es el orquestador central del cierre de calidad;
- no existe PASS parcial para cambios productivos;
- el cierre exige evidencia real, `CONSUMO.md`, `EVIDENCE.md` y documentación consistente;
- cualquier herramienta que no siga esta secuencia se considera fuera de cumplimiento.

Cualquier otro modelo (nuevo LLM, asistente interno, etc.): apuntar su contexto o system prompt a **AGENTS.md** y, si aplica, a este archivo.

# Design: PraisonAI → Don Carlo (/gd:*) Enrichment

## Technical Approach

Ampliar Don Carlo en dos capas ortogonales sin romper nada existente:

1. **Capa de Prompts** — 8 nuevos archivos `.claude/commands/gd/[nombre].md` que materializan patrones PraisonAI como comandos Don Carlo nativos (IDE-first, sin dependencias externas)
2. **Capa de Orquestador** — Módulos opcionales en `packages/sdd-agent-orchestrator/src/` que añaden hooks, guardrails, doom-loop detection y shadow checkpoints al grafo LangGraph existente

Ambas capas son **backward-compatible**: los 101 comandos existentes y los tests del orquestador deben seguir en verde.

---

## Architecture Decisions

| Decisión | Opción elegida | Alternativas rechazadas | Rationale |
|----------|---------------|-------------------------|-----------|
| Stack | Node.js nativo (LangGraph.js) | Python SDK praisonaiagents | Migración de stack injustificada; toda la infraestructura ya es Node |
| Integración PraisonAI | Patrones como inspiración (prompts + middleware) | Subprocess Python / SDK directo | Sin dependencias externas; Don Carlo mantiene autonomía total |
| Guardrails | Función validadora en cada nodo (post-edge hook) | Nodo LangGraph separado | Menos overhead de grafo; aplicable a nodos existentes sin modificarlos |
| Doom-loop detection | Contador de iteraciones en GdCycleState + circuit breaker | Timeout externo | Estado es la fuente de verdad; circuit breaker es configurable por env var |
| Shadow checkpoints | `git stash --include-untracked` por fase | MemorySaver de LangGraph | git stash es nativo, reversible y no requiere deps adicionales |
| Context compaction | Truncar `phaseOutputs` al superar umbral de tokens | Summarization via LLM | Simpler; sin llamadas LLM adicionales para compresión |
| Model router | `SDD_PHASE_MODEL_MAP` env var (fase → modelo) | Router ML automático | Configurable sin código; por defecto usa el modelo actual |
| Nuevos comandos | Archivos `.md` con instrucciones enriquecidas | Binario Python / script JS | Consistente con los 101 comandos existentes; zero overhead |

---

## Data Flow

### Orquestador enriquecido (gd-cycle-graph)

```
START → ingest → human_gate → detect_complexity
          │
          ├── [doom_loop_check]  ← NUEVO: abort si iteración > max
          │
          ├── minimal → llm_implement_quick → [guardrail] → gate → llm_review
          │
          └── full → llm_specify → [guardrail] → gate_after_specify
                       → llm_clarify → [guardrail]
                       → llm_plan    → [shadow_checkpoint]  ← NUEVO
                       → llm_breakdown → [guardrail]
                       → llm_implement → [shadow_checkpoint] ← NUEVO
                       → llm_review → verify_pipeline → llm_archive → END
                
[hooks: on_phase_start, on_phase_complete, on_phase_error]  ← NUEVO (en cada nodo)
```

### Nuevo comando `/gd:flow` (declarativo YAML)

```
/gd:flow gd-flow.yaml
     │
     ├── parse YAML → steps[]
     ├── para cada step: invocar /gd:[command] con contexto
     ├── parallel steps → Promise.all()
     └── resultado → traza unificada
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.claude/commands/gd/flow.md` | Create | Pipeline multi-fase declarativo (AgentFlow pattern) |
| `.claude/commands/gd/guardrail.md` | Create | Validación I/O por fase antes de continuar |
| `.claude/commands/gd/eval.md` | Create | Evaluation framework (accuracy/performance/reliability) |
| `.claude/commands/gd/checkpoint.md` | Create | Shadow git checkpoints por fase |
| `.claude/commands/gd/doom-shield.md` | Create | Detección y recuperación de ciclos atascados |
| `.claude/commands/gd/research.md` | Create | Deep research autónomo multi-step con web search |
| `.claude/commands/gd/route.md` | Create | Enrutamiento inteligente de tareas a comandos |
| `.claude/commands/gd/policy.md` | Create | Reglas declarativas de comportamiento por proyecto |
| `packages/sdd-agent-orchestrator/src/middleware/hooks.mjs` | Create | Hooks lifecycle: on_phase_start/complete/error |
| `packages/sdd-agent-orchestrator/src/middleware/guardrails.mjs` | Create | Validadores de transición entre nodos |
| `packages/sdd-agent-orchestrator/src/middleware/doom-loop.mjs` | Create | Circuit breaker para ciclos infinitos |
| `packages/sdd-agent-orchestrator/src/middleware/shadow-checkpoint.mjs` | Create | git stash automático por fase |
| `packages/sdd-agent-orchestrator/src/middleware/context-compaction.mjs` | Create | Truncado de phaseOutputs cuando supera umbral |
| `packages/sdd-agent-orchestrator/src/middleware/model-router.mjs` | Create | Mapeo fase → modelo LLM configurable |
| `packages/sdd-agent-orchestrator/src/graph/sdd-gd-cycle-graph.mjs` | Modify | Integrar middleware como wrappers de nodo opcionales |
| `COMMANDS-INDEX.md` | Modify | Agregar sección "Autonomía y Resiliencia" con 8 nuevos comandos |
| `docs/COMANDOS-GD-CREADOS.md` | Modify | Documentar v2 con los 8 nuevos + mejoras al orquestador |

---

## Interfaces / Contracts

### Hook interface (middleware/hooks.mjs)
```js
// Hook registrado globalmente, opt-in por nodo
export function createHooks(config = {}) {
  return {
    onPhaseStart: config.onPhaseStart ?? ((phase, state) => {}),
    onPhaseComplete: config.onPhaseComplete ?? ((phase, result, ms) => {}),
    onPhaseError: config.onPhaseError ?? ((phase, error) => {}),
  };
}

// Wrapper de nodo con hooks
export function withHooks(nodeFunc, phaseName, hooks) { ... }
```

### Guardrail interface (middleware/guardrails.mjs)
```js
// Validador: recibe output de fase, retorna { pass: bool, reason: string }
export function createGuardrail(validator) { ... }
export const defaultGuardrails = {
  spec: (output) => output.length > 100 ? { pass: true } : { pass: false, reason: 'Spec too short' },
  plan: (output) => output.includes('arquitectura') || output.includes('design') ? { pass: true } : { pass: false, reason: 'Missing architecture section' },
};
```

### Doom-loop detector (middleware/doom-loop.mjs)
```js
// GdCycleState ampliado
iterationCount: Annotation({ default: () => 0 }),

// Circuit breaker: configurable via SDD_MAX_ITERATIONS (default: 10)
export function checkDoomLoop(state) {
  const max = parseInt(process.env.SDD_MAX_ITERATIONS ?? '10');
  if (state.iterationCount >= max) throw new Error(`DoomLoop: superó ${max} iteraciones`);
}
```

### gd-flow.yaml schema
```yaml
name: my-pipeline
steps:
  - command: explore        # /gd:explore
    args: "src/modulo"
  - parallel:               # paralelo
    - command: estimate
    - command: tech-debt
  - command: plan
  - command: implement
on_error: abort | continue | retry
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | hooks.mjs, guardrails.mjs, doom-loop.mjs, shadow-checkpoint.mjs | Jest + mocks de estado LangGraph |
| Integration | gd-cycle-graph con middleware activado | `npm run orchestrator:test` en verde |
| E2E (comandos) | Los 8 nuevos `.md` tienen ejemplos de uso verificables | Manual durante implementación |
| Regresión | Los 101 comandos existentes no se modifican | `npm run framework:test` en verde |

---

## Migration / Rollout

Sin migración de datos. Todos los nuevos módulos son opt-in:

- Middleware activado via `SDD_FEATURES=hooks,guardrails,doom-loop` (o vacío = comportamiento actual)
- Los 8 comandos nuevos son archivos independientes — no afectan comandos existentes
- Fase 1 (comandos): sin tocar el orquestador → riesgo cero
- Fase 2 (orquestador): todos los cambios como wrappers opcionales → backward compatible

## Open Questions

- [ ] ¿`/gd:guardrail` debe bloquear la ejecución (hard stop) o solo emitir advertencia (soft guardrail)?
- [ ] ¿Los shadow checkpoints con `git stash` aplican en repos sin `git`? (necesita fallback graceful)
- [ ] ¿El model router debe exponerse como `/gd:router` separado o solo como configuración del orquestador?

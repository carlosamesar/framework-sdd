# Tasks: PraisonAI → Don Carlo (/gd:*) Enrichment

**Change**: praisonai-don-carlo-enrichment  
**Nivel**: 3 (Complex) | **Fases**: 4 | **Total tareas**: 28

---

## Phase 1: Middleware Foundation (Orquestador)

- [ ] 1.1 Crear `packages/sdd-agent-orchestrator/src/middleware/hooks.mjs` con `createHooks()` y `withHooks()` — wrapper de nodo con on_phase_start/complete/error
- [ ] 1.2 Crear `packages/sdd-agent-orchestrator/src/middleware/doom-loop.mjs` con `checkDoomLoop()` — circuit breaker configurable via `SDD_MAX_ITERATIONS` (default: 10)
- [ ] 1.3 Crear `packages/sdd-agent-orchestrator/src/middleware/guardrails.mjs` con `createGuardrail()` y `defaultGuardrails` (spec, plan, implement)
- [ ] 1.4 Crear `packages/sdd-agent-orchestrator/src/middleware/shadow-checkpoint.mjs` con `createShadowCheckpoint()` — `git stash --include-untracked` con fallback graceful si no hay git
- [ ] 1.5 Crear `packages/sdd-agent-orchestrator/src/middleware/context-compaction.mjs` con `compactPhaseOutputs()` — trunca si supera `SDD_MAX_CONTEXT_CHARS` (default: 20000)
- [ ] 1.6 Crear `packages/sdd-agent-orchestrator/src/middleware/model-router.mjs` con `resolveModelForPhase()` — lee `SDD_PHASE_MODEL_MAP` env var (JSON map fase→modelo)
- [ ] 1.7 Crear `packages/sdd-agent-orchestrator/src/middleware/index.mjs` — export barrel de todos los middlewares

## Phase 2: Integrar Middleware en el Orquestador

- [ ] 2.1 Modificar `sdd-gd-cycle-graph.mjs` — añadir `iterationCount` a `GdCycleState` y llamar `checkDoomLoop()` en `nodeIngest`
- [ ] 2.2 Modificar `sdd-gd-cycle-graph.mjs` — envolver cada `nodeLlm*` con `withHooks()` (opt-in via `SDD_FEATURES` env var)
- [ ] 2.3 Modificar `sdd-gd-cycle-graph.mjs` — insertar `compactPhaseOutputs()` al inicio de cada nodo LLM
- [ ] 2.4 Modificar `sdd-gd-cycle-graph.mjs` — agregar `createShadowCheckpoint()` después de `llm_plan` y `llm_implement`
- [ ] 2.5 Modificar `sdd-gd-cycle-graph.mjs` — integrar `resolveModelForPhase()` en `invokeGdPhaseLlm` (pasar modelo correcto por fase)

## Phase 3: Nuevos Comandos /gd:* (Prompts)

- [ ] 3.1 Crear `.claude/commands/gd/flow.md` — `/gd:flow [archivo.yaml]`: parsear YAML declarativo, ejecutar steps secuenciales y paralelos, producir traza unificada
- [ ] 3.2 Crear `.claude/commands/gd/guardrail.md` — `/gd:guardrail [output] [criterio]`: validar output de una fase contra criterio, retornar pass/fail con razón
- [ ] 3.3 Crear `.claude/commands/gd/eval.md` — `/gd:eval [fase] [output]`: evaluar accuracy (¿cumple spec?), performance (¿conciso?), reliability (¿consistente?) con score 0-100
- [ ] 3.4 Crear `.claude/commands/gd/checkpoint.md` — `/gd:checkpoint [nombre]`: crear snapshot git antes de fases destructivas; `/gd:checkpoint restore [id]` para rollback
- [ ] 3.5 Crear `.claude/commands/gd/doom-shield.md` — `/gd:doom-shield [contexto]`: diagnosticar si el agente está en loop, proponer estrategia de salida
- [ ] 3.6 Crear `.claude/commands/gd/research.md` — `/gd:research [tema]`: investigación autónoma multi-step con web search, síntesis, y output estructurado (inspira en DeepResearchAgent de PraisonAI)
- [ ] 3.7 Crear `.claude/commands/gd/route.md` — `/gd:route [tarea]`: analizar tarea y recomendar el comando `/gd:*` más apropiado con justificación
- [ ] 3.8 Crear `.claude/commands/gd/policy.md` — `/gd:policy [init|show|apply]`: declarar, ver y aplicar reglas de comportamiento del agente por proyecto en YAML

## Phase 4: Tests, Documentación y Verificación

- [ ] 4.1 Crear tests unitarios para `hooks.mjs` — verificar que `on_phase_start`, `on_phase_complete` y `on_phase_error` se invocan correctamente
- [ ] 4.2 Crear tests unitarios para `doom-loop.mjs` — verificar circuit breaker a los 10, 5 y 1 iteraciones
- [ ] 4.3 Crear tests unitarios para `guardrails.mjs` — verificar pass/fail con `defaultGuardrails.spec` y `defaultGuardrails.plan`
- [ ] 4.4 Crear tests unitarios para `shadow-checkpoint.mjs` — verificar fallback graceful cuando no hay `git`
- [ ] 4.5 Ejecutar `npm run orchestrator:test` — confirmar que todos los tests pasan (incluyendo los existentes)
- [ ] 4.6 Actualizar `COMMANDS-INDEX.md` — agregar sección "Autonomía y Resiliencia (PraisonAI-Inspired)" con los 8 nuevos comandos
- [ ] 4.7 Actualizar `docs/COMANDOS-GD-CREADOS.md` — documentar v2.0 con tabla de nuevos comandos y mejoras al orquestador
- [ ] 4.8 Ejecutar `npm run framework:test` — confirmar que toda la suite de tests sigue en verde

---

## Notas de Implementación

- **Orden obligatorio**: Phase 1 completa antes de Phase 2; Phase 3 es independiente (puede ir en paralelo con 1 y 2)
- **TDD**: Tasks 4.1-4.4 idealmente se escriben ANTES de las tasks 1.1-1.6 (RED → GREEN)
- **Opt-in**: Todo el middleware en `SDD_FEATURES` — si la variable no está definida, comportamiento actual se mantiene intacto
- **Pregunta abierta resuelta**: `/gd:guardrail` por defecto es soft (advertencia); hard stop requiere `SDD_GUARDRAIL_STRICT=1`

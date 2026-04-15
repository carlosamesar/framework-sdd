# Evidence: PraisonAI → Don Carlo Enrichment

**Change**: `praisonai-don-carlo-enrichment`  
**Execution Date**: 2026-04-10  
**Mode**: Standard (Complex — 4 phases, 28 tasks)

## Summary

Se incorporaron patrones de PraisonAI al framework SDD Don Carlo para añadir capacidades de orchestración autónoma: hooks lifecycle, guardrails por fase, doom-loop detection, shadow checkpoints, context compaction y model routing. Todo implementado como middleware opt-in en el orquestador LangGraph + 8 nuevos comandos `/gd:*`.

**Resultado**: ✅ **28/28 tasks completed, 57/57 tests passing**

## Phase 1: Middleware Foundation

| File | Description |
|------|-------------|
| `src/middleware/hooks.mjs` | `createHooks()` / `withHooks()` — on_phase_start/complete/error callbacks |
| `src/middleware/doom-loop.mjs` | `checkDoomLoop()` — circuit breaker via `SDD_MAX_ITERATIONS` (default: 10) |
| `src/middleware/guardrails.mjs` | `createGuardrail()` + `defaultGuardrails` for spec, plan, implement, breakdown phases |
| `src/middleware/shadow-checkpoint.mjs` | `createShadowCheckpoint()` — git stash with graceful fallback |
| `src/middleware/context-compaction.mjs` | `compactPhaseOutputs()` — truncate at `SDD_MAX_CONTEXT_CHARS` (20000) |
| `src/middleware/model-router.mjs` | `resolveModelForPhase()` — reads `SDD_PHASE_MODEL_MAP` env var |
| `src/middleware/index.mjs` | Barrel export for all middleware |

## Phase 2: Graph Integration

All middleware integrated into `src/graph/sdd-gd-cycle-graph.mjs`:
- `checkDoomLoop()` called in `nodeIngest` with `iterationCount` tracking
- `withHooks()` wraps each LLM node (opt-in via `SDD_FEATURES`)
- `compactPhaseOutputs()` inserted at start of each LLM node
- `createShadowCheckpoint()` after `llm_plan` and `llm_implement`
- `resolveModelForPhase()` integrated in `invokeGdPhaseLlm`

## Phase 3: New Commands

| Command | File | Purpose |
|---------|------|---------|
| `/gd:flow` | `.claude/commands/gd/flow.md` | Declarative YAML multi-phase pipeline |
| `/gd:guardrail` | `.claude/commands/gd/guardrail.md` | Validate phase output against criteria |
| `/gd:eval` | `.claude/commands/gd/eval.md` | Score accuracy/performance/reliability (0-100) |
| `/gd:checkpoint` | `.claude/commands/gd/checkpoint.md` | Git snapshots + rollback |
| `/gd:doom-shield` | `.claude/commands/gd/doom-shield.md` | Diagnose and break agent loops |
| `/gd:research` | `.claude/commands/gd/research.md` | Autonomous multi-step research |
| `/gd:route` | `.claude/commands/gd/route.md` | Route task to best `/gd:*` command |
| `/gd:policy` | `.claude/commands/gd/policy.md` | Project-level agent behavior rules |

## Phase 4: Test Results

```
npm test (orchestrator)
  ✔ 57 passed, 0 failed
  Suites: 1
  Duration: 184ms

  Key test groups:
  ✔ hooks.mjs — 7 passed (createHooks, withHooks, isHooksEnabled, maybeWithHooks)
  ✔ doom-loop.mjs — 9 passed (getMaxIterations, checkDoomLoop at 10/5/1, DoomLoopError)
  ✔ guardrails.mjs — 12 passed (enabled, spec/plan/implement/breakdown rules, soft/strict modes)
  ✔ shadow-checkpoint.mjs — 5 passed (enabled, fallback graceful, no-throw)
  ✔ gd-command-registry — 11 passed (list, parsePrimarySlash, resolveGdMarkdown)
  ✔ existing manifest/prompts tests — 13 passed
```

## Documentation Updated

| File | Change |
|------|--------|
| `COMMANDS-INDEX.md` | Added 8 new commands in "Autonomía y Resiliencia" section |
| `docs/COMANDOS-GD-CREADOS.md` | Updated with v2.0 coverage |

## Risk Mitigations Verified

- ✅ All middleware is opt-in via `SDD_FEATURES` env var
- ✅ No existing commands were modified — only new files added
- ✅ Graceful fallbacks when git not available (shadow-checkpoint)
- ✅ DoomLoopError thrown at configurable limits (1, 5, 10)
- ✅ Guardrails warn in soft mode, throw in strict mode

## Files Created/Modified

| Category | Count | Examples |
|----------|-------|----------|
| Middleware source files | 7 | hooks.mjs, doom-loop.mjs, guardrails.mjs, ... |
| Middleware test files | 4 | hooks.test.mjs, doom-loop.test.mjs, ... |
| Command prompt files | 8 | flow.md, guardrail.md, eval.md, ... |
| Graph integration | 1 | sdd-gd-cycle-graph.mjs (modified) |
| Documentation | 2 | COMMANDS-INDEX.md, COMANDOS-GD-CREADOS.md |

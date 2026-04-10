# Exploration: PraisonAI → Don Carlo (/gd:*) Enrichment

**Fecha**: 2026-04-10  
**Nivel de complejidad detectado**: 3 (Complex — multi-módulo, cambio arquitectónico)  
**Autor**: OpenCode (exploración autónoma con sdd-explore skill)

---

## Estado Actual del Sistema

### Framework-SDD / Don Carlo (/gd:*)

El Framework-SDD implementa un sistema SDD (Spec-Driven Development) con:

- **101 comandos `/gd:*`** organizados en categorías (pipeline, análisis, testing, documentación, automatización, razonamiento)
- **15 modelos de razonamiento** (`/gd:razonar:*`)
- **Orquestador LangGraph** (`packages/sdd-agent-orchestrator/`) — implementado en Node.js
- **Memoria persistente** vía Engram (SQLite FTS5)
- **OpenSpec** como persistencia de artefactos SDD en filesystem
- **Skills** como instrucciones modulares cargadas dinámicamente
- **Modo híbrido** (Engram + filesystem) para trazabilidad completa

**Fortalezas actuales**:
- Pipeline SDD completo (6 fases: Specify → Clarify → Plan → Breakdown → Implement → Verify → Archive)
- Ingeniería inversa, estimaciones, deuda técnica
- Integración con OpenCode (IDE-first)
- Multi-tenant via JWT (capa de negocio robusta)
- TDD obligatorio con evidencia

**Brechas identificadas** (comparado con PraisonAI):
- Sin flujos de trabajo declarativos (YAML workflows)
- Sin paralelización declarativa de agentes
- Sin modo `--planning` con planning autónomo por LLM
- Sin `--guardrails` de validación output en tiempo real
- Sin `eval` framework (accuracy/performance/reliability)
- Sin `hooks` lifecycle (on_step_error, on_step_complete)
- Sin scheduling nativo (`/gd:webhook` parcialmente cubre esto)
- Sin doom-loop detection (recuperación automática de agentes atascados)
- Sin shadow git checkpoints automáticos
- Sin context compaction configurable
- Sin model router (selección automática de modelo por costo/capacidad)
- Sin `--background` tasks (fire-and-forget)
- Sin telemetría/observabilidad (OpenTelemetry)

---

## Análisis de PraisonAI

### Arquitectura Core

PraisonAI es un framework Python de agentes IA con:

```
praisonaiagents/     ← Core SDK
├── agent/           ← Agent, ImageAgent, ContextAgent, DeepResearchAgent
├── agents/          ← Multi-agent orchestration (AgentTeam)
├── workflows/       ← AgentFlow (sequential, parallel, loop, route, repeat)
├── memory/          ← FileMemory, AutoMemory, RulesManager, Checkpoints
├── knowledge/       ← RAG, chunking, vector stores, rerankers
├── planning/        ← PlanningAgent, Plan, PlanStep, TodoList
├── guardrails/      ← LLMGuardrail, GuardrailResult
├── eval/            ← AccuracyEvaluator, PerformanceEvaluator, ReliabilityEvaluator
├── hooks/           ← Event hooks, middleware
├── mcp/             ← MCP transports (HTTP, WebSocket, SSE, stdio)
├── telemetry/       ← OpenTelemetry, 16 providers (Langfuse, LangSmith, etc.)
├── llm/             ← LLM client, model router, rate limiter
├── compaction/      ← Context compaction
└── background/      ← Background task execution
```

### Características de Mayor Valor para Don Carlo

#### TIER 1 — Alto impacto, incorporable inmediatamente

| Capacidad PraisonAI | Equivalente /gd:* actual | Brecha | Valor para Don Carlo |
|---------------------|--------------------------|--------|----------------------|
| **AgentFlow** (route/parallel/loop/repeat) | No existe | Alta | Paralelizar fases SDD (plan + estimate en paralelo) |
| **Planning Mode** (`planning=True`) | `/gd:plan` es guía estática | Media | Planificación autónoma antes de ejecutar ciclos |
| **Guardrails** (validación I/O) | `/gd:validar-spec` manual | Alta | Validar output de cada fase automáticamente |
| **Doom-Loop Detection** | No existe | Alta | Prevenir loops infinitos en ciclos SDD automáticos |
| **Shadow Git Checkpoints** | No existe | Alta | Rollback automático si fase falla |
| **Memory Slash Commands** | `/gd:time-travel` + Engram | Media | Interfaz unificada `/memory *` dentro de Don Carlo |
| **Hooks (lifecycle)** | No existe | Alta | `on_phase_start`, `on_phase_error`, `on_phase_complete` |
| **Context Compaction** | No existe | Alta | Crítico para sesiones largas de SDD |

#### TIER 2 — Impacto medio, requiere diseño

| Capacidad PraisonAI | Equivalente /gd:* actual | Brecha | Valor para Don Carlo |
|---------------------|--------------------------|--------|----------------------|
| **Eval Framework** (accuracy/performance) | `/gd:spec-score` parcial | Media | Evaluar calidad de outputs de fases SDD |
| **Model Router** | No existe | Media | Usar modelo barato para fases simples, costoso para diseño |
| **Background Tasks** | `/gd:webhook` parcial | Media | Ejecutar `/gd:archive` en background |
| **Deep Research Agent** | No existe | Media | `/gd:explore` enriquecido con web search real |
| **AutoMemory** (extracción automática) | Engram manual | Media | Extraer learnings de fases automáticamente |
| **Policy Engine** | AGENTS.md (reglas estáticas) | Media | Reglas declarativas por proyecto |
| **Rules Manager** | AGENTS.md (cargado globalmente) | Media | Reglas por proyecto en YAML, no global |
| **Workflow YAML** | OpenSpec + tasks.md | Alta | `/gd:start` definible como YAML workflow |

#### TIER 3 — Bajo impacto o fuera de alcance

| Capacidad PraisonAI | Razón de exclusión |
|---------------------|---------------------|
| Multi-modal (imagen/video/audio) | No aplica al dominio SDD actual |
| Training (`praisonai train`) | Fuera de scope de Don Carlo |
| UI Chainlit/Gradio | Don Carlo es CLI/IDE-first |
| Call/Realtime Voice | Cubierto por `/gd:voice` de forma diferente |
| LangFlow visual builder | Overhead para usuarios técnicos |
| MCP security avanzado | Necesidad futura |

---

## Áreas Afectadas en el Framework

```
Framework-SDD/
├── packages/sdd-agent-orchestrator/   ← MAYOR IMPACTO (ampliar LangGraph con PraisonAI patterns)
│   ├── src/                           ← Añadir: hooks, guardrails, doom-loop-detection
│   └── design/                        ← Actualizar arquitectura
├── .claude/commands/gd/               ← IMPACTO MEDIO (nuevos comandos)
│   ├── flow.md                        ← NUEVO: definir AgentFlow YAML
│   ├── eval.md                        ← NUEVO: evaluation framework
│   ├── guardrail.md                   ← NUEVO: validación I/O de fases
│   └── checkpoint.md                  ← NUEVO: shadow git checkpoints
├── openspec/tools-manifest.yaml       ← Añadir herramientas nuevas
├── AGENTS.md/.agents-core/            ← Nuevo módulo: praison-patterns.md
└── skills/                            ← Skills enriquecidas con PraisonAI patterns
```

---

## Enfoques Posibles

### Opción A: Reescribir el orquestador con SDK praisonaiagents
- **Descripción**: Reemplazar LangGraph.js por `praisonaiagents` Python
- **Pros**: Acceso nativo a TODOS los features de PraisonAI; ecosistema rico
- **Cons**: Migración grande; rompe Node.js stack; requiere Python runtime; riesgo alto
- **Esfuerzo**: Alto (4-6 semanas)
- **Recomendación**: NO — cambio de stack no justificado

### Opción B: Adoptar patrones de PraisonAI como nuevos comandos /gd:*
- **Descripción**: Implementar los conceptos de PraisonAI como comandos Don Carlo (prompts + lógica en markdown)
- **Pros**: No rompe nada; incremental; mantiene stack Node.js; Don Carlo sigue siendo el orquestador
- **Cons**: Los patrones son "inspirados en" PraisonAI, no nativos
- **Esfuerzo**: Medio (2-3 semanas)
- **Recomendación**: SÍ — como capa de comandos nuevos

### Opción C: Bridge Node.js ↔ Python SDK (híbrido)
- **Descripción**: Usar `praisonaiagents` como subprocess/microservicio para capacidades específicas (eval, deep research, memory avanzada)
- **Pros**: Usa features reales de PraisonAI donde Don Carlo no los tiene; mantiene stack
- **Cons**: Complejidad de integración; latencia subprocess
- **Esfuerzo**: Medio-alto (3-4 semanas)
- **Recomendación**: SÍ para capacidades específicas (Eval Framework, Deep Research)

### Opción D: Enriquecer el orquestador LangGraph con hooks/guardrails nativos
- **Descripción**: Implementar en el orquestador LangGraph.js los patrones de hooks, guardrails, doom-loop detection y checkpoints — inspirados en PraisonAI pero en Node.js nativo
- **Pros**: Stack unificado; incorpora lo más valioso de PraisonAI sin dependencias externas
- **Cons**: Requiere implementar desde cero (más tiempo que usar SDK)
- **Esfuerzo**: Medio (2-3 semanas)
- **Recomendación**: SÍ — complementa Opción B

---

## Recomendación

**Adoptar Opciones B + D en paralelo** como un único change de enriquecimiento:

### Fase 1 — Nuevos Comandos Inspirados en PraisonAI (B)

Crear los siguientes comandos `/gd:*` nuevos:

1. **`/gd:flow`** — Definir y ejecutar flujos multi-agente declarativos (inspirado en AgentFlow)
   ```yaml
   # gd-flow.yaml
   name: mi-pipeline
   steps:
     - agent: explorer
       command: /gd:explore
     - parallel:
       - agent: estimator
         command: /gd:estimate
       - agent: tech-debt-scanner
         command: /gd:tech-debt
     - agent: planner
       command: /gd:plan
   ```

2. **`/gd:guardrail`** — Validación automática de output por fase (inspirado en Guardrails)

3. **`/gd:eval`** — Framework de evaluación de calidad de outputs SDD (inspirado en Eval)

4. **`/gd:checkpoint`** — Shadow git checkpoints por fase (inspirado en Checkpoints)

5. **`/gd:doom-shield`** — Detectar y recuperar ciclos atascados (inspirado en Doom Loop Detection)

6. **`/gd:research`** — Deep research autónomo con web search (inspirado en DeepResearchAgent)

7. **`/gd:route`** — Enrutamiento inteligente de tareas a comandos (inspirado en Routing)

8. **`/gd:policy`** — Declarar reglas de comportamiento del agente por proyecto (inspirado en Policy Engine)

### Fase 2 — Orquestador Enriquecido (D)

Ampliar `packages/sdd-agent-orchestrator/` con:

1. **Hooks lifecycle** para cada nodo del grafo LangGraph
2. **Guardrails** como validadores de transición entre nodos
3. **Doom-loop detection** con contador de iteraciones + circuit breaker
4. **Shadow checkpoints** via git stash automático por fase
5. **Context compaction** para sesiones largas
6. **Model router** — ruta a modelo barato para fases de bajo riesgo

---

## Riesgos

- **R1**: Scope creep — PraisonAI tiene 200+ features; seleccionar solo los TIER 1 y 2 más relevantes
- **R2**: Duplicación con funcionalidad existente — validar que cada nuevo comando no duplica `/gd:*` existentes
- **R3**: Breaking changes en el orquestador — todos los cambios deben ser backward compatible
- **R4**: Overhead de mantenimiento — cada nuevo comando es documentación que mantener

---

## Listo para Propuesta

**Sí** — El análisis es suficientemente claro para generar una propuesta formal.

**Lo que debe decirle al usuario**: Se identificaron 8 nuevos comandos `/gd:*` de alto valor y 6 mejoras al orquestador LangGraph, todos inspirados en los patrones más maduros de PraisonAI (Guardrails, AgentFlow, Eval, Hooks, Doom-Loop Detection, Shadow Checkpoints). La recomendación es un change de Nivel 3 con 2 fases paralelas que enriquecen Don Carlo sin cambiar su stack ni romper ningún comando existente.

---

## Resumen Ejecutivo para Don Carlo

### Lo más valioso de PraisonAI que Don Carlo no tiene (y debe tener):

| # | Feature PraisonAI | Comando Don Carlo propuesto | Impacto |
|---|-------------------|-----------------------------|---------|
| 1 | AgentFlow (parallel/loop/route) | `/gd:flow` | 🔴 CRÍTICO — habilita automatización real |
| 2 | Guardrails (I/O validation) | `/gd:guardrail` | 🔴 CRÍTICO — calidad garantizada por fase |
| 3 | Hooks lifecycle | Orquestador interno | 🔴 CRÍTICO — observabilidad del pipeline |
| 4 | Doom Loop Detection | `/gd:doom-shield` | 🟠 ALTO — previene ciclos infinitos |
| 5 | Shadow Git Checkpoints | `/gd:checkpoint` | 🟠 ALTO — rollback automático |
| 6 | Eval Framework | `/gd:eval` | 🟠 ALTO — medir calidad objetivamente |
| 7 | Context Compaction | Orquestador interno | 🟠 ALTO — sesiones largas estables |
| 8 | Deep Research Agent | `/gd:research` | 🟡 MEDIO — exploración enriquecida |
| 9 | Model Router | Orquestador interno | 🟡 MEDIO — optimización de costo |
| 10 | Policy Engine | `/gd:policy` | 🟡 MEDIO — reglas declarativas por proyecto |

### Lo que PraisonAI tiene pero Don Carlo no necesita (por ahora):
- Multi-modal (imagen/video) — fuera del dominio SDD
- UI Chainlit/Gradio — Don Carlo es CLI/IDE-first
- Training/Fine-tuning — fuera del scope
- LangFlow visual — overhead para usuarios técnicos

### Lo que Don Carlo tiene y PraisonAI no tiene (ventajas a mantener):
- Pipeline SDD formal con 6 fases y trazabilidad completa
- 15 modelos de razonamiento (`/gd:razonar:*`)
- Multi-tenant con JWT (capa de negocio)
- TDD obligatorio con evidencia
- Engram como memoria persistente entre IDEs/sessiones
- OpenSpec como persistencia de artefactos estructurada
- Ingeniería inversa (`/gd:reversa`)
- Deuda técnica cuantificada (`/gd:tech-debt`)

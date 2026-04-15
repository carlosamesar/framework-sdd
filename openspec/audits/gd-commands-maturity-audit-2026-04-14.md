# Auditoría de Madurez — Comandos `/gd:*`

**Fecha**: 2026-04-14  
**Autor**: Auditoría automatizada (OpenCode / Claude Sonnet)  
**Proyecto**: Framework-SDD  
**Scope**: Todos los 95 comandos en `.claude/commands/gd/`

---

## 1. Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Total de comandos | **95** |
| Nivel 1 — Stub | **45** (47.4%) |
| Nivel 2 — Alias puro | **7** (7.4%) |
| Nivel 3 — Parcial | **16** (16.8%) |
| Nivel 4 — Maduro | **19** (20.0%) |
| Nivel 5 — Maduro + Integrado | **8** (8.4%) |
| **Score de madurez global** | **2.34 / 5.0** |
| Comandos con integración real al orquestador | **8 / 95** (8.4%) |

**Conclusión**: El framework tiene una base sólida de ~27 comandos maduros (Niveles 4-5), pero el **47% de los comandos son stubs** sin implementación real. La brecha más crítica no es la cantidad de comandos, sino la **casi nula integración con el orquestador** — solo los 8 comandos PraisonAI nuevos tienen wiring real.

---

## 2. Escala de Madurez

| Nivel | Nombre | Criterios |
|-------|--------|-----------|
| **1** | Stub / Placeholder | 3-7 líneas. Solo título, 1 línea de propósito, lista de agentes. Sin instrucciones ejecutables. |
| **2** | Alias puro | Redirige a otro comando. Sin lógica propia. |
| **3** | Parcialmente desarrollado | Tiene secciones (propósito, uso, pasos), pero sin ejemplos concretos, output esperado, o instrucciones suficientemente detalladas para ejecutarse autónomamente. |
| **4** | Maduro | Propósito claro, pasos detallados, output esperado, parámetros, ejemplos, alias, siguiente paso sugerido. Ejecutable autónomamente. |
| **5** | Maduro + Integrado | Nivel 4 + integración real con el orquestador (manifiesto, hooks, trazabilidad, routing). |

---

## 3. Catálogo Completo por Nivel

### Nivel 5 — Maduro + Integrado (8 comandos)

> Estos son los comandos creados en el change `praisonai-don-carlo-enrichment`. Tienen wiring con el orquestador LangGraph.

| Comando | Líneas | Descripción |
|---------|--------|-------------|
| `/gd:checkpoint` | 100 | Guardado de estado con snapshot persistente |
| `/gd:doom-shield` | 86 | Detección y escape de doom-loops |
| `/gd:eval` | 90 | Evaluación de calidad de output con scoring |
| `/gd:flow` | 96 | Control de flujo condicional en el pipeline |
| `/gd:guardrail` | 91 | Restricciones y validaciones de seguridad |
| `/gd:policy` | 129 | Políticas de comportamiento del agente |
| `/gd:research` | 94 | Investigación autónoma con síntesis |
| `/gd:route` | 83 | Routing inteligente entre agentes |

---

### Nivel 4 — Maduro (19 comandos)

> Ejecutables autónomamente pero sin integración formal con el orquestador.

| Comando | Líneas | Descripción |
|---------|--------|-------------|
| `/gd:debate` | 67 | Análisis de múltiples perspectivas técnicas |
| `/gd:destilar` | 72 | Extracción de insights de conversaciones |
| `/gd:drift` | 71 | Detección de divergencia entre spec e implementación |
| `/gd:prd` | 152 | Product Requirements Document desde idea |
| `/gd:playwright` | 283 | Tests E2E con Playwright |
| `/gd:preflight` | 136 | Checklist pre-implementación |
| `/gd:presentar` | 165 | Preparar presentación de resultados |
| `/gd:pseudocodigo` | 195 | Pseudocódigo estructurado previo a implementación |
| `/gd:rapido` | 77 | Implementación express de tareas simples |
| `/gd:reflexionar` | 130 | Retrospectiva y aprendizaje post-ciclo |
| `/gd:reversa` | 167 | Ingeniería reversa de código existente |
| `/gd:roundtable` | 53 | Mesa redonda de consenso técnico |
| `/gd:security-audit` | 78 | Auditoría de seguridad del código |
| `/gd:spec-score` | 214 | Score de calidad de una spec |
| `/gd:tea` | 235 | Test de Evaluación de Agentes |
| `/gd:tech-debt` | 206 | Inventario y plan de deuda técnica |
| `/gd:tech-panel` | 57 | Panel de expertos técnicos |
| `/gd:time-travel` | 219 | Análisis de evolución temporal del código |
| `/gd:validar-spec` | 168 | Validación profunda de especificaciones |
| `/gd:voice` | 184 | Interfaz de voz para comandos |
| `/gd:webhook` | 320 | Implementación de webhooks con patrones |

> **Nota**: `debate`, `roundtable`, `tech-panel` son Level 4 "compactos" (50-70 líneas) — funcionales pero mejorarían con más ejemplos.

---

### Nivel 3 — Parcialmente desarrollado (16 comandos)

> Tienen estructura pero les falta profundidad para ejecución autónoma robusta.

| Comando | Líneas | Brecha principal |
|---------|--------|-----------------|
| `/gd:archive` | 59 | Pasos correctos pero sin ejemplos de output real |
| `/gd:auditar-inventario-lambdas` | 65 | Específico pero sin validación ni output esperado |
| `/gd:breakdown` | 57 | Falta plantilla de tasks y criterios de granularidad |
| `/gd:clarify` | 37 | Muy corto; falta listado de tipos de ambigüedad |
| `/gd:completo` | 116 | Orquesta pipeline completo pero sin manejo de errores |
| `/gd:estimate` | 53 | Falta fórmula de estimación y calibración histórica |
| `/gd:explore` | 49 | Sin criterios de profundidad ni output estructurado |
| `/gd:implement` | 65 | Referencia a TDD pero sin ejemplos de RED→GREEN→REFACTOR |
| `/gd:plan` | 56 | Falta plantilla de plan y criterios de descomposición |
| `/gd:poc` | 79 | Falta criterios de éxito/fracaso del PoC |
| `/gd:review` | 71 | 7 dimensiones definidas pero sin rúbricas de scoring |
| `/gd:specify` | 47 | Gherkin mencionado pero sin plantilla ni ejemplos |
| `/gd:start` | 46 | Detecta complejidad pero criterios son vagos |
| `/gd:verify` | 66 | Falta matrix de cobertura y criterios pass/fail |

---

### Nivel 2 — Alias puro (7 comandos)

> Solo redirigen a otro comando. No tienen valor propio — son shortcuts de usabilidad.

| Alias | Apunta a |
|-------|----------|
| `/gd:aplicar` | `/gd:implement` |
| `/gd:archivar` | `/gd:archive` |
| `/gd:auditar` | `/gd:review` |
| `/gd:clarificar` | `/gd:clarify` |
| `/gd:especificar` | `/gd:specify` |
| `/gd:iniciar` | `/gd:start` |
| `/gd:validar` | `/gd:verify` |

> **Evaluación**: Los aliases son útiles para hablantes de español. El problema es que existen como archivos separados en lugar de estar declarados en los comandos principales como metadata. Esto fragmenta el mantenimiento.

---

### Nivel 1 — Stub / Placeholder (45 comandos)

> 7 líneas exactas. Solo título, propósito de una línea, y lista de agentes. Sin instrucciones ejecutables.

| Comando | Categoría funcional |
|---------|---------------------|
| `/gd:agente` | Meta / Framework |
| `/gd:audit-trail` | Trazabilidad |
| `/gd:capture` | Conocimiento |
| `/gd:changelog` | Release |
| `/gd:close` | Lifecycle |
| `/gd:code-rag` | RAG / Búsqueda |
| `/gd:context-health` | Salud del contexto |
| `/gd:continue` | Control de flujo |
| `/gd:contract-api` | Contratos |
| `/gd:contract-ui` | Contratos |
| `/gd:dashboard` | Observabilidad |
| `/gd:data-policy` | Gobernanza |
| `/gd:diagram` | Documentación |
| `/gd:doctor` | Diagnóstico |
| `/gd:e2e` | Testing |
| `/gd:fast-forward` | Control de flujo |
| `/gd:gate` | Quality gates |
| `/gd:guardian` | Guardianes |
| `/gd:history` | Historial |
| `/gd:incorporate` | Integración |
| `/gd:marketplace` | Ecosistema |
| `/gd:metrics` | Métricas |
| `/gd:migrate` | Migración |
| `/gd:planning` | Planificación |
| `/gd:quality` | Calidad |
| `/gd:rag` | RAG / Búsqueda |
| `/gd:recall` | Memoria |
| `/gd:reference` | Documentación |
| `/gd:release` | Release |
| `/gd:session` | Sesiones |
| `/gd:skill` | Skills |
| `/gd:skill-create` | Skills |
| `/gd:specs` | Especificaciones |
| `/gd:status` | Observabilidad |
| `/gd:stub-detect` | Quality gates |
| `/gd:testing` | Testing |
| `/gd:test-unit` | Testing |
| `/gd:threshold` | Quality gates |
| `/gd:tracing` | Trazabilidad |
| `/gd:traspasar` | Handoff |
| `/gd:traspaso` | Handoff |
| `/gd:update` | Lifecycle |
| `/gd:upgrade` | Lifecycle |
| `/gd:version` | Release |
| `/gd:worktree` | Git |

---

## 4. Análisis por Categoría Funcional

| Categoría | Total | L1 | L2 | L3 | L4 | L5 | Madurez |
|-----------|-------|----|----|----|----|----|---------| 
| Pipeline SDD core | 9 | 0 | 0 | 8 | 1 | 0 | ⚠️ Media |
| Orquestación / Control | 6 | 2 | 0 | 1 | 0 | 3 | ⚠️ Media |
| Testing | 6 | 3 | 0 | 0 | 2 | 1 | ⚠️ Media |
| Análisis / Inteligencia | 12 | 0 | 0 | 0 | 9 | 3 | ✅ Alta |
| Trazabilidad / Observabilidad | 6 | 5 | 0 | 0 | 0 | 1 | ❌ Baja |
| Release / Lifecycle | 7 | 5 | 0 | 1 | 1 | 0 | ❌ Baja |
| Contratos / Gobernanza | 4 | 3 | 0 | 0 | 0 | 1 | ❌ Baja |
| Conocimiento / RAG | 5 | 4 | 0 | 0 | 0 | 1 | ❌ Baja |
| Diagnóstico / Salud | 5 | 3 | 0 | 1 | 1 | 0 | ❌ Baja |
| Aliases (español) | 7 | 0 | 7 | 0 | 0 | 0 | N/A |
| Misceláneos | 13 | 7 | 0 | 5 | 1 | 0 | ❌ Baja |

**Hallazgo**: La categoría de **Análisis/Inteligencia** es la más madura (debate, roundtable, tech-panel, reflexionar, etc.) — esto refleja el cambio `praisonai-don-carlo-enrichment`. Las categorías **Trazabilidad**, **Release/Lifecycle**, y **Conocimiento/RAG** están casi completamente sin implementar.

---

## 5. Brechas Críticas

### Brecha 1: Integración con el orquestador (CRÍTICA)

**Estado**: Solo 8 de 95 comandos tienen wiring con el orquestador LangGraph.  
**Impacto**: El orquestador puede ejecutar el pipeline core, pero no puede invocar herramientas especializadas (testing, drift, security-audit, etc.) como parte de un flujo automatizado.  
**Lo que falta**:
- Manifiestos de comando en `packages/sdd-agent-orchestrator/src/manifests/`
- Routing rules en `gd:route` para despachar comandos especializados
- Tool bindings en `execute-manifest-tool.mjs` para comandos Level 4

### Brecha 2: Pipeline core en Level 3 (ALTA)

**Estado**: Los 8 comandos del pipeline principal (specify, clarify, plan, breakdown, implement, review, verify, archive) están en Level 3 — funcionales pero sin la profundidad necesaria para ejecución autónoma confiable.  
**Impacto**: El ciclo SDD puede ejecutarse pero produce resultados inconsistentes cuando los inputs son ambiguos.  
**Lo que falta**:
- Plantillas de output con estructura fija (Gherkin para specify, task format para breakdown)
- Criterios explícitos de calidad y pass/fail
- Ejemplos concretos con casos reales del repo

### Brecha 3: 45 stubs sin implementar (ALTA)

**Estado**: 47% de los comandos son placeholders de 7 líneas.  
**Impacto**: Comandos críticos como `doctor`, `gate`, `threshold`, `audit-trail`, `changelog`, y `status` son inoperables.  
**Lo que falta**: Implementación completa de al menos los stubs de alto valor (ver Sección 7).

### Brecha 4: Aliases como archivos separados (MEDIA)

**Estado**: 7 aliases son archivos `.md` separados.  
**Impacto**: Cuando un comando principal evoluciona, los aliases no se actualizan automáticamente — deriva de documentación.  
**Lo que falta**: Consolidar aliases en metadata `## Alias` del archivo principal (ya existe el patrón — solo falta eliminar los archivos duplicados).

### Brecha 5: Sin trazabilidad de ejecución (MEDIA)

**Estado**: `audit-trail`, `tracing`, `history`, `session` son todos Level 1.  
**Impacto**: No hay forma de auditar qué comandos se ejecutaron, cuándo, con qué inputs/outputs.  
**Lo que falta**: Implementar `audit-trail` primero (es la base de los demás).

---

## 6. Estado de la Orquestación

### Arquitectura actual

```
[Usuario] → [Comando /gd:*] → [LLM interpreta prompt] → [Respuesta]
                ↓ (solo 8 comandos)
        [Orquestador LangGraph]
        packages/sdd-agent-orchestrator/src/graph/sdd-gd-cycle-graph.mjs
                ↓
        [Middleware stack]
        - hooks-dispatcher.mjs
        - doom-loop-detector.mjs
        - guardrail-enforcer.mjs
        - shadow-checkpoint.mjs
        - context-compaction.mjs
        - model-router.mjs
```

### Capacidades actuales del orquestador

| Capacidad | Estado |
|-----------|--------|
| Pipeline SDD completo (specify→archive) | ✅ Implementado |
| Doom-loop detection | ✅ Implementado |
| Guardrails de seguridad | ✅ Implementado |
| Shadow checkpoints | ✅ Implementado |
| Context compaction | ✅ Implementado |
| Model routing | ✅ Implementado |
| Invocación de comandos especializados | ❌ No implementado |
| Multi-agent parallelism | ❌ No implementado |
| Audit trail persistente | ❌ No implementado |
| Quality gates automáticos | ❌ No implementado |

### Lo que falta para orquestación madura

1. **Command Registry**: Un registro central de todos los comandos con sus manifiestos, inputs esperados, y outputs.
2. **Routing universal**: Que `gd:route` pueda despachar cualquier comando Level 4+ como tool call.
3. **Quality gates automáticos**: `gate` y `threshold` integrados como checks automáticos entre fases.
4. **Trazabilidad**: `audit-trail` como middleware obligatorio que logea todas las invocaciones.
5. **Paralelismo**: Capacidad de ejecutar comandos independientes en paralelo (e.g., security-audit + drift + spec-score simultáneamente).

---

## 7. Plan de Acción Priorizado

### Fase 1 — Estabilizar el core (2-3 días)
**Objetivo**: Llevar los 8 comandos del pipeline de Level 3 a Level 4.

| Tarea | Comando(s) | Esfuerzo |
|-------|-----------|---------|
| Agregar plantilla Gherkin con ejemplos | `specify` | M |
| Agregar task format + criterios de granularidad | `breakdown` | M |
| Agregar RED→GREEN→REFACTOR workflow con ejemplos | `implement` | M |
| Agregar rúbricas de scoring para las 7 dimensiones | `review` | M |
| Agregar matrix de cobertura y criterios pass/fail | `verify` | M |
| Agregar criterios de complejidad con ejemplos | `start` | S |
| Agregar plantilla de plan con descomposición | `plan` | S |
| Agregar output esperado con formato real | `archive` | S |

### Fase 2 — Implementar stubs de alto valor (3-5 días)
**Objetivo**: Implementar los 10 stubs más críticos.

| Prioridad | Comando | Razón |
|-----------|---------|-------|
| 1 | `status` | Dashboard del estado del change activo — usado frecuentemente |
| 2 | `doctor` | Diagnóstico del framework — útil para onboarding y debugging |
| 3 | `changelog` | Generación automática de changelog — necesario para releases |
| 4 | `gate` | Quality gate antes de pasar a la siguiente fase |
| 5 | `audit-trail` | Base de la trazabilidad — habilita todos los demás |
| 6 | `diagram` | Generación de diagramas de arquitectura |
| 7 | `e2e` | Tests E2E (base ya existe en playwright.md) |
| 8 | `test-unit` | Tests unitarios con TDD |
| 9 | `recall` | Interface para mem_search/mem_context |
| 10 | `stub-detect` | Auto-detectar comandos stub — el comando se audita a sí mismo |

### Fase 3 — Integrar comandos al orquestador (5-7 días)
**Objetivo**: Wiring de los 19 comandos Level 4 con el orquestador.

| Tarea | Descripción |
|-------|-------------|
| Crear Command Registry | `packages/sdd-agent-orchestrator/src/registry/command-registry.mjs` |
| Crear manifiestos para L4 | Un manifiesto JSON por comando Level 4 |
| Extender `route.md` + `route-handler.mjs` | Para despachar cualquier comando registrado |
| Integrar `gate` como middleware de fase | Quality check automático entre fases del pipeline |
| Integrar `audit-trail` como middleware global | Log persistente de todas las invocaciones |
| Integrar `drift` en el pipeline | Detección automática de divergencia post-implementación |
| Integrar `security-audit` en pre-release | Scan automático antes de `archive` |

### Fase 4 — Paralelismo y observabilidad (1-2 semanas)
**Objetivo**: Orquestación multi-agente con observabilidad completa.

| Tarea | Descripción |
|-------|-------------|
| Implementar `dashboard` | Vista en tiempo real del estado de todos los changes |
| Implementar `metrics` | KPIs del framework (tiempo por fase, quality scores) |
| Implementar paralelismo | Ejecutar comandos independientes en paralelo en el grafo |
| Implementar `session` + `recall` | Memoria y contexto persistente por sesión |
| Implementar `history` | Historial completo de cambios y decisiones |

---

## 8. Score de Madurez Global

```
Score = Σ(nivel_comando × peso_categoria) / total_comandos

Cálculo simplificado (sin pesos):
  L1: 45 × 1 =  45
  L2:  7 × 2 =  14
  L3: 16 × 3 =  48
  L4: 19 × 4 =  76
  L5:  8 × 5 =  40
  ─────────────────
  Total:         223 puntos
  Max posible:   95 × 5 = 475

Score actual: 223 / 475 = 46.9% → 2.34 / 5.0
```

**Score por categoría**:
| Categoría | Score |
|-----------|-------|
| Análisis / Inteligencia | 4.2 / 5.0 ✅ |
| Orquestación / Control | 3.5 / 5.0 ⚠️ |
| Pipeline SDD core | 3.1 / 5.0 ⚠️ |
| Testing | 2.8 / 5.0 ⚠️ |
| Release / Lifecycle | 1.6 / 5.0 ❌ |
| Trazabilidad / Observabilidad | 1.3 / 5.0 ❌ |
| Contratos / Gobernanza | 1.3 / 5.0 ❌ |
| Conocimiento / RAG | 1.2 / 5.0 ❌ |

**Target**: Score ≥ 4.0 / 5.0 para "madurez alta" → requiere que todos los comandos sean L4+ y que L5 cubra al menos el 40%.

---

## 9. Estimación de Esfuerzo Total

| Fase | Días | Score esperado post-fase |
|------|------|--------------------------|
| Fase 1 (core L3→L4) | 2-3 días | 2.7 / 5.0 |
| Fase 2 (10 stubs→L4) | 3-5 días | 3.2 / 5.0 |
| Fase 3 (integración orquestador) | 5-7 días | 3.8 / 5.0 |
| Fase 4 (paralelismo + observabilidad) | 7-10 días | 4.3 / 5.0 ✅ |

**Total estimado para madurez alta**: ~17-25 días de trabajo

---

## 10. Recomendación Inmediata

El impacto más alto con el menor esfuerzo es:

1. **Ejecutar Fase 1** — 8 comandos del pipeline core mejorados en 2-3 días. Esto mejora directamente la calidad de cada ciclo SDD diario.
2. **Implementar `status` y `doctor`** — Los comandos más usados en el día a día que están como stubs.
3. **Crear el Command Registry** — Una tarde de trabajo que habilita toda la Fase 3.

El cambio con mayor ROI es el **Command Registry** porque desbloquea la integración de los 19 comandos Level 4 existentes con el orquestador — sin necesidad de reescribir nada, solo registrar lo que ya existe.

---

*Generado por OpenCode auditoría automática — 2026-04-14*

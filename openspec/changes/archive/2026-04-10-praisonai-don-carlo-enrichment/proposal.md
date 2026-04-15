# Proposal: PraisonAI → Don Carlo (/gd:*) Enrichment

## Intent

Don Carlo tiene 101 comandos `/gd:*` con pipeline SDD completo pero carece de capacidades clave de orchestración autónoma que PraisonAI ha madurado: flujos declarativos multi-agente, validación de outputs por fase, detección de ciclos atascados, checkpoints de rollback automático y evaluación objetiva de calidad. Incorporar estos patrones posiciona a Don Carlo como un sistema SDD verdaderamente autónomo ("CERO DESARROLLADORES") capaz de operar sin supervisión humana constante.

## Scope

### In Scope
- **8 nuevos comandos `/gd:*`**: `/gd:flow`, `/gd:guardrail`, `/gd:eval`, `/gd:checkpoint`, `/gd:doom-shield`, `/gd:research`, `/gd:route`, `/gd:policy`
- **6 mejoras al orquestador LangGraph** (`packages/sdd-agent-orchestrator/`): hooks lifecycle, guardrails por nodo, doom-loop detection, shadow git checkpoints, context compaction, model router
- Actualización de `COMMANDS-INDEX.md` y `.agents-core/` con documentación de los nuevos comandos
- Artefactos OpenSpec: proposal + design + spec + tasks

### Out of Scope
- Reescribir el orquestador en Python (cambio de stack injustificado)
- Integrar el SDK `praisonaiagents` directamente (dependencia Python innecesaria)
- Multi-modal (imagen/video/audio) — fuera del dominio SDD
- UI Chainlit/Gradio — Don Carlo es CLI/IDE-first

## Approach

**Estrategia B + D** (sin cambiar stack):

- **B — Nuevos comandos como prompts enriquecidos**: cada comando `/gd:*` nuevo es un archivo `.claude/commands/gd/[nombre].md` con instrucciones inspiradas en los patrones de PraisonAI
- **D — Orquestador LangGraph ampliado**: añadir hooks, guardrails, doom-loop detection y shadow checkpoints como nodos/middleware nativos en Node.js dentro de `packages/sdd-agent-orchestrator/src/`

El desarrollo será en **dos fases paralelas**: comandos (prompts) + orquestador (código).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.claude/commands/gd/` | New (×8) | 8 nuevos archivos de comandos |
| `packages/sdd-agent-orchestrator/src/` | Modified | Hooks, guardrails, doom-loop, compaction, model router |
| `COMMANDS-INDEX.md` | Modified | Agregar los 8 nuevos comandos |
| `docs/COMANDOS-GD-CREADOS.md` | Modified | Documentar la nueva versión |
| `.agents-core/` (si existe) | Modified | Nuevo módulo `praison-patterns.md` |
| `openspec/tools-manifest.yaml` | Modified | Registrar herramientas nuevas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scope creep (PraisonAI tiene 200+ features) | Alta | Implementar estrictamente TIER 1 primero; TIER 2 en iteración separada |
| Duplicación con comandos existentes | Media | Auditar cada nuevo comando vs los 101 existentes antes de crear |
| Breaking changes en el orquestador | Baja | Todos los cambios como middleware opcional; backward compatible |
| Overhead de mantenimiento de 8 comandos nuevos | Media | Seguir el patrón de documentación existente; reutilizar estructura |

## Rollback Plan

- Los 8 comandos nuevos son archivos independientes: eliminar el archivo revierte el cambio
- Las mejoras al orquestador se implementan como módulos opcionales: deshabilitar vía `SDD_FEATURES` env var
- Ningún comando existente se modifica; solo se agregan nuevos

## Dependencies

- `packages/sdd-agent-orchestrator/` debe estar instalado y funcionando (`npm run orchestrator:test` en verde)
- Los 101 comandos `/gd:*` existentes como referencia de patrón y estilo
- Exploración completada: `openspec/changes/praisonai-don-carlo-enrichment/exploration.md`

## Success Criteria

- [ ] Los 8 nuevos comandos `/gd:*` están creados y siguen el patrón de estilo de los existentes
- [ ] `/gd:flow` permite definir y ejecutar un pipeline multi-fase en YAML declarativo
- [ ] `/gd:guardrail` valida output de cualquier fase antes de continuar
- [ ] `/gd:checkpoint` crea un snapshot git automático antes de fases destructivas
- [ ] `/gd:doom-shield` detecta y corta ciclos en el orquestador (contador + circuit breaker)
- [ ] El orquestador LangGraph soporta hooks `on_phase_start` / `on_phase_error` / `on_phase_complete`
- [ ] `COMMANDS-INDEX.md` actualizado con los 8 nuevos comandos
- [ ] `npm run orchestrator:test` sigue en verde después de las mejoras

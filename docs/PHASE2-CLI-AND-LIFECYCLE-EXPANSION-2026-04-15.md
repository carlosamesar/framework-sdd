# Fase 2 — Expansión CLI y lifecycle gd

**Fecha:** 2026-04-15  
**Estado:** verificado

---

## Resultado

La expansión de Fase 2 quedó operativa también desde el CLI principal del framework.

## Mejoras verificadas

- `list-tools` ahora expone el catálogo endurecido de comandos gd
- el CLI ejecuta correctamente:
  - doctor
  - gate
  - status
  - audit-trail
  - threshold
  - review
  - verify
  - close
  - release
  - changelog
  - metrics
  - session
  - archive

## Evidencia comprobada

- pruebas CLI de Fase 2: **3/3 OK**
- pruebas lifecycle expansion: **5/5 OK**
- `framework:test`: **OK**
- `token:check`: **PASS**

## Impacto agentic

Esto acerca el framework a un modelo más agentic porque:

1. los comandos ya son más ejecutables;
2. devuelven estructura reutilizable por agentes;
3. el flujo puede operar con evidencia, gating y diagnóstico desde el entrypoint del framework.

## Archivos clave

- [bin/sdd-agent.cjs](bin/sdd-agent.cjs)
- [packages/sdd-agent-orchestrator/src/gdCommandRunner.cjs](packages/sdd-agent-orchestrator/src/gdCommandRunner.cjs)
- [packages/sdd-agent-orchestrator/src/__tests__/cli-phase2.test.js](packages/sdd-agent-orchestrator/src/__tests__/cli-phase2.test.js)
- [packages/sdd-agent-orchestrator/src/__tests__/gdCommandRunner-phase2b.test.js](packages/sdd-agent-orchestrator/src/__tests__/gdCommandRunner-phase2b.test.js)

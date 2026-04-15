# Propuesta — Orquestación agente LangGraph (fábrica cero dev)

## Intención

Evolutionar Framework-SDD hacia una **orquestación explícita de agentes** con **LangGraph.js**, de modo que un runtime Node pueda:

1. Sustituir o complementar la interacción manual con **`/gd:start`** y el resto de comandos SDD.
2. Reutilizar **toda** la implementación existente (OpenSpec, manifiesto, `react-runner`, `npx framework-sdd`, sandbox de rutas, RAG opcional).
3. Encajar en la visión de fábrica de software **“CERO DESARROLLADORES”** (humano como aprobador, no como ejecutor de gates mecánicos).

## Alcance inicial (hecho / en curso)

- Paquete versionado: `packages/sdd-agent-orchestrator/` (LangGraph + demo de grafo + invocación a `validate-spec.mjs`).
- Diseño: `packages/sdd-agent-orchestrator/design/ARQUITECTURA-CERO-DEV-LANGRAPH.md`.

## Fuera de alcance (esta iteración)

- Sustituir los archivos `.claude/commands/gd/*.md` por un solo binario publicado.
- Motor LLM configurado en producción y checkpointer persistente.

## Criterios de éxito

- `npm run graph:demo` en el paquete orquestador termina con exit 0 contra el repo Framework-SDD.
- Documento de arquitectura enlazado desde README raíz o índice de documentación.

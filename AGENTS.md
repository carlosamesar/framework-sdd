# AGENTS.md

Documento maestro del framework. No debe cargarse completo por defecto.

## Objetivo

Centralizar reglas compartidas para Claude, Copilot, OpenCode y Qwen sin inflar el contexto base.

## Reglas compartidas

1. `tenantId` siempre desde JWT `custom:tenant_id`.
2. TDD obligatorio: RED -> GREEN -> REFACTOR.
3. Reutilizar patrones maduros antes de inventar estructuras nuevas.
4. En lambdas, usar `ResponseBuilder` y manejo consistente de errores.
5. Consultar memoria, RAG o docs antes de asumir historial.

## Politica de carga

- Archivo base por herramienta: `CLAUDE.md`, `.github/copilot-instructions.md`, `OPENCODE.md`, `QWEN.md`.
- Catalogo de comandos: `COMMANDS-INDEX.md`.
- Catalogo de patrones: `PATTERNS-CACHE.md`.
- Modulos on-demand: `.agents-core/*.md`.
- Estrategia de ahorro: `docs/TOKEN-OPTIMIZATION-STRATEGY.md`.

## Cuando cargar modulos

- Auth o multitenancy: `.agents-core/multi-tenant.md`
- Lambda o API Gateway: `.agents-core/lambdas-pattern.md`
- NestJS: `.agents-core/nestjs-pattern.md`
- Tests o gates: `.agents-core/testing-rules.md`
- SAGA: `.agents-core/saga-pattern.md`
- Frontend Angular (formularios, shell, facade): skill `gd-frontend` via `/gd:frontend`, estricto con anclas `/treasury/inflows/new` y `/purchases/orders/new`

## Regla operativa

Mantener el contexto base pequeno. Cargar un solo modulo adicional por tarea, salvo que la tarea mezcle dominios.
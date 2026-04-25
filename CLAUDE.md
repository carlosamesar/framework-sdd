# CLAUDE.md

Contexto base ultra-liviano para Claude.

## Reglas minimas

1. `tenantId` desde JWT, nunca desde input del cliente.
2. TDD obligatorio.
3. Copiar patrones maduros antes de inventar.
4. ResponseBuilder para lambdas.
5. Consultar memoria o RAG antes de asumir contexto previo.

## Carga por demanda

- Comandos `/gd:*`: `COMMANDS-INDEX.md`
- Snippets y rutas: `PATTERNS-CACHE.md`
- Auth: `.agents-core/multi-tenant.md`
- Lambda: `.agents-core/lambdas-pattern.md`
- NestJS: `.agents-core/nestjs-pattern.md`
- Tests: `.agents-core/testing-rules.md`
- SAGA: `.agents-core/saga-pattern.md`

## Regla de ahorro

No cargar `AGENTS.md` completo ni todos los comandos. Empezar con este archivo y sumar solo un modulo cuando haga falta.

## Referencia

Estrategia completa: `docs/TOKEN-OPTIMIZATION-STRATEGY.md`
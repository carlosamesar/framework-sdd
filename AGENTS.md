# AGENTS.md — Ultra-Light

SDD estricto con contexto mínimo.

## Reglas
1. TDD.
2. `tenantId` solo desde JWT.
3. Copiar patrones maduros.
4. Lambdas con ResponseBuilder + métodos completos + CORS.
5. No cerrar sin evidencia.
6. Trabajar en `fix/*` + PR.

## Flujo
`/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive`

## Carga
- base: este archivo + archivo del agente
- un módulo de `.agents-core/`
- `COMMANDS-INDEX.md` solo si hay `gd:*`
- `PATTERNS-CACHE.md` para snippets
- RAG solo para dudas puntuales

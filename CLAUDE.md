# CLAUDE.md — Ultra-Light

Contexto mínimo. Evidencia máxima.

## Carga
1. este archivo
2. `AGENTS.md`
3. un módulo de `.agents-core/`
4. `COMMANDS-INDEX.md` solo si hay `gd:*`
5. `PATTERNS-CACHE.md` para snippets

## Reglas
- `/gd:start` si falta contexto
- TDD: RED → GREEN → REFACTOR
- `tenantId` solo desde JWT
- copiar patrones maduros del repo
- Lambdas: ResponseBuilder + GET/POST/PUT/DELETE/OPTIONS + CORS
- no declarar éxito sin verificación

## Cierre
No omitir `/gd:review`, `/gd:verify` y `/gd:close`.
Usar RAG antes de abrir documentación extensa.

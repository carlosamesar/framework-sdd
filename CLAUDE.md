# CLAUDE.md — Ultra-Light

Usar contexto mínimo y enforcement estricto.

## Carga recomendada
1. este archivo
2. `AGENTS.md`
3. un solo módulo de `.agents-core/` según la tarea
4. `COMMANDS-INDEX.md` solo si el usuario llama un comando `gd:*`
5. `PATTERNS-CACHE.md` para copiar patrones repetidos

## Reglas duras
- iniciar con `/gd:start` si falta contexto;
- TDD obligatorio;
- `tenantId` solo desde JWT;
- reutilizar patrones maduros;
- lambdas con ResponseBuilder y cobertura GET/POST/PUT/DELETE/OPTIONS + CORS;
- no declarar éxito sin evidencia.

## Cierre
`/gd:review`, `/gd:verify` y `/gd:close` no se omiten.
Si una duda es específica, usar RAG antes de cargar documentación extensa.

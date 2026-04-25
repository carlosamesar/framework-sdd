# QWEN.md

Contexto base ultra-liviano para Qwen.

## Reglas minimas

1. Multi-tenant: `tenantId` solo desde JWT.
2. TDD: RED -> GREEN -> REFACTOR.
3. Reusar patrones maduros de Lambda y NestJS.
4. En lambdas, usar ResponseBuilder.
5. Pedir mas contexto solo cuando sea necesario.

## Carga por demanda

- `COMMANDS-INDEX.md` para `/gd:*`
- `PATTERNS-CACHE.md` para snippets y rutas
- `.agents-core/multi-tenant.md`
- `.agents-core/lambdas-pattern.md`
- `.agents-core/nestjs-pattern.md`
- `.agents-core/testing-rules.md`
- `.agents-core/saga-pattern.md`

## Objetivo

Mantener el prompt base pequeno y derivar a un solo modulo adicional por tarea.
# Copilot Instructions

Base minima para este repositorio.

## Reglas obligatorias

1. `tenantId` siempre desde JWT `custom:tenant_id`.
2. Seguir TDD: RED -> GREEN -> REFACTOR.
3. Reusar patrones maduros antes de crear otros.
4. En lambdas, usar `ResponseBuilder`.
5. Mantener el contexto pequeno y cargar solo una referencia extra cuando sea necesario.

## Carga por demanda

- `/gd:*`: `COMMANDS-INDEX.md`
- Snippets: `PATTERNS-CACHE.md`
- Auth: `.agents-core/multi-tenant.md`
- Lambdas: `.agents-core/lambdas-pattern.md`
- NestJS: `.agents-core/nestjs-pattern.md`
- Tests: `.agents-core/testing-rules.md`
- SAGA: `.agents-core/saga-pattern.md`

## Recordatorio

No cargar `AGENTS.md` completo por defecto. Usarlo solo como referencia puntual.
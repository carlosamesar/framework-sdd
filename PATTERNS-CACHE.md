# PATTERNS-CACHE.md

Cache minima de patrones maduros. Referenciar, no reexplicar.

| Patron | Archivo real | Uso |
|---|---|---|
| extractTenantId | `lib/lambda/transacciones/fnTransaccionLineas/utils/sanitization.mjs` | obtener tenant del JWT |
| ResponseBuilder | `lib/lambda/transacciones/fnTransaccionLineas/utils/responseBuilder.mjs` | respuestas HTTP estandar |
| Router lastSegment | `lib/lambda/transacciones/fnTransaccion/index.mjs` | resolver recurso por segmento final |
| JwtTenantGuard | `servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` | enforcement multitenant NestJS |
| Controller MT | `servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts` | controlador con tenant y DTOs |
| Entity TypeORM | `servicio-tesoreria/src/tesoreria/entities/caja.entity.ts` | entidad con columnas maduras |
| QueryRunner TX | `servicio-tesoreria/src/tesoreria/services/caja.service.ts` | transaccion DB con rollback |

## Regla

Si un patron aplica, copiar la estructura real desde su archivo fuente en vez de inventar una variante nueva.
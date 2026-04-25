# multi-tenant

## Regla central

`tenantId` siempre sale del JWT `custom:tenant_id`. No aceptar `tenantId` desde body, params ni query.

## Aplicar en

- Lambdas con API Gateway
- Controllers NestJS
- Services con filtros por tenant

## Patrones a copiar

- `extractTenantId`
- `JwtTenantGuard`

## Errores a evitar

- confiar en payload del cliente
- mezclar tenant de ruta con tenant del token
- ejecutar consultas sin filtro por tenant
# Multi-tenant core

## Reglas obligatorias
- tenantId sale del JWT claim custom:tenant_id.
- Nunca usar body, params o query para tenant.
- Si la ejecución viene de orquestación interna, aceptar tenant_id ya resuelto por Step Functions.
- Toda consulta SQL o TypeORM debe filtrar por tenant.

## Orden de extracción
1. requestContext.authorizer.claims['custom:tenant_id']
2. claims['custom:tenant_id']
3. tenant_id interno ya validado

## Rechazo
- Si no hay tenant válido, responder 401 o 403.

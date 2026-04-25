# lambdas-pattern

## Base

Usar como referencia madura `fnTransaccionLineas`.

## Reglas

1. Handler pequeno.
2. Validacion y sanitizacion al inicio.
3. `tenantId` desde JWT.
4. `ResponseBuilder` para respuestas.
5. Errores normalizados y logs utiles.

## Patrones a copiar

- `extractTenantId`
- `ResponseBuilder`
- `Router lastSegment`
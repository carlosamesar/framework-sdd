# nestjs-pattern

## Base

Usar `servicio-tesoreria` como referencia madura.

## Reglas

1. Guard o interceptor para tenant.
2. DTOs y validacion explicita.
3. Service sin logica HTTP.
4. Transaction handling con `QueryRunner` cuando aplique.
5. Reusar entidades y estructuras existentes antes de crear nuevas.

## Patrones a copiar

- `JwtTenantGuard`
- `Controller MT`
- `Entity TypeORM`
- `QueryRunner TX`
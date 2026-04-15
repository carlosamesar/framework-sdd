# NestJS pattern core

## Estructura
- controller -> dto -> service -> entity/repository
- JwtTenantGuard global o por controlador
- decorator @TenantId() para extraer tenant del JWT

## Reglas
- lógica en services, no en controllers
- DTOs explícitos y validación estricta
- transacciones con QueryRunner cuando aplique
- seguir patrón de servicio-tesoreria

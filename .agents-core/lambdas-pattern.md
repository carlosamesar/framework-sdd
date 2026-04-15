# Lambda pattern core

## Estructura
- index.mjs: router por método y recurso
- utils/sanitization.mjs: tenant, validaciones
- utils/responseBuilder.mjs: respuestas estándar
- utils/database.mjs: pool singleton

## HTTP obligatorio
- Implementar GET, POST, PUT, DELETE y OPTIONS
- CORS consistente en código y API Gateway
- 405 para métodos no soportados

## Regla de implementación
- Copiar patrón espejo de fnTransaccionLineas
- No inventar estructura paralela
- Validar input antes de tocar BD

# Especificación: Migración de id_estado a UUID

## Contexto
El orquestador de transacciones (`fnOrquestadorTransaccionUnificada`) está fallando al intentar realizar cambios de estado porque el campo `id_estado` en algunas tablas relacionadas se está tratando como `SERIAL` (entero) mientras que el orquestador y los nuevos flujos esperan un `UUID`. Esto provoca errores de sintaxis en Postgres: `invalid input syntax for type uuid`.

## Objetivos
1.  **Migración de DB**: Cambiar el tipo de dato de `id_estado` de `SERIAL/INT` a `UUID` en las tablas pertinentes (principalmente `transaccion_estados` y auditoría).
2.  **Validación en Lambda**: Asegurar que los handlers validen el formato UUID antes de enviar queries a la base de datos.
3.  **Estabilización**: Corregir los scripts de utilidad para que operen sobre la base de datos de DigitalOcean.

## Escenarios (Gherkin)

### Escenario 1: Cambio de estado con UUID válido
**Given** una transacción con ID "70653609-e85b-4355-8273-a4f66453986a"
**And** un estado destino con ID "3e36e3c0-3e3c-4e3c-3e3c-3e3c3e3c3e3c"
**When** se solicita el cambio de estado al endpoint `/cambiar-estado`
**Then** la base de datos debe actualizar el estado de la transacción
**And** se debe insertar un registro de auditoría con ambos UUIDs.

### Escenario 2: Intento de cambio de estado con ID entero (Legacy/Error)
**Given** un payload con `idEstado: 8` (entero)
**When** el orquestador recibe la petición
**Then** debe retornar un error `400 Bad Request` indicando que el formato de ID es inválido (debe ser UUID).

## Plan Técnico
1.  **Database**:
    - Verificar esquema actual en DigitalOcean.
    - Script SQL para `ALTER TABLE transaccion_estados ALTER COLUMN id_estado TYPE UUID USING id_estado::uuid` (o recrear columna si es necesario).
2.  **Lambda Code**:
    - Actualizar `handlers/cambiarEstado.mjs` para incluir validación `isUuid(idEstado)`.
    - Ajustar queries en `transactionManager.mjs` si es necesario.
3.  **Verification**:
    - Ejecutar `check-schema-estados.mjs` (corregido).
    - Ejecutar tests unitarios y luego prueba funcional real.


# Proposal: Migración de id_estado a UUID

## Intent
El campo `id_estado` en la tabla `public.estados` (identificada como la tabla `estado` del requerimiento) debe ser un `UUID` en lugar de un `serial4` (integer). Esto permite una mejor integración con el resto del sistema que ya utiliza UUIDs para sus estados y registros, mejorando la escalabilidad y consistencia de los datos.

## Scope

### In Scope
- Creación de columna UUID temporal en `public.estados`.
- Generación de UUIDs únicos para cada registro actual en `public.estados`.
- Actualización de las 27 tablas identificadas que referencian `public.estados.id_estado`.
- Cambio de tipo de dato de `integer` a `uuid` en PK y FKs.
- Re-establecimiento de los constraints de llave foránea.

### Out of Scope
- Migración de datos históricos de auditoría si estos no están en tablas con FK (solo se afectarán FKs explícitas).
- Cambios en el frontend (se asume que el backend manejará la conversión o los UUIDs de forma transparente).

## Approach
Migración in-place utilizando una tabla de mapeo temporal:
1. Crear columna `id_estado_uuid` en `public.estados`.
2. Poblar con `gen_random_uuid()`.
3. Para cada tabla dependiente: agregar columna `id_estado_uuid`, poblarla mediante un JOIN con `public.estados` usando el `id_estado` entero actual, y luego intercambiar las columnas.
4. Convertir `id_estado_uuid` en la nueva PK de `public.estados`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `public.estados` | Modified | PK cambia de `integer` a `uuid`. |
| `public.*` (27 tablas) | Modified | FK `id_estado` cambia de `integer` a `uuid`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pérdida de integridad referencial | Med | Ejecutar todo el script dentro de una sola transacción `BEGIN...COMMIT`. |
| Downtime por bloqueo de tablas | Med | Ejecutar en horario de bajo tráfico; optimizar los updates mediante índices temporales. |

## Rollback Plan
El script de migración debe ser reversible:
1. Mantener las columnas originales (`id_estado_int`) hasta que la migración se valide completamente.
2. Si falla, el rollback manual consistirá en restaurar las FKs apuntando a las columnas enteras originales.

## Dependencies
- Extensión `pgcrypto` o `uuid-ossp` activa en PostgreSQL (se usará `gen_random_uuid()` si es PG 13+).

## Success Criteria
- [ ] La tabla `public.estados` tiene `id_estado` de tipo `uuid`.
- [ ] Las 27 tablas dependientes tienen `id_estado` de tipo `uuid`.
- [ ] Todas las llaves foráneas están activas y validan correctamente.
- [ ] Los registros actuales mantienen su coherencia (el UUID nuevo corresponde al estado que antes tenía el entero).

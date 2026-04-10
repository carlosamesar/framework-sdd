# Evidence: id-estado-uuid-migration

**Change**: `id-estado-uuid-migration`
**Execution Date**: 2026-04-08
**Mode**: Standard (Database migration)

## Summary
Se realizó la migración de la tabla `public.estados` para cambiar su llave primaria `id_estado` de tipo `integer` a `uuid`. Asimismo, se actualizaron todas las 27 tablas que referenciaban esta tabla para mantener la integridad referencial con el nuevo tipo de dato.

## Execution Progress
- [x] 1.1 Crear tabla de mapeo `public.estado_migration_map (id_int integer, id_uuid uuid)`.
- [x] 1.2 Poblar `estado_migration_map` con los IDs de `public.estados` y nuevos UUIDs.
- [x] 1.3 Respaldar constraints de FK de las 27 tablas dependientes.
- [x] 2.1 Desactivar temporalmente los constraints de FK.
- [x] 2.2 Migrar columnas en las 27 tablas de `integer` a `uuid`.
- [x] 2.3 Convertir `public.estados.id_estado` en PK de tipo `uuid`.
- [x] 2.4 Actualizar valores por defecto de `id_estado` a los nuevos UUIDs.
- [x] 3.1 Re-crear constraints de FK apuntando a los nuevos UUIDs.
- [x] 3.2 Verificar integridad referencial post-migración.
- [x] 4.1 Script de validación ejecutado satisfactoriamente.
- [ ] 4.2 Eliminar tabla de mapeo (Pendiente por seguridad de auditoría inmediata).
- [ ] 4.3 Test: Verificar lambdas (Pendiente en entorno real).

## Files Created
- `scripts/migrations/migrate-estados-to-uuid.sql`: Script principal de migración.
- `scripts/migrations/verify-estados-migration.sql`: Script de validación post-migración.

## Post-Migration Check
Se verificó que los registros de `public.estados` conservaran su código y nombre originales pero ahora bajo una PK UUID.
Ejemplo: 'ACTIVO' (antes 1) -> Nuevo UUID.

## Risks & Deviations
Ninguna desviación mayor respecto al diseño. Se ejecutó todo en una única transacción SQL.

# Tasks: Migración de id_estado a UUID

## Phase 1: Preparation & Mapping
- [ ] 1.1 Crear tabla de mapeo `public.estado_migration_map (id_int integer, id_uuid uuid)`.
- [ ] 1.2 Poblar `estado_migration_map` con los IDs de `public.estados` y nuevos UUIDs.
- [ ] 1.3 Respaldar constraints de FK de las 27 tablas dependientes en un script SQL temporal.

## Phase 2: Schema Migration (Transaccional)
- [ ] 2.1 Desactivar temporalmente los constraints de FK que apuntan a `public.estados`.
- [ ] 2.2 En cada una de las 27 tablas: Añadir `id_estado_uuid`, poblar desde mapa, eliminar `id_estado` original, renombrar `id_estado_uuid` a `id_estado`.
- [ ] 2.3 En `public.estados`: Añadir `id_estado_uuid`, poblar desde mapa, eliminar `id_estado` original (PK), convertir `id_estado_uuid` en la nueva PK.
- [ ] 2.4 Actualizar el valor por defecto de `id_estado` en las tablas maestras al nuevo UUID de 'ACTIVO'.

## Phase 3: Constraint Restoration
- [ ] 3.1 Re-crear todos los constraints de FK apuntando a `public.estados(id_estado)` con el nuevo tipo `uuid`.
- [ ] 3.2 Verificar la integridad referencial ejecutando un conteo de registros huérfanos.

## Phase 4: Verification & Cleanup
- [ ] 4.1 Ejecutar script de validación `verify-estados-migration.sql`.
- [ ] 4.2 Eliminar tabla de mapeo temporal `public.estado_migration_map`.
- [ ] 4.3 Test: Verificar que las lambdas pueden consultar estados usando los nuevos UUIDs.

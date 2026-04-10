# Design: Migración de id_estado a UUID

## Technical Approach
Se implementará un script de migración SQL robusto que realice la conversión de `integer` a `uuid` para la PK de `public.estados` y todas sus FKs dependientes. La estrategia es "in-place" con una tabla de mapeo temporal para garantizar que no se pierda la integridad de los datos.

## Architecture Decisions

### Decision: Estrategia de Migración de Tipos
**Choice**: Usar columnas temporales y mapeo mediante JOIN.
**Alternatives considered**: `ALTER TABLE ... TYPE uuid USING ...` directo.
**Rationale**: No se puede convertir un `integer` a `UUID` directamente sin una lógica de mapeo clara. Al crear una columna temporal, podemos asegurar que cada entero `1, 2, 3...` se asocie correctamente con su nuevo UUID generado.

### Decision: Generación de UUIDs
**Choice**: `gen_random_uuid()` (PostgreSQL 13+).
**Alternatives considered**: Generar UUIDs desde Node.js.
**Rationale**: Ejecutarlo directamente en la base de datos es más rápido y garantiza consistencia atómica dentro de la misma transacción SQL.

## Data Flow
1. Crear tabla temporal de mapeo `public.estado_migration_map` (id_int, id_uuid).
2. Poblar mapa con todos los `id_estado` actuales.
3. Desactivar FKs en las 27 tablas dependientes.
4. Para cada tabla:
   - Añadir `id_estado_uuid`.
   - Update `SET id_estado_uuid = map.id_uuid FROM map WHERE id_estado = map.id_int`.
   - Eliminar `id_estado` original.
   - Renombrar `id_estado_uuid` a `id_estado`.
5. Repetir para la tabla maestra `public.estados`.
6. Reactivar FKs apuntando a los nuevos UUIDs.

## File Changes
| File | Action | Description |
|------|--------|-------------|
| `scripts/migrations/migrate-estados-to-uuid.sql` | Create | Script SQL con la lógica de migración. |
| `scripts/migrations/verify-estados-migration.sql` | Create | Script de verificación post-migración. |

## Testing Strategy
| Layer | What to Test | Approach |
|-------|-------------|----------|
| Database | Integridad referencial | Verificar que no existan huérfanos tras la migración. |
| Database | Tipos de datos | Confirmar que todas las columnas son `uuid`. |
| API | Consultas de estado | Verificar que las lambdas/servicios sigan funcionando al enviar UUIDs. |

## Migration / Rollout
- La migración se realizará en una ventana de mantenimiento.
- Se tomará un backup completo del esquema `public` antes de iniciar.
- Se ejecutará en un entorno de staging idéntico antes de producción.

## Open Questions
- [ ] ¿Hay algún código en las Lambdas que asuma que el `id_estado` es un entero (ej: `parseInt`, comparaciones con números)?
- [ ] ¿Es necesario mantener los IDs enteros como una columna `old_id` temporalmente para auditoría? (Decisión inicial: No, a menos que se solicite).

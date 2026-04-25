# Proposal: Bodega — Campos tipo_bodega y responsables

## Intent

Agregar dos campos nuevos a `public.bodegas`: un ENUM `tipo_bodega` ('Virtual'|'Fisica') y un JSONB `responsables` con lista de usuarios responsables (UUID + flag principal). Esto permite clasificar bodegas y asignar responsabilidades operativas.

## Scope

### In Scope
- Migración SQL: nuevo ENUM `tipo_bodega_enum`, columnas `tipo_bodega` y `responsables` en tabla `bodegas`
- Actualización lambda `fnBodega`: create, update, validation, database utils
- Validación: `tipo_bodega` debe ser 'Virtual' o 'Fisica'; `responsables` debe ser array con UUIDs válidos y exactamente un `es_principal: true`

### Out of Scope
- Cambios en `servicio-core` NestJS (entidad, repositorio, controlador)
- Cambios en `fnTransaccionLineaBodegas`
- UI/Frontend

## Approach

1. Crear migración SQL idempotente con `IF NOT EXISTS` / `DO $$ ... $$`
2. Actualizar `constants/bodegaTypes.mjs`: nuevo enum `TIPO_BODEGA`
3. Actualizar `utils/validation.mjs`: validar `tipo_bodega` y `responsables`
4. Actualizar `utils/database.mjs`: incluir campos en INSERT y UPDATE dinámico
5. Deploy via `scripts/deployment/smart-deploy-lambdas.mjs` o AWS CLI zip

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/lambda/core/fnBodega/constants/bodegaTypes.mjs` | Modified | Agregar TIPO_BODEGA enum |
| `lib/lambda/core/fnBodega/utils/validation.mjs` | Modified | Validar nuevos campos |
| `lib/lambda/core/fnBodega/utils/database.mjs` | Modified | INSERT/UPDATE con nuevos campos |
| `sql/add-bodega-tipo-responsables.sql` | New | Migración DB |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bodegas existentes sin `tipo_bodega` | Med | DEFAULT NULL, campo opcional en create |
| JSONB `responsables` mal formado | Med | Validación estricta en lambda antes de insert |
| Rollback de migración rompe datos | Low | Migración idempotente con backup previo |

## Rollback Plan

```sql
ALTER TABLE bodegas DROP COLUMN IF EXISTS tipo_bodega;
ALTER TABLE bodegas DROP COLUMN IF EXISTS responsables;
DROP TYPE IF EXISTS tipo_bodega_enum;
```

## Success Criteria

- [ ] Migración ejecuta sin error en DB existente (idempotente)
- [ ] POST /bodegas acepta `tipo_bodega` y `responsables`
- [ ] PUT /bodegas/{id} actualiza `tipo_bodega` y `responsables`
- [ ] Validación rechaza tipo_bodega inválido con 400
- [ ] Validación rechaza responsables sin principal o con múltiples principales
- [ ] Deploy fnBodega exitoso en AWS

# Design: Bodega — tipo_bodega y responsables

## Architecture

Cambio aditivo en capa Lambda (fnBodega) + migración PostgreSQL. Sin cambios en API Gateway ni en NestJS microservicio.

## DB Migration

```sql
-- Idempotente: crea ENUM si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_bodega_enum') THEN
    CREATE TYPE tipo_bodega_enum AS ENUM ('Virtual', 'Fisica');
  END IF;
END $$;

ALTER TABLE bodegas ADD COLUMN IF NOT EXISTS tipo_bodega tipo_bodega_enum;
ALTER TABLE bodegas ADD COLUMN IF NOT EXISTS responsables JSONB;
```

## Lambda fnBodega — Cambios

### constants/bodegaTypes.mjs
Agregar:
```js
export const TIPO_BODEGA = ['Virtual', 'Fisica'];
```

### utils/validation.mjs — validateCreateData
```js
if (data.tipo_bodega !== undefined && !TIPO_BODEGA.includes(data.tipo_bodega)) {
  errors.push("tipo_bodega must be 'Virtual' or 'Fisica'");
}
validateResponsables(data.responsables, errors);
```

### utils/validation.mjs — validateUpdateData
Misma validación opcional.

### utils/validation.mjs — validateResponsables (nueva función)
```js
function validateResponsables(responsables, errors) {
  if (!responsables || responsables.length === 0) return;
  // Cada elemento: { id_usuario: UUID, es_principal: boolean }
  // Exactamente un es_principal: true
}
```

### utils/database.mjs — createBodega
Agregar `tipo_bodega` y `responsables` al INSERT dinámico.

### utils/database.mjs — updateBodega
Agregar manejo de `tipo_bodega` y `responsables` en el UPDATE dinámico.

## Flujo de Validación

```
Request Body
    ↓
BodegaValidator.validateCreateData / validateUpdateData
    ↓ (incluye tipo_bodega + responsables)
BodegaDatabase.createBodega / updateBodega
    ↓
PostgreSQL INSERT/UPDATE con nuevos campos
```

## Decisiones

| Decisión | Razón |
|----------|-------|
| `tipo_bodega` DEFAULT NULL | Compatibilidad con bodegas existentes |
| Validación en Lambda, no en DB constraint | Mensajes de error más descriptivos al cliente |
| JSONB para responsables | Flexible, sin tabla adicional requerida |

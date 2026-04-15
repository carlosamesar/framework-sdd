# Cierre del spec — gooderp-core-lambdas-id-pais-fix

**Fecha de cierre:** 2026-04-15
**Tipo:** Bug fix + deployment
**Repositorio:** `gooderp-orchestation`
**Lambdas:** `fnSede`, `fnBodega` (`lib/lambda/core/`)

---

## Objetivo

Corregir el error 500 en los endpoints `GET /api/v1/sedes` y `GET /api/v1/bodegas` causado por una referencia a la columna `g.id_pais` que no existe en la tabla `geo_unidad` de la base de datos.

---

## Causa raíz

```
error: column g.id_pais does not exist
hint: Perhaps you meant to reference the column "g.id_padre".
PostgreSQL code: 42703
```

Ambas lambdas incluían `'id_pais', g.id_pais,` dentro de `jsonb_build_object(...)` en los JOINs con `geo_unidad`. La columna `id_pais` no existe en esa tabla en producción.

---

## Problemas resueltos

| # | Lambda | Archivo | Problema | Solución |
|---|--------|---------|----------|----------|
| 1 | `fnSede` | `utils/database.mjs` | `'id_pais', g.id_pais,` en 3 queries (`getSedes`, `getSedeById`, `searchSedes`) | Eliminada la línea en los 3 `jsonb_build_object` |
| 2 | `fnSede` | `utils/database.mjs` | `sortOrder` interpolado directamente en SQL | Sanitizado: `sortOrder === 'DESC' ? 'DESC' : 'ASC'` |
| 3 | `fnBodega` | `utils/database.mjs` | `'id_pais', g.id_pais,` en 3 queries (`getBodegas`, `getBodegaById`, `searchBodegas`) | Eliminada la línea en los 3 `jsonb_build_object` |
| 4 | `fnBodega` | `utils/database.mjs` | `sortOrder` interpolado directamente en SQL | Sanitizado: `sortOrder === 'DESC' ? 'DESC' : 'ASC'` |

---

## Archivos modificados

```
develop/backend/gooderp-orchestation/lib/lambda/core/
├── fnSede/utils/database.mjs     ← eliminado g.id_pais ×3, sanitizado sortOrder
└── fnBodega/utils/database.mjs   ← eliminado g.id_pais ×3, sanitizado sortOrder
```

---

## Deployment

| Lambda | Método | Fecha | Tamaño ZIP |
|--------|--------|-------|-----------|
| `fnSede` | `aws lambda update-function-code` | 2026-04-14 | ~6 MB |
| `fnBodega` | `aws lambda update-function-code` | 2026-04-15 | 6.51 MB |

- Región: `us-east-1`
- Cuenta: `068858795558`
- API Gateway: `4j950zl6na` (GoodERP-Unified-API), stage `dev`

---

## Verificación

### fnSede

```
Invocación directa → statusCode: 200
success: true
sedes count: 18
```

### fnBodega

```
Invocación directa → statusCode: 200
success: true
bodegas count: 9
```

---

## Estado final

```
✅ fnSede  — FUNCIONAL Y CERRADO (18 sedes)
✅ fnBodega — FUNCIONAL Y CERRADO (9 bodegas)
   Fix: columna g.id_pais eliminada de todos los jsonb_build_object
   Fecha: 2026-04-15
```

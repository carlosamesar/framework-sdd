# Tasks: Bodega — tipo_bodega y responsables

## Fase 1: Migración DB

- [x] 1.1 Crear `sql/add-bodega-tipo-responsables.sql` — ENUM + columnas idempotente

## Fase 2: Lambda fnBodega

- [x] 2.1 `constants/bodegaTypes.mjs` — Agregar `TIPO_BODEGA` array
- [x] 2.2 `utils/validation.mjs` — Agregar `validateResponsables()` + validar `tipo_bodega`
- [x] 2.3 `utils/database.mjs` — `createBodega`: incluir `tipo_bodega` y `responsables`
- [x] 2.4 `utils/database.mjs` — `updateBodega`: incluir `tipo_bodega` y `responsables`

## Fase 3: Deploy

- [x] 3.1 Ejecutar migración SQL en RDS
- [x] 3.2 Deploy fnBodega a AWS Lambda

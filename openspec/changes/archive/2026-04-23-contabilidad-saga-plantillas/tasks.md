# Tasks: Plantillas Contables SAGA

**Change**: contabilidad-saga-plantillas
**Date**: 2026-04-23

## Phase 1: Base de Datos

- [x] 1.1 Activar `control_contable = true` en `tipos_transaccion` para C1
- [x] 1.2 Crear registro `ORD-COMP` en tabla `tipo_asiento`
- [x] 1.3 Insertar 3 registros en `tipo_transaccion_contable` para C1:
  - [x] 1.3.1 cuenta 143505 → subtotal → DEBITO
  - [x] 1.3.2 cuenta 240810 → total_impuestos → DEBITO
  - [x] 1.3.3 cuenta 220505 → total_neto → CREDITO

## Phase 2: Lambda fnActualizarContabilidad

- [x] 2.1 Analizar flujo de `fnActualizarContabilidad/index.mjs` (1027 líneas)
- [x] 2.2 Identificar bug en mapa de `tipo_asiento` (`.includes('COMP')` fallaba para C1)
- [x] 2.3 Corregir mapa a explícito `{ C1: 'ORD-COMP', C2: 'COMP-INV', ... }` (~línea 506)
- [x] 2.4 Deploy ZIP a `fnActualizarContabilidad` en us-east-1

## Phase 3: API Gateway — Administración de Plantillas

- [x] 3.1 Verificar que `fnTipoTransaccionContable` existe y está activa en AWS
- [x] 3.2 Crear recurso `/tipo-transaccion-contable` (ID: `ycueq6`) bajo `/api/v1`
- [x] 3.3 Registrar métodos GET + POST con Cognito authorizer
- [x] 3.4 Registrar OPTIONS con integración MOCK (sin auth)
- [x] 3.5 Crear recurso hijo `/{id}` (ID: `8otdj8`)
- [x] 3.6 Registrar métodos GET + PUT + DELETE con Cognito authorizer
- [x] 3.7 Registrar OPTIONS con integración MOCK (sin auth)
- [x] 3.8 Agregar permisos Lambda invoke para todos los métodos
- [x] 3.9 Deploy del stage `dev`

## Phase 4: Verificación

- [x] 4.1 Ejecutar auditoría SAGA end-to-end (`audit-saga-funcional.mjs`)
- [x] 4.2 Verificar 4/4 handlers COMPLETADO, 0 fallidos
- [x] 4.3 Verificar asiento generado con partida doble: D=1,190,000 = C=1,190,000
- [x] 4.4 Verificar endpoint GET `/tipo-transaccion-contable` responde 200
- [x] 4.5 Corregir aserción en script de auditoría (estado PENDIENTE es válido para asientos nuevos)

## Summary

**Total tasks**: 20/20 completadas ✅
**Resultado auditoría**: 27/27 assertions ✅
**Asiento generado**: ASI-2026-04-0001 — D=1,190,000 C=1,190,000 ✅

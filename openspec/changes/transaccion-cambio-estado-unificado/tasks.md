# Tasks: Endpoint Unificado de Cambio de Estado de Transacción

**Change**: `transaccion-cambio-estado-unificado`
**Date**: 2026-04-08
**Mode**: TDD (RED → GREEN → REFACTOR)

---

## Phase 1: Preparación de Utilidades

- [x] 1.1 Agregar `notFound(message)` a `utils/responseBuilder.mjs` — HTTP 404, código `NOT_FOUND`
- [x] 1.2 Agregar `forbidden(message)` a `utils/responseBuilder.mjs` — HTTP 403, código `FORBIDDEN`
- [x] 1.3 Actualizar `export default` en `responseBuilder.mjs` para incluir las nuevas funciones

## Phase 2: TDD — Handler cambiarEstado

- [x] 2.1 **RED**: Crear `handlers/cambiarEstado.test.mjs` con tests que fallan:
  - Test happy path: cambio PENDIENTE → APROBADA retorna 200
  - Test 400: payload inválido (falta id_estado)
  - Test 403: tenant del JWT ≠ tenant de la transacción
  - Test 404: transacción no existe
  - Test 409: transición inválida (ANULADA → APROBADA)
  - Test matriz de transiciones: todas las combinaciones
- [x] 2.2 **GREEN**: Crear `handlers/cambiarEstado.mjs` con implementación mínima que pasa todos los tests
- [x] 2.3 **REFACTOR**: Limpiar código, mejorar nombres, sin cambiar comportamiento

## Phase 3: Integración en index.mjs

- [x] 3.1 Actualizar import en `index.mjs` línea 30 — agregar `notFound, forbidden`
- [x] 3.2 Agregar routing en bloque POST de `index.mjs` — antes de `handlePostRequest`, detectar `path?.includes('/cambiar-estado')`

## Phase 4: Verificación

- [x] 4.1 Ejecutar `node handlers/cambiarEstado.test.mjs` — todos los tests pasan
- [x] 4.2 Crear `EVIDENCE.md` con output de tests y resumen de cambios

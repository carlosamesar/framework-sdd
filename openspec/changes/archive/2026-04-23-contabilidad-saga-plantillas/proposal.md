# Proposal: Plantillas Contables SAGA para C1 (Orden de Compra)

**Change**: contabilidad-saga-plantillas
**Date**: 2026-04-23
**Author**: CTO Grupo 4D
**Status**: IMPLEMENTED ✅

## Intent

Habilitar la generación automática de asientos contables al aprobar una transacción tipo C1
(Orden de Compra) mediante el patrón SAGA orquestado en AWS Lambda. Adicionalmente, exponer
la administración de plantillas contables vía API REST para que los usuarios puedan
configurar cuentas y naturalezas por tipo de transacción.

## Problem

1. `fnActualizarContabilidad` no generaba asientos para C1 porque:
   - `tipos_transaccion.control_contable = false` para C1
   - No había registros en `tipo_transaccion_contable` para C1
   - El mapa de `tipo_asiento` usaba `.includes('COMP')` que no coincide con `'C1'`
   - No existía registro `ORD-COMP` en tabla `tipo_asiento`

2. `fnTipoTransaccionContable` (CRUD de plantillas) existía en AWS pero no tenía
   ruta registrada en API Gateway — los usuarios no podían administrar las plantillas.

## Scope

### In Scope
- Activar `control_contable` para C1 en BD
- Insertar plantillas contables (3 cuentas) para C1 en `tipo_transaccion_contable`
- Crear tipo de asiento `ORD-COMP` en tabla `tipo_asiento`
- Fix del mapa de tipo asiento en `fnActualizarContabilidad/index.mjs`
- Deploy de `fnActualizarContabilidad` con el fix
- Registro de endpoint `/api/v1/tipo-transaccion-contable` en API Gateway (5 métodos)

### Out of Scope
- Migración a `contabilidad.plantillas_asiento` (NestJS) — mecanismo independiente
- Otros tipos de transacción distintos de C1

## Rollback Plan

1. **BD**: `UPDATE tipos_transaccion SET control_contable = false WHERE codigo = 'C1'`
2. **BD**: `UPDATE tipo_transaccion_contable SET fecha_anulacion = NOW() WHERE id_tipo_transaccion = '5dbb5f1a-006d-4447-b02e-56d880f4b59f'`
3. **Lambda**: Redeployar versión anterior desde `GitHub/dev/gooderp-orchestation`
4. **API GW**: Eliminar recurso `ycueq6` y su hijo `8otdj8`

## Affected Modules

| Módulo | Tipo de cambio |
|--------|----------------|
| `saga/fnActualizarContabilidad/index.mjs` | Fix código + deploy |
| BD `tipos_transaccion` | UPDATE control_contable |
| BD `tipo_transaccion_contable` | INSERT 3 registros |
| BD `tipo_asiento` | INSERT ORD-COMP |
| API Gateway `4j950zl6na` | Nuevo recurso + 5 métodos |

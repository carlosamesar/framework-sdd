---
id: "5.2.1"
module: "INVENTARIO"
change: "saga-inventario-integration-fix"
title: "Inventario — Observabilidad SAGA y extensión de TIPO_MOVIMIENTO_MAP"
status: "DRAFT"
author: "OpenCode"
created: "2026-04-10"
updated: "2026-04-10"
implements:
  - "lib/lambda/saga/fnActualizarInventario/index.mjs"
  - "lib/lambda/saga/fnSagaEventPublisher/index.mjs"
---

# Delta for INVENTARIO — Observabilidad y Cobertura de Tipos

## ADDED Requirements

### Requirement: R-INV-01 — TIPO_MOVIMIENTO_MAP cubre todos los tipos relevantes

`fnActualizarInventario` MUST mapear correctamente los tipos de transacción a tipos de movimiento de inventario. El mapa MUST incluir como mínimo:

| tipo_transaccion | tipo_movimiento | efecto_cantidad |
|------------------|-----------------|-----------------|
| `COM` | `COMPRA` | `+` |
| `VEN` | `VENTA` | `-` |
| `FACT-VTA` | `FACTURA_VENTA` | `-` |
| `FACT-COMP` | `FACTURA_COMPRA` | `+` |
| `NC-VTA` | `NOTA_CREDITO_VENTA` | `+` (reversal) |
| `ND-COMP` | `NOTA_DEBITO_COMPRA` | `-` (reversal) |

#### Scenario: Tipo de transacción no mapeado retorna error estructurado

- GIVEN `fnActualizarInventario` recibe un evento SAGA con `tipo_transaccion = 'TIPO_DESCONOCIDO'`
- WHEN el handler intenta resolver el tipo de movimiento
- THEN MUST retornar `{ estado: 'FALLIDO', error: 'UNMAPPED_TRANSACTION_TYPE', tipoTransaccion: 'TIPO_DESCONOCIDO' }`
- AND MUST insertar un registro en `saga_ejecuciones` con `estado_ejecucion = 'FALLIDO'`
- AND MUST NOT actualizar `inventario.cantidad_disponible`

#### Scenario: NC-VTA aplica movimiento inverso correctamente

- GIVEN una transacción `tipo_transaccion = 'NC-VTA'` con `cantidad = 5`
- WHEN el handler procesa el evento SAGA de tipo `TRANSACCION_APROBADA`
- THEN MUST insertar en `movimientos_inventario` con `tipo_movimiento = 'NOTA_CREDITO_VENTA'`
- AND `inventario.cantidad_disponible` MUST incrementarse en `5`
- AND `creado_por` MUST ser `'SISTEMA_SAGA'`

---

### Requirement: R-INV-02 — Logging estructurado en paths de fallo

`fnActualizarInventario` y `fnSagaEventPublisher` MUST registrar errores con contexto suficiente para diagnóstico.

#### Scenario: Error de BD en fnActualizarInventario registra contexto completo

- GIVEN el INSERT a `movimientos_inventario` falla con error PostgreSQL
- WHEN el handler captura la excepción
- THEN MUST ejecutar `console.error` con un objeto que incluya: `evento_id`, `tenant_id`, `tipo_transaccion`, `pg_code`, y `message`
- AND MUST insertar en `saga_ejecuciones` con `estado_ejecucion = 'FALLIDO'` y `datos_resultado` conteniendo el error
- AND MUST NOT dejar el evento en estado `PROCESANDO` indefinidamente

#### Scenario: fnSagaEventPublisher registra handler fallido con contexto

- GIVEN `InvokeCommand` a `fnActualizarInventario` retorna un error de invocación
- WHEN `fnSagaEventPublisher` captura el error
- THEN MUST ejecutar `console.error` con `{ evento_id, handler_name, error_code, timestamp }`
- AND el evento MUST ser actualizado a `estado = 'PENDIENTE'` (retry elegible) si `intentos < max_intentos`
- AND el evento MUST ser actualizado a `estado = 'FALLIDO'` si `intentos >= max_intentos`

## MODIFIED Requirements

### Requirement: REQ-05 (actualización de inventario vía SAGA)

(Previously: no existía requisito explícito sobre el creador del movimiento de inventario)

Todos los movimientos de inventario creados por el flujo SAGA MUST tener `creado_por = 'SISTEMA_SAGA'` en la tabla `movimientos_inventario`. Esto permite distinguir movimientos SAGA de movimientos directos.

#### Scenario: Movimiento creado por SAGA es trazable

- GIVEN `fnActualizarInventario` completa exitosamente un movimiento
- WHEN se consulta `movimientos_inventario` para la transacción
- THEN el registro MUST tener `creado_por = 'SISTEMA_SAGA'`
- AND MUST tener `evento_saga_id` referenciando el `saga_eventos.id` correspondiente

# Spec: Endpoint Unificado de Cambio de Estado de Transacción

**Change**: `transaccion-cambio-estado-unificado`
**Date**: 2026-04-08
**Status**: APPROVED

## Feature

Como sistema, quiero un endpoint atómico que cambie el estado de una transacción y registre el evento de auditoría en una sola transacción PostgreSQL, evitando estados inconsistentes entre `transacciones` y `transaccion_estado`.

---

## Scenarios

### Scenario 1: Cambio de estado válido (happy path)

```gherkin
Feature: Cambio unificado de estado de transacción

  Scenario: Cambio de estado PENDIENTE → APROBADA con registro de auditoría
    Given una transacción con id "txn-001" en estado "PENDIENTE" perteneciente al tenant "tenant-A"
    And el usuario autenticado tiene un JWT válido con claim "custom:tenant_id" = "tenant-A"
    When se envía POST /api/v1/transacciones-unificadas/{id}/cambiar-estado
      con body {"id_transaccion": "txn-001", "id_estado": "<uuid-estado-APROBADA>"}
    Then la respuesta tiene statusCode 200
    And el body contiene { success: true, data: { id_transaccion, id_estado, estado_anterior, estado_nuevo, actualizado_por, actualizado_en } }
    And en la BD, la tabla "transacciones" tiene id_estado = "<uuid-estado-APROBADA>"
    And en la BD, la tabla "transaccion_estado" tiene un nuevo registro con id_transaccion = "txn-001"
    And ambas operaciones ocurrieron en la misma transacción PostgreSQL (atómica)
```

### Scenario 2: Transición de estado inválida

```gherkin
  Scenario: Intento de cambio desde estado terminal ANULADA
    Given una transacción con id "txn-002" en estado "ANULADA" perteneciente al tenant "tenant-A"
    And el usuario autenticado tiene un JWT válido con claim "custom:tenant_id" = "tenant-A"
    When se envía POST /api/v1/transacciones-unificadas/{id}/cambiar-estado
      con body {"id_transaccion": "txn-002", "id_estado": "<uuid-estado-APROBADA>"}
    Then la respuesta tiene statusCode 409
    And el body contiene { success: false, error: { code: "INVALID_TRANSITION", message: "..." } }
    And la BD no fue modificada (rollback implícito)
```

### Scenario 3: Aislamiento multi-tenant (cross-tenant access denied)

```gherkin
  Scenario: Intento de cambio de estado de transacción de otro tenant
    Given una transacción con id "txn-003" perteneciente al tenant "tenant-B"
    And el usuario autenticado tiene un JWT válido con claim "custom:tenant_id" = "tenant-A"
    When se envía POST /api/v1/transacciones-unificadas/{id}/cambiar-estado
      con body {"id_transaccion": "txn-003", "id_estado": "<uuid-estado-APROBADA>"}
    Then la respuesta tiene statusCode 403
    And el body contiene { success: false, error: { code: "FORBIDDEN", message: "..." } }
    And la BD no fue modificada
```

---

## Acceptance Criteria

| # | Criterio | Verificable |
|---|----------|-------------|
| AC-1 | El endpoint acepta solo `{ id_transaccion, id_estado }` como payload | Prueba unitaria |
| AC-2 | El `tenant_id` se extrae exclusivamente del JWT (claim `custom:tenant_id`) | Prueba unitaria |
| AC-3 | La matriz de transiciones permitidas es respetada estrictamente | Prueba unitaria |
| AC-4 | UPDATE + INSERT ocurren en una sola transacción PostgreSQL atómica | Prueba de integración |
| AC-5 | Si la transacción no existe, retorna 404 | Prueba unitaria |
| AC-6 | Si el tenant del JWT no coincide con el de la transacción, retorna 403 | Prueba unitaria |
| AC-7 | Si la transición es inválida, retorna 409 con código `INVALID_TRANSITION` | Prueba unitaria |
| AC-8 | La respuesta exitosa retorna 200 (no 201) con datos del cambio | Prueba unitaria |
| AC-9 | El campo `actualizado_por` se registra con el `sub` del JWT | Prueba unitaria |

---

## Matriz de Transiciones Permitidas

| Estado Origen | Estados Destino Permitidos |
|---------------|---------------------------|
| `BORRADOR` | `PENDIENTE`, `ANULADA` |
| `PENDIENTE` | `APROBADA`, `RECHAZADA`, `ANULADA` |
| `APROBADA` | `COMPLETADA` |
| `RECHAZADA` | *(ninguno — terminal)* |
| `ANULADA` | *(ninguno — terminal)* |
| `COMPLETADA` | *(ninguno — terminal)* |

---

## Contract HTTP

**Endpoint**: `POST /api/v1/transacciones-unificadas/{id}/cambiar-estado`

**Request**:
```json
{
  "id_transaccion": "uuid",
  "id_estado": "uuid"
}
```

**Response 200** (éxito):
```json
{
  "success": true,
  "message": "Estado de transacción actualizado exitosamente",
  "data": {
    "id_transaccion": "uuid",
    "id_estado": "uuid",
    "estado_anterior": "PENDIENTE",
    "estado_nuevo": "APROBADA",
    "actualizado_por": "user-sub-uuid",
    "actualizado_en": "2026-04-08T20:00:00.000Z"
  }
}
```

**Response 400** (validación):
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

**Response 401** (sin JWT):
```json
{
  "success": false,
  "error": { "code": "UNAUTHORIZED", "message": "..." }
}
```

**Response 403** (cross-tenant):
```json
{
  "success": false,
  "error": { "code": "FORBIDDEN", "message": "Acceso denegado: la transacción no pertenece a este tenant" }
}
```

**Response 404** (no encontrado):
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Transacción no encontrada" }
}
```

**Response 409** (transición inválida):
```json
{
  "success": false,
  "error": { "code": "INVALID_TRANSITION", "message": "Transición no permitida: ANULADA → APROBADA" }
}
```

**Response 500** (error interno):
```json
{
  "success": false,
  "error": { "code": "INTERNAL_ERROR", "message": "Error interno del servidor" }
}
```

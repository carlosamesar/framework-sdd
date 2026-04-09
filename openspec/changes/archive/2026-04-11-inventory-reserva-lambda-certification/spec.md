---
id: "5.1.1"
module: "INV"
change: "2026-04-11-inventory-reserva-lambda-certification"
title: "fnReservaInventario Lambda Certification"
status: "DONE"
author: "OpenCode"
created: "2026-04-11"
updated: "2026-04-11"
implements:
  - "lib/lambda/inventario/fnReservaInventario/index.mjs"
  - "lib/lambda/inventario/fnReservaInventario/handlers/*.mjs"
  - "lib/lambda/inventario/fnReservaInventario/utils/*.mjs"
  - "lib/lambda/inventario/fnReservaInventario/tests/*.test.mjs"
  - "lib/lambda/inventario/fnReservaInventario/CONSUMO.md"
---

# Spec: fnReservaInventario Lambda

## ADDED Requirements

### REQ-01: Multi-Tenant Extraction

**SHALL** extract `tenant_id` from JWT claims using P1→P4 priority chain:
- P1: `requestContext.authorizer.claims['custom:tenant_id']`
- P2: `requestContext.authorizer.jwt.claims['custom:tenant_id']`
- P3: `body.tenant_id` (when no authorizer present — Step Functions)
- P4: `body.tenant_id` (when no requestContext — direct invocation)

**SHALL NOT** accept `x-tenant-id` header even in development/test mode.

**Scenarios:**

```gherkin
Given an API Gateway event with Cognito authorizer
When the JWT contains 'custom:tenant_id' claim
Then extractTenantId returns the tenant UUID

Given a development environment event with x-tenant-id header
When extractTenantId is called
Then the result is null (header bypass does not exist)

Given a Step Functions event without authorizer
When the body contains tenant_id
Then extractTenantId returns the tenant UUID from body
```

---

### REQ-02: Routing Security

**SHALL** use exact `lastSegment` matching for action routes:
- `POST /{id}/confirmar` → confirmarHandler
- `POST /{id}/cancelar` → cancelarHandler

**SHALL NOT** use substring matching (e.g., `path.includes('/confirmar')`).

**Scenarios:**

```gherkin
Given a POST request to /reservas-inventario/abc-123/confirmar
When the router extracts lastSegment
Then the handler dispatched is confirmarHandler

Given a POST request to /reservas-inventario/abc-123/confirmar-foo
When the router extracts lastSegment
Then the handler is NOT confirmarHandler (lastSegment is 'confirmar-foo')

Given a GET request to /reservas-inventario/abc-123/confirmar
When the method is GET
Then the handler is NOT confirmarHandler (wrong method)
```

---

### REQ-03: Create Reservation with Stock Validation

**SHALL** validate `stock_disponible >= cantidad_solicitada` before creating reservation.

**SHALL** return 400 with `INSUFFICIENT_STOCK` error when stock is insufficient.

**SHALL** create transaccion record with state `APROBADO` and expiration time `fecha_emision + 15 minutes`.

**Scenarios:**

```gherkin
Given a warehouse with 10 units of product X
When a reservation is created for 5 units
Then the reservation is created with state APROBADO
And stock_disponible is updated to 5

Given a warehouse with 0 units of product Y
When a reservation is created for 1 unit
Then the response is 400 with INSUFFICIENT_STOCK error
And the error details include stock_fisico, cantidad_reservada, and faltante

Given a reservation creation request without id_persona
When the request is processed
Then the response is 400 with validation errors listing required fields
```

---

### REQ-04: Confirm Reservation

**SHALL** update reservation state to `COMPLETADO`.

**SHALL** decrement physical stock and release reserved quantity.

**SHALL** return 400 if reservation is already expired.

**Scenarios:**

```gherkin
Given a reservation in APROBADO state
When POST /{id}/confirmar is called
Then the state changes to COMPLETADO
And physical stock is decremented by reservation quantity

Given a reservation that expired 20 minutes ago
When POST /{id}/confirmar is called
Then the response is 400 indicating the reservation is expired
```

---

### REQ-05: Cancel Reservation

**SHALL** update reservation state to `CANCELADO`.

**SHALL** release reserved stock back to available quantity.

**Scenarios:**

```gherkin
Given a reservation in APROBADO state
When POST /{id}/cancelar is called
Then the state changes to CANCELADO
And reserved stock is released back to available

Given a reservation already in COMPLETADO state
When POST /{id}/cancelar is called
Then the response is 400 indicating invalid state transition
```

---

### REQ-06: List Reservations with Filters

**SHALL** support filters: `id_bodega`, `estado`, `fecha_desde`, `fecha_hasta`, `solo_activas`.

**SHALL** support pagination with `limit` and `offset`.

**Scenarios:**

```gherkin
Given 100 reservations in the database
When GET /reservas-inventario?limit=10&offset=0 is called
Then the response contains 10 items with pagination metadata

Given reservations with various states
When GET /reservas-inventario?solo_activas=true is called
Then only APROBADO state reservations are returned
```

---

### REQ-07: Error Handling

**SHALL** map PostgreSQL errors to HTTP status codes:
- `23503` (FK violation) → 404
- `23505` (unique violation) → 409
- `23514` (check violation) → 400
- Other errors → 500

**Scenarios:**

```gherkin
Given a reservation creation with invalid bodega UUID
When the request is processed
Then the response is 404 with WAREHOUSE_NOT_FOUND error

Given a request without tenant JWT
When the request is processed
Then the response is 401 with unauthorized message
```

---

### REQ-08: Response Format

**SHALL** use `ResponseBuilder` for all responses with shape:
```json
{
  "success": true|false,
  "message": "string",
  "data": {},
  "error": { "code": "string", "details": [] },
  "timestamp": "ISO-8601",
  "request_id": "string"
}
```

**Scenarios:**

```gherkin
Given any successful request
When the response is received
Then success is true, message is present, and data contains the result

Given any error request
When the response is received
Then success is false, error.code is present, and timestamp/request_id are included
```

---

## Reservation States

| State | Description | Transitions |
|-------|-------------|-------------|
| `APROBADO` | Reservation created, pending confirmation | → COMPLETADO, CANCELADO, EXPIRADO |
| `COMPLETADO` | Reservation confirmed, stock decremented | (terminal) |
| `CANCELADO` | Reservation cancelled by user | (terminal) |
| `EXPIRADO` | Reservation expired automatically (15 min) | (terminal) |

---

## API Contract

| Method | Path | Success | Error | Description |
|--------|------|---------|-------|-------------|
| GET | `/reservas-inventario` | 200 | 400 | List with filters |
| GET | `/reservas-inventario/{id}` | 200 | 404 | Get by ID |
| POST | `/reservas-inventario` | 201 | 400 | Create (validates stock) |
| POST | `/reservas-inventario/{id}/confirmar` | 200 | 400 | Confirm |
| POST | `/reservas-inventario/{id}/cancelar` | 200 | 400 | Cancel |
| PUT | `/reservas-inventario/{id}` | 200 | 404 | Update observation |
| DELETE | `/reservas-inventario/{id}` | 200 | 404 | Soft delete |
| PATCH | `/reservas-inventario/{id}` | 200 | 404 | Partial update |
| OPTIONS | `/reservas-inventario` | 200 | — | CORS |

---

## Test Coverage

| Test Type | Count | Status |
|-----------|-------|--------|
| Unit (routing) | 18 | ✅ PASS |
| Unit (sanitization) | 15 | ✅ PASS |
| Integration (functional) | 13 | ✅ PASS |
| **Total** | **46** | **✅ 100%** |

---

## Certification Status

✅ **CERTIFIED** — All requirements verified via:
- 33 unit tests (routing + sanitization)
- 13 integration tests (direct Lambda invocation)
- Complete CONSUMO.md with payloads and responses
- Security audit passed (multi-tenant, routing)
- Error handling verified (PostgreSQL mapping)

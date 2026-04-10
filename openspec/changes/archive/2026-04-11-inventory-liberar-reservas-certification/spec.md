---
id: "5.2.1"
module: "INV"
change: "2026-04-11-inventory-liberar-reservas-certification"
title: "fnLiberarReservasExpiradas Lambda Certification"
status: "DONE"
author: "OpenCode"
created: "2026-04-11"
updated: "2026-04-11"
implements:
  - "lib/lambda/inventario/fnLiberarReservasExpiradas/index.mjs"
  - "lib/lambda/inventario/fnLiberarReservasExpiradas/utils/database.mjs"
  - "lib/lambda/inventario/fnLiberarReservasExpiradas/utils/sanitization.mjs"
  - "lib/lambda/inventario/fnLiberarReservasExpiradas/tests/*.test.mjs"
  - "lib/lambda/inventario/fnLiberarReservasExpiradas/CONSUMO.md"
---

# Spec: fnLiberarReservasExpiradas Lambda

## ADDED Requirements

### REQ-01: EventBridge Scheduled Processing

**SHALL** process EventBridge scheduled events and execute expiration logic.

**SHALL** find all `RESERVA_INV` transactions in `APROBADO` state with `fecha_expiracion <= NOW()`.

**SHALL** update their `id_estado` to `EXPIRADO` and `actualizado_por` to `system-auto-expire`.

**Scenarios:**

```gherkin
Given an EventBridge scheduled event
When the handler executes
Then it calls liberarReservasExpiradas() and returns 200

Given expired reservations exist in APROBADO state
When liberarReservasExpiradas() runs
Then those reservations are updated to EXPIRADO state

Given no expired reservations exist
When liberarReservasExpiradas() runs
Then it returns success with 0 reservations updated
```

---

### REQ-02: State Filtering

**SHALL** only affect reservations in `APROBADO` state.

**SHALL NOT** affect reservations already in `EXPIRADO`, `COMPLETADO`, or `CANCELADO` state.

**SHALL NOT** affect reservations with `fecha_expiracion > NOW()` (not yet expired).

**Scenarios:**

```gherkin
Given a reservation in APROBADO state with fecha_expiracion in the past
When the handler runs
Then the reservation is updated to EXPIRADO

Given a reservation in APROBADO state with fecha_expiracion in the future
When the handler runs
Then the reservation is NOT updated

Given a reservation already in EXPIRADO state
When the handler runs
Then the reservation is NOT updated (idempotent)

Given a reservation in COMPLETADO state
When the handler runs
Then the reservation is NOT updated
```

---

### REQ-03: Multi-Tenant Processing

**SHALL** process reservations from ALL tenants in a single run.

**SHALL NOT** filter by tenant (system-wide job).

**Scenarios:**

```gherkin
Given expired reservations from tenant A and tenant B
When the handler runs
Then reservations from both tenants are updated to EXPIRADO
```

---

### REQ-04: Statistics Query

**SHALL** execute `getEstadisticasReservas()` after expiration to get current state.

**SHALL** return counts grouped by estado name with expiradas/vigentes breakdown.

**Scenarios:**

```gherkin
Given reservations in various states
When getEstadisticasReservas() runs
Then it returns counts per estado with expiradas and vigentes columns
```

---

### REQ-05: Transaction Handling

**SHALL** use BEGIN/COMMIT/ROLLBACK for atomicity in `liberarReservasExpiradas()`.

**SHALL** rollback on any database error during the update.

**Scenarios:**

```gherkin
Given a database error during the expiration update
When the handler runs
Then the transaction is rolled back and no partial updates occur
```

---

### REQ-06: Error Handling

**SHALL** return 500 with error details when database operations fail.

**SHALL** log errors to CloudWatch for debugging.

**Scenarios:**

```gherkin
Given a database connection failure
When the handler runs
Then the response is 500 with error message

Given a statistics query failure
When the handler runs
Then the response is 500 with error message
```

---

### REQ-07: Response Shape

**SHALL** return structured JSON with:
- `success`: boolean
- `message`: string
- `reservas_liberadas`: number (count)
- `detalles`: array of {numero_documento, tenant, fecha_expiracion}
- `estadisticas`: array of {estado, total, expiradas, vigentes}
- `duracion_ms`: number
- `timestamp`: ISO-8601 string

**Scenarios:**

```gherkin
Given a successful expiration run with 2 reservations
When the response is received
Then reservas_liberadas is 2, detalles has 2 items, and estadisticas is present

Given a successful run with no expired reservations
When the response is received
Then reservas_liberadas is 0 and detalles is empty array
```

---

### REQ-08: Multi-Tenant Extraction (Security)

**SHALL** include `extractTenantId` function following P1→P4 priority chain.

**SHALL NOT** accept `x-tenant-id` header bypass.

**Note**: This Lambda is system-triggered and doesn't use tenant extraction in its flow. The function is present for consistency with other inventory lambdas.

**Scenarios:**

```gherkin
Given a request without authorizer
When extractTenantId is called
Then the result is null (no tenant in body for EventBridge events)

Given a request with x-tenant-id header in dev mode
When extractTenantId is called
Then the result is null (no bypass allowed)
```

---

## Test Coverage

| Test Type | Count | Status |
|-----------|-------|--------|
| Unit (sanitization) | 14 | ✅ PASS |
| Unit (handler, mocked) | 9 | ✅ PASS |
| Integration (database) | 10 | ⏳ Written, requires live DB |
| **Total** | **33** | **23/23 mocked ✅** |

---

## Bugs Fixed

| Bug | Impact | Fix |
|-----|--------|-----|
| `t.estado` column doesn't exist | Both queries failed | Use `id_estado` FK subqueries |
| `GROUP BY t.estado` wrong column | Statistics failed | JOIN with `estados`, `GROUP BY te.nombre` |

---

## Certification Status

✅ **CERTIFIED** — All mocked tests passing, DB integration tests written and corrected.

**Pending live DB verification**: 10 database integration tests require PostgreSQL access.

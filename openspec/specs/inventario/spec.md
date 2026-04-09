# Inventory Lambda Security & Consistency Specification

## Purpose

Defines the required behavioral contracts for all 11 inventory lambdas
(`lib/lambda/inventario/**`) after the audit-remediation change. Covers
tenant extraction, error mapping, response shape, routing, and runtime globals.

**Applies to**: fnAjusteInventario · fnEntradaInventario · fnInventario ·
fnLiberarReservasExpiradas · fnListaPrecio · fnMovimientoInventario ·
fnProducto · fnReservaInventario · fnSalidaInventario · fnTrasladoInventario ·
fnVarianteProducto

---

## Requirements

### Requirement: REQ-01 — Tenant Extraction Priority Chain

All 11 lambdas MUST implement `extractTenantId` with exactly four priority
levels evaluated in order. The function MUST return the first non-null value
found and MUST NOT fall through to a lower priority if a higher one is present.

| Priority | Source | Condition |
|----------|--------|-----------|
| P1 | `event.requestContext.authorizer.claims['custom:tenant_id']` | API Gateway + Cognito |
| P2 | Bearer token in `event.headers['Authorization']` — decode payload, read `custom:tenant_id` | HTTP API / ALB |
| P3 | `body.tenant_id` where `event.requestContext` is absent | Step Functions / direct invocation |
| P4 | `event.queryStringParameters.tenantId` | Fallback for direct invocation without body |

**MUST NOT** implement a `NODE_ENV=development` + `x-tenant-id` header path at
any priority level (neither as a named priority nor as a hidden fallback).

#### Scenario: P1 — API Gateway with Cognito authorizer (happy path)

- GIVEN an HTTP request arrives through API Gateway with a valid Cognito JWT
- AND `event.requestContext.authorizer.claims['custom:tenant_id']` is `"t-001"`
- WHEN `extractTenantId(event)` is called
- THEN it returns `"t-001"`
- AND it does not evaluate P2, P3, or P4

#### Scenario: P3 — Step Functions direct invocation (happy path)

- GIVEN a Step Functions task invokes the lambda directly
- AND the event has no `requestContext.authorizer`
- AND `event.body.tenant_id` is `"t-sf-123"`
- WHEN `extractTenantId(event)` is called
- THEN it returns `"t-sf-123"`
- AND the lambda continues processing normally (no 401 is returned)

#### Scenario: Missing tenant — all priorities exhausted

- GIVEN a request arrives with no JWT claims, no Authorization header,
  no body `tenant_id`, and no `queryStringParameters.tenantId`
- WHEN `extractTenantId(event)` is called
- THEN it returns `null`
- AND the lambda MUST return HTTP 401 with code `UNAUTHORIZED` before
  executing any business logic or database query

#### Scenario: Development header bypass attempt

- GIVEN `NODE_ENV` is set to `"development"`
- AND the request includes header `x-tenant-id: "t-evil"`
- AND all four priority sources are absent
- WHEN `extractTenantId(event)` is called
- THEN it returns `null`
- AND the lambda returns HTTP 401 (the header is not honored)

---

### Requirement: REQ-02 — PostgreSQL Error Code Mapping

All 11 lambdas MUST have a `constants/errors.mjs` module that maps
PostgreSQL error codes to HTTP status codes. The mapping MUST be used
by every handler that executes INSERT, UPDATE, or DELETE statements.

| PG Code | HTTP Status | Error Type |
|---------|-------------|------------|
| `23503` | 404 | `REFERENCE_NOT_FOUND` |
| `23505` | 409 | `DUPLICATE_ENTRY` |
| `23514` | 400 | `VALIDATION_FAILED` |
| `42P01` | 500 | `TABLE_NOT_FOUND` |
| *(default)* | 500 | `DATABASE_ERROR` |

#### Scenario: FK violation on inventory movement creation

- GIVEN a POST request to create an inventory entry references a non-existent product ID
- AND PostgreSQL raises error code `23503`
- WHEN the handler catches the database error
- THEN the lambda MUST return HTTP 404
- AND the response body MUST contain `error.code` = `"REFERENCE_NOT_FOUND"`

#### Scenario: Unique constraint violation on adjustment

- GIVEN a POST request creates an adjustment that violates a unique constraint
- AND PostgreSQL raises error code `23505`
- WHEN the handler catches the database error
- THEN the lambda MUST return HTTP 409
- AND the response body MUST contain `error.code` = `"DUPLICATE_ENTRY"`

#### Scenario: Check constraint violation

- GIVEN a POST request sends a quantity below zero that violates a check constraint
- AND PostgreSQL raises error code `23514`
- WHEN the handler catches the database error
- THEN the lambda MUST return HTTP 400
- AND the response body MUST contain `error.code` = `"VALIDATION_FAILED"`

---

### Requirement: REQ-03 — Response Shape Standardization

Every response produced by any of the 11 lambdas MUST include:

- `success` (boolean)
- `message` (string)
- `timestamp` (ISO-8601 string)
- `request_id` (non-empty string, unique per invocation)

The CORS preflight response for `OPTIONS` MUST return HTTP 200 and MUST
include a non-empty JSON body (not an empty string).

#### Scenario: Successful list response includes required fields

- GIVEN a valid GET request for inventory items
- AND the tenant is authenticated
- WHEN the lambda returns a 200 response
- THEN the response body MUST contain `success: true`, `timestamp`, and `request_id`
- AND `request_id` MUST differ between any two separate invocations

#### Scenario: CORS preflight returns body

- GIVEN an OPTIONS request arrives at any inventory lambda endpoint
- WHEN the handler routes to the CORS preflight branch
- THEN the lambda returns HTTP 200
- AND the response `body` is valid JSON (non-null, non-empty string)
- AND the response includes CORS headers `Access-Control-Allow-Origin` and
  `Access-Control-Allow-Methods`

---

### Requirement: REQ-04 — Sub-Action Routing (lastSegment Pattern)

`fnReservaInventario` and `fnTrasladoInventario` MUST route sub-action paths
(`/confirmar`, `/cancelar`, `/confirmar-recepcion`) using the `lastSegment`
pattern (last path segment after splitting on `/`).

Routing MUST NOT use `path.includes()` or `resource.includes()` as the sole
matching mechanism, as these produce false positives when resource names share
substrings.

| Lambda | Sub-action path | lastSegment |
|--------|-----------------|-------------|
| fnReservaInventario | `/{id}/confirmar` | `"confirmar"` |
| fnReservaInventario | `/{id}/cancelar` | `"cancelar"` |
| fnTrasladoInventario | `/{id}/confirmar-recepcion` | `"confirmar-recepcion"` |

#### Scenario: Confirm reservation via lastSegment routing

- GIVEN a POST request to `/reservas-inventario/{id}/confirmar`
- AND `pathParameters.id` is a valid UUID
- WHEN the router evaluates the path
- THEN `lastSegment` is computed as `"confirmar"`
- AND the request is dispatched to `confirmarHandler`
- AND NOT to `createHandler`

#### Scenario: Ambiguous path does NOT cause false match

- GIVEN a resource or path string that contains the substring `"confirmar"`
  but whose `lastSegment` is NOT `"confirmar"`
  (e.g., path = `/reservas-inventario/confirmar-detalle`)
- WHEN the router evaluates the path
- THEN it does NOT dispatch to `confirmarHandler`

---

### Requirement: REQ-05 — globalThis for Request Timing

All lambdas that record invocation start time MUST use `globalThis.requestStartTime`
instead of `global.requestStartTime`.

**Affected lambdas**: fnInventario, fnMovimientoInventario, fnProducto, fnVarianteProducto.

#### Scenario: Request start time is set via globalThis

- GIVEN any of the four affected lambdas receives an invocation
- WHEN the handler entry point sets the request start time
- THEN `globalThis.requestStartTime` is assigned `Date.now()`
- AND `global.requestStartTime` is NOT assigned (the deprecated form is absent)

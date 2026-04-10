# fnAjusteInventario — Functional Test Specification

## Purpose

Defines the observable behavior of `fnAjusteInventario` that MUST be validated by the functional test suite (`tests/functional.test.mjs`). Covers all 7 router branches plus error states. Tests run against the real DB using a real JWT; results are appended to `CONSUMO.md`.

---

## Requirements

### REQ-01: Create Adjustment (POST)

The handler MUST accept a POST request with a valid JWT and required fields, persist the record, and return HTTP 201 with the created resource.

| Field | Rule |
|-------|------|
| `id_persona` | MUST be a valid UUID FK |
| `id_bodega` | MUST be a valid UUID FK |
| `id_centro_costos` | MUST be a valid UUID FK |
| `id_tipo_moneda` | MUST be a valid UUID FK |
| `fecha_emision` | MUST be a date string |
| `observacion` | MUST be non-empty; MUST use prefix `[TEST]` in tests |
| `detalles` | MUST be a non-empty array; each item MUST have `id_producto` and `cantidad != 0` |

#### Scenario: SC-01 — Happy path create

- GIVEN a valid JWT with claim `custom:tenant_id = 11111111-1111-1111-1111-111111111111`
- AND a POST body with all required fields and `observacion` prefixed `[TEST]`
- WHEN the handler is invoked
- THEN the response status MUST be `201`
- AND `body.data` MUST contain an `id` (UUID)
- AND `body.success` MUST be `true`

#### Scenario: SC-01b — Missing observacion returns 400

- GIVEN a valid JWT
- AND a POST body where `observacion` is absent or empty string
- WHEN the handler is invoked
- THEN the response status MUST be `400`
- AND `body.success` MUST be `false`

---

### REQ-02: Get Adjustment by ID (GET /:id)

The handler MUST return the adjustment record for the authenticated tenant when `pathParameters.id` is set.

#### Scenario: SC-02 — Get by valid ID

- GIVEN a valid JWT
- AND `pathParameters.id` is set to a UUID that exists for the tenant
- WHEN the GET handler is invoked
- THEN the response status MUST be `200`
- AND `body.data.id` MUST equal the requested ID

#### Scenario: SC-07 — Get by non-existent ID returns 404

- GIVEN a valid JWT
- AND `pathParameters.id` is set to a well-formed UUID that does NOT exist
- WHEN the GET handler is invoked
- THEN the response status MUST be `404`
- AND `body.success` MUST be `false`

---

### REQ-03: List Adjustments (GET)

The handler MUST return an array (possibly empty) of adjustments for the authenticated tenant when no `pathParameters.id` is present.

#### Scenario: SC-03 — List returns array

- GIVEN a valid JWT
- AND no `pathParameters.id`
- WHEN the GET handler is invoked
- THEN the response status MUST be `200`
- AND `body.data` MUST be an array

---

### REQ-04: CORS Preflight (OPTIONS)

The handler MUST respond to OPTIONS requests before any auth check, returning 200 with CORS headers.

#### Scenario: SC-06 — OPTIONS preflight succeeds

- GIVEN any event with `httpMethod = 'OPTIONS'` (no JWT required)
- WHEN the handler is invoked
- THEN the response status MUST be `200`
- AND headers MUST include `Access-Control-Allow-Origin: *`
- AND headers MUST include `Access-Control-Allow-Methods` containing `GET, POST`

---

### REQ-05: PUT Returns 501

The handler MUST return HTTP 501 for PUT requests (update not implemented).

#### Scenario: SC-04 — PUT returns 501

- GIVEN a valid JWT and `httpMethod = 'PUT'`
- WHEN the handler is invoked
- THEN the response status MUST be `501`
- AND `body.error.type` MUST be `'NOT_IMPLEMENTED'`

---

### REQ-06: DELETE Returns 501

The handler MUST return HTTP 501 for DELETE requests (hard delete not permitted).

#### Scenario: SC-05 — DELETE returns 501

- GIVEN a valid JWT and `httpMethod = 'DELETE'`
- WHEN the handler is invoked
- THEN the response status MUST be `501`
- AND `body.error.type` MUST be `'NOT_IMPLEMENTED'`

---

### REQ-07: Invalid Method Returns 405

The handler MUST return HTTP 405 for any HTTP method not explicitly handled.

#### Scenario: SC-08 — PATCH returns 405

- GIVEN a valid JWT and `httpMethod = 'PATCH'`
- WHEN the handler is invoked
- THEN the response status MUST be `405`
- AND `body.error.type` MUST be `'METHOD_NOT_ALLOWED'`

---

### REQ-08: Missing Tenant Returns 401

The handler MUST return HTTP 401 when `extractTenantId` returns null (no JWT claims present).

#### Scenario: SC-09 — No JWT claims returns 401

- GIVEN an event with no `requestContext.authorizer.claims`
- AND `httpMethod` is NOT `'OPTIONS'`
- WHEN the handler is invoked
- THEN the response status MUST be `401`
- AND `body.success` MUST be `false`

---

### REQ-09: CONSUMO.md Evidence

The test suite MUST append one row per scenario to `CONSUMO.md` after each run.

| Column | Content |
|--------|---------|
| Scenario | Name (SC-01 … SC-09) |
| Method / Path | HTTP method and path simulated |
| Request Body | Anonimized payload (mask FK UUIDs) |
| Status | Actual HTTP status code |
| Response Sample | `body.success` + `body.data.id` or `body.error.type` |
| Execution Time | ms elapsed |

#### Scenario: SC-10 — CONSUMO.md is generated

- GIVEN the test suite completes all scenarios
- WHEN the suite teardown runs
- THEN `CONSUMO.md` MUST exist in the lambda directory
- AND MUST contain one data row for each scenario executed

---

## Notes

- `PUT` and `DELETE` are intentionally NOT implemented (`501`) — do not add tests expecting success for these methods.
- Endpoints `/search`, `/analytics`, and `/validate-lines` do NOT exist in this lambda — out of scope.
- CORS header `Idempotency-Key` is NOT present in this lambda's `handleCorsPreFlight` (differs from canonical `fnAgendamiento` pattern) — do not assert it.
- All test-created records MUST use `observacion` prefix `[TEST]` for easy cleanup.

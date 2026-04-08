---
id: "6.6.1"
module: "TXN"
change: "admin-transactions-saga-expansion"
title: "SAGA — Admin Transaction Types: Ingreso/Egreso Contable y General"
status: "APPROVED"
author: "OpenCode"
created: "2026-04-07"
updated: "2026-04-10"
closed: "2026-04-10"
implements:
  - "lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/services/orchestrator.mjs"
  - "lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/utils/sanitization.mjs"
  - "lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/index.mjs"
  - "lib/lambda/transacciones/fnTransaccionImpuesto/utils/sanitization.mjs"
  - "lib/lambda/transacciones/fnTransaccionDescuento/utils/sanitization.mjs"
  - "lib/lambda/transacciones/fnTransaccionEstado/utils/sanitization.mjs"
  - "lib/lambda/transacciones/fnTransaccionComplemento/utils/sanitization.mjs"
  - "lib/lambda/transacciones/fnTransaccionLineaBodegas/utils/sanitization.mjs"
---

# SAGA — Admin Transaction Types Specification

## Purpose

Define the behavior of the SAGA orchestrator when processing the four new administrative transaction types: **Ingreso Administrativo General**, **Ingreso Administrativo Contable**, **Egreso Administrativo General**, and **Egreso Administrativo Contable**. These types require conditional domain activation (Contabilidad is skipped for "General" types) and robust multi-tenant extraction for internal Step Functions invocations.

---

## Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| R1 | For "General" types, the orchestrator MUST skip the Contabilidad domain | MUST |
| R2 | For "Contable" types, the orchestrator MUST invoke the Contabilidad domain | MUST |
| R3 | All child lambdas MUST extract `tenant_id` via Priorities 1→4 (JWT → body) | MUST |
| R4 | When invoked without a JWT authorizer (Step Functions), child lambdas MUST accept `tenant_id` from the event body (Priority 3/4) | MUST |
| R5 | The orchestrator MUST propagate `tenant_id` in the body payload to all child lambda invocations | MUST |
| R6 | Each domain's SAGA step MUST be independently rollback-capable on failure | MUST |
| R7 | All responses MUST use the canonical `ResponseBuilder` shape | MUST |
| R8 | Administrative transactions MUST NOT leak data across tenant boundaries | MUST NOT |

---

## Scenarios

### Scenario 1: Success — Admin Ingreso General (skip Contabilidad)

- **GIVEN** a valid SAGA orchestration event with `tipo_transaccion = "INGRESO_ADMINISTRATIVO_GENERAL"` and a `tenant_id` claim in the JWT payload
- **WHEN** the orchestrator processes the event
- **THEN** it MUST execute: Cartera → Inventarios → Facturación Electrónica (in order)
- **AND** it MUST NOT invoke the Contabilidad domain step
- **AND** it MUST return `HTTP 200` with `ResponseBuilder.success(data)` including the composite result of all executed steps
- **AND** the `tenant_id` used across all steps MUST equal the one from the JWT claim `custom:tenant_id`

#### Scenario 1b: Admin Ingreso General — Contabilidad step is absent from response

- **GIVEN** the same preconditions as Scenario 1
- **WHEN** the orchestrator completes successfully
- **THEN** the response body MUST NOT contain a `contabilidad` key in `data.saga_steps`
- **AND** the response `metadata.skipped_domains` MUST include `"contabilidad"`

---

### Scenario 2: Success — Admin Egreso Contable (include Contabilidad)

- **GIVEN** a valid SAGA orchestration event with `tipo_transaccion = "EGRESO_ADMINISTRATIVO_CONTABLE"` and a `tenant_id` claim in the JWT payload
- **WHEN** the orchestrator processes the event
- **THEN** it MUST execute: Cartera → Contabilidad → Inventarios → Facturación Electrónica (in order)
- **AND** the Contabilidad step MUST receive the full transaction payload including `tenant_id`
- **AND** it MUST return `HTTP 200` with `ResponseBuilder.success(data)` including results from all four domains
- **AND** the `tenant_id` used across all steps MUST be consistent and equal the JWT claim

#### Scenario 2b: Admin Egreso Contable — Contabilidad step fails (partial rollback)

- **GIVEN** the same preconditions as Scenario 2
- **WHEN** the Contabilidad domain step returns an error (non-2xx)
- **THEN** the orchestrator MUST trigger compensating transactions for already-committed steps (Cartera rollback)
- **AND** it MUST return `HTTP 422` or `HTTP 500` with `ResponseBuilder.error(...)` detailing the failed step
- **AND** no data from a foreign tenant MUST appear in the error payload

---

### Scenario 3: Multi-tenant Isolation — Priority 3/4 Tenant Extraction

#### Scenario 3a: Step Functions invocation without JWT authorizer (Priority 3 — body)

- **GIVEN** the orchestrator invokes a child lambda (e.g., `fnTransaccionImpuesto`) via `lambdaInvoker.mjs` with `tenant_id` in the event body and NO `requestContext.authorizer`
- **WHEN** the child lambda's `extractTenantId()` runs
- **THEN** it MUST detect the absence of `requestContext.authorizer`
- **AND** it MUST extract `tenant_id` from `event.body.tenant_id` (Priority 3)
- **AND** it MUST proceed with that `tenant_id` for all database queries
- **AND** it MUST log the extraction source as `"body (priority-3)"`

#### Scenario 3b: Direct Lambda invocation without requestContext (Priority 4 — body)

- **GIVEN** a direct Lambda invocation (no API Gateway, no Step Functions requestContext) with `tenant_id` embedded in the raw event body
- **WHEN** the child lambda's `extractTenantId()` runs
- **THEN** it MUST extract `tenant_id` from the raw event body (Priority 4)
- **AND** it MUST NOT reject the request due to missing JWT
- **AND** it MUST log the extraction source as `"body (priority-4)"`

#### Scenario 3c: Cross-tenant isolation — tenant_id from body is respected

- **GIVEN** two concurrent SAGA orchestrations for `tenant_A` and `tenant_B` running in Step Functions
- **WHEN** both orchestrations invoke the same child lambda simultaneously
- **THEN** each invocation MUST use its own `tenant_id` for all queries (no shared state)
- **AND** results for `tenant_A` MUST NOT contain records owned by `tenant_B`
- **AND** results for `tenant_B` MUST NOT contain records owned by `tenant_A`

#### Scenario 3d: Missing tenant_id on all priorities — reject

- **GIVEN** a child lambda invocation with no JWT authorizer, no body `tenant_id`, and no Step Functions context containing `tenant_id`
- **WHEN** `extractTenantId()` exhausts all four priorities
- **THEN** the lambda MUST return `HTTP 403` via `ResponseBuilder.unauthorized("tenant_id no encontrado en ninguna fuente")`
- **AND** it MUST NOT execute any database query

---

## Transaction Type Routing Table

| `tipo_transaccion` | Cartera | Contabilidad | Inventarios | Facturación |
|--------------------|:-------:|:------------:|:-----------:|:-----------:|
| `INGRESO_ADMINISTRATIVO_GENERAL` | ✅ | ❌ (skip) | ✅ | ✅ |
| `INGRESO_ADMINISTRATIVO_CONTABLE` | ✅ | ✅ | ✅ | ✅ |
| `EGRESO_ADMINISTRATIVO_GENERAL` | ✅ | ❌ (skip) | ✅ | ✅ |
| `EGRESO_ADMINISTRATIVO_CONTABLE` | ✅ | ✅ | ✅ | ✅ |

---

## `extractTenantId()` Priority Contract

| Priority | Source | Condition |
|----------|--------|-----------|
| 1 | `requestContext.authorizer.claims["custom:tenant_id"]` | HTTP API Gateway (Cognito JWT) |
| 2 | `requestContext.authorizer.jwt.claims["custom:tenant_id"]` | HTTP API (formato alternativo; canon `fnTransaccionLineas`) |
| 3 | `event.body.tenant_id` (parsed JSON) | Step Functions internal invocation |
| 4 | `event.body.tenant_id` (parsed JSON) | Invocación directa sin `requestContext` |

If all priorities fail → MUST return `403 Unauthorized`.

---

## Cierre

- **Estado:** `APPROVED` (`closed: 2026-04-10`).
- **Evidencia:** `CIERRE-SPEC.md` en el directorio de archivo del change.
- **Spec publicado:** `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`.

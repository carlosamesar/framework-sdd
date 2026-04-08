# Design: SAGA NestJS — Certificación Funcional

**Change**: saga-nestjs-certification  
**Date**: 2026-04-08  
**Status**: READY

---

## Technical Approach

Adapt the existing Lambda-based E2E test (`lib/lambda/saga/test-saga-e2e.mjs`) to exercise the live `servicio-saga` NestJS microservice over HTTP. The test script replaces `LambdaClient` invocations with `fetch` calls to `http://localhost:3005`, injects a real JWT Bearer token in every request, seeds PostgreSQL directly via `pg` pool before each run, and verifies 8 behavioral scenarios defined in the spec.

No production code changes are needed — the microservice is already implemented. This change only adds the certification test script and its seed SQL.

---

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Supertest (NestJS TestingModule) vs. plain `fetch` against running server | Supertest needs the full NestJS app bootstrapped in Jest process; `fetch` tests a real running server, which is what certification requires | **`fetch` against `http://localhost:3005`** |
| Shared seed file vs. inline SQL in test | Inline is self-contained; shared file is reusable by other tests | **Inline seed in `beforeAll`**, extracted to constants for readability |
| JWT: real Cognito token vs. crafted fake | Real token requires network; fake token with correct claim structure passes `JwtTenantGuard` (decode-only guard) | **Crafted JWT with `custom:tenant_id` claim** — guard does not verify signature |
| Single test file vs. split by scenario | Split adds coordination overhead; single file with describe blocks is cleaner for a 8-scenario cert | **Single file**: `test-saga-e2e-nestjs.mjs` |
| Handler wait: `setTimeout` vs. polling | The original Lambda test used a 20s sleep; polling with backoff is faster and more reliable | **Polling with 100ms intervals, 10s timeout** |

---

## Data Flow

```
test-saga-e2e-nestjs.mjs
        │
        ├─── beforeAll ──→ pg pool ──→ seed: tipos_transaccion, productos,
        │                               variantes, inventario,
        │                               saga_event_configuration,
        │                               transaccion, transaccion_lineas
        │
        ├─── Scenario 1 ──→ POST /api/saga-events/change-status (APROBADO)
        │                         │
        │                         ▼
        │                   SagaTransactionService.changeStatus
        │                         │
        │                         ▼
        │                   creates 4 saga_eventos (pendiente)
        │                         │
        │                   POST /api/saga-events/publisher/process
        │                         │
        │                         ▼
        │                   SagaEventPublisherService
        │                         │
        │             ┌───────────┴───────────┐
        │             ▼                       ▼
        │      EventEmitter2            SagaHandlerDispatcher
        │    saga.handler.invoke         (4 handlers)
        │             │                       │
        │             └────────────┬──────────┘
        │                          ▼
        │                   saga_ejecuciones (COMPLETADO)
        │
        ├─── Scenario 2 ──→ POST /api/saga-events/change-status (ANULADO from APROBADO)
        │                   → 3 TRANSACCION_ANULADA events (no FacturaElectronica)
        │
        ├─── Scenario 3 ──→ change-status ANULADO with DIAN blocker → HTTP 422
        │
        ├─── Scenario 4 ──→ change-status ANULADO from EN_PROCESO → [] events
        │
        ├─── Scenario 5 ──→ publisher/process twice for same event → idempotent
        │
        ├─── Scenario 6 ──→ forced handler failure → retry → fallido after maxIntentos
        │
        ├─── Scenario 7 ──→ reconciler/reconcile resets stale procesando → pendiente
        │
        └─── Scenario 8 ──→ two tenants, no cross-contamination in saga_eventos
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/changes/saga-nestjs-certification/design.md` | Create | This document |
| `lib/lambda/saga/test-saga-e2e-nestjs.mjs` | Create | NestJS HTTP E2E certification script (replaces Lambda invocation pattern) |
| `lib/lambda/saga/seeds/saga-cert-seed.sql` | Create | Reusable SQL seed for certification data |

No changes to `servicio-saga/src/**` — the implementation is complete.

---

## Interfaces / Contracts

### JWT Structure (crafted for test)

The `JwtTenantGuard` only decodes — it does **not** verify the signature. The test fabricates a valid-structure JWT:

```js
// header.payload.signature — signature is ignored by the guard
const payload = {
  sub: 'test-user-001',
  'custom:tenant_id': 'T1-cert-tenant-uuid',
  email: 'cert@test.com',
  'cognito:groups': ['admin'],
};
const token = [
  btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
  btoa(JSON.stringify(payload)),
  'fake-sig'
].join('.');
```

### HTTP call helper

```js
async function api(method, path, body, token) {
  const res = await fetch(`http://localhost:3005${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
```

### Polling helper (replaces 20s sleep)

```js
async function pollUntil(queryFn, condition, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await queryFn();
    if (condition(result)) return result;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Polling timeout');
}
```

### Key DTO mappings (Lambda → NestJS)

| Lambda payload (snake_case) | NestJS DTO (camelCase) |
|---|---|
| `id_transaccion` | `idTransaccion` |
| `nuevo_estado` | `nuevoEstado` |
| `id_evento` | `idEvento` |
| `tipo_evento` | `tipoEvento` |
| `datos_evento` | `datosEvento` |

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E (certification) | All 8 scenarios from spec | `test-saga-e2e-nestjs.mjs` against `localhost:3005` |
| DB verification | `saga_eventos`, `saga_ejecuciones` row counts and states | Direct `pg` queries after each scenario |
| Multi-tenant isolation | No T2 rows appear in T1 queries | Query with explicit `WHERE tenant_id = T1` and assert T2 rows absent |
| Idempotency | Duplicate event dispatch produces 1 `COMPLETADO` row | Run publisher twice, count `saga_ejecuciones` |
| DIAN block | HTTP 422 returned, transaction state unchanged | Assert `res.status === 422`, re-query `transacciones` state |

**Pre-requisites to run**:
1. `servicio-saga` running on port 3005 (`npm run start:dev`)
2. PostgreSQL accessible with schema `saga` + tables from migrations
3. `.env` with `DB_*` vars pointing to test database

---

## Migration / Rollout

No schema migrations required. The certification test is additive-only:
- New file: `test-saga-e2e-nestjs.mjs`
- New file: `seeds/saga-cert-seed.sql`
- Seed is idempotent (uses `ON CONFLICT DO NOTHING`)
- Test cleans up after itself via `afterAll` (deletes rows with `cert_` prefix IDs)

---

## Open Questions

- [ ] Confirm `saga_event_configuration` seed rows exist in the test DB, or whether the seed must insert them — the test currently assumes `tipoTransaccion = 'VENTA'` rows exist.
- [ ] Confirm the exact `estado_dian` column name in the `facturas_electronicas` table for Scenario 3 (DIAN block) — assumed `estado_dian = 'ACEPTADO'` based on `saga-transaction.service.ts` analysis.

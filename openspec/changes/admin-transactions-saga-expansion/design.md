# Design: SAGA — Admin Transaction Types Expansion

## Technical Approach

Extend `TransactionOrchestrator` with a `_shouldIncludeContabilidad(tipo)` guard that gates the Contabilidad domain step based on `tipo_transaccion`. Simultaneously, replace the non-canonical `extractTenantId` in the five child lambdas with a verbatim copy from the canon (`fnTransaccionLineas/utils/sanitization.mjs`), adding Priorities 3 and 4 (body/Step Functions injection). No new lambdas or tables are required.

---

## Architecture Decisions

| # | Decision | Options Considered | Choice | Rationale |
|---|----------|--------------------|--------|-----------|
| 1 | Where to gate Contabilidad | (a) New lambda wrapper (b) `if` in orchestrator (c) Routing table in config | `if` in orchestrator | Routing table already exists as a spec artifact; inline guard keeps the SAGA linear and consistent with the current `orchestrator.mjs` structure |
| 2 | How to extend `lambdaNames` | (a) Hardcode Contabilidad service URL (b) Env var `LAMBDA_FN_CONTABILIDAD` | Env var pattern | Mirrors every existing `lambdaNames` entry; no magic strings |
| 3 | extractTenantId fix | (a) Centralize into shared module (b) Verbatim copy to each lambda | Verbatim copy | AGENTS.md rule §2 is explicit: *"Copiar el extractTenantId completo desde fnTransaccionLineas"*; no shared-module refactor in scope |
| 4 | Rollback on Contabilidad failure | (a) Best-effort (no rollback) (b) Compensating transaction to Cartera | Compensating transaction (Cartera rollback) | Spec scenario 2b requires it; pattern already present in orchestrator error-handling block |

---

## Data Flow

```
API Gateway (JWT P1/P2)  ─┐
Step Functions (body P3)  ─┤──→ fnOrquestadorTransaccionUnificada
Direct Lambda   (body P4)  ─┘          │
                                        ▼
                              _shouldIncludeContabilidad(tipo)
                                  ┌─────┴──────┐
                               true          false
                                  │              │
         ┌──── SAGA steps ────────┼──────────────┼────────────────────────────┐
         ▼                        ▼              ▼                            ▼
  fnTransaccion          fnContabilidad*      (skip)               fnTransaccionLineas
         ▼                        ▼                                           ▼
  fnTransaccionLineas             └──────────────────────────────→  fnTransaccionLineaBodegas
         ▼                                                                    ▼
  fnTransaccionLineaBodegas                                       fnTransaccionImpuesto
         ▼                                                                    ▼
  fnTransaccionImpuesto                                           fnRetencionTransaccion
         ▼                                                                    ▼
  fnRetencionTransaccion                                          fnTransaccionDescuento
         ▼                                                                    ▼
  fnTransaccionDescuento                                          fnTransaccionComplemento
         ▼                                                                    ▼
  fnTransaccionComplemento                                        fnTransaccionEstado
         ▼
  fnTransaccionEstado

* fnContabilidad = new step, only for INGRESO/EGRESO_ADMINISTRATIVO_CONTABLE
```

**Tenant propagation**: orchestrator receives `tenantId` from its own `extractTenantId()` (P1/P2) and injects it into every child lambda payload body so children can pick it up via P3/P4 when no authorizer is present.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `fnOrquestadorTransaccionUnificada/services/orchestrator.mjs` | Modify | Add `contabilidad` to `lambdaNames`; add `_shouldIncludeContabilidad(tipo)` helper; insert Contabilidad step between Cartera and Inventarios with rollback on failure |
| `fnOrquestadorTransaccionUnificada/utils/sanitization.mjs` | Modify | Add Priorities 3 and 4 — verbatim copy from `fnTransaccionLineas/utils/sanitization.mjs` |
| `fnTransaccionImpuesto/utils/sanitization.mjs` | Modify | Same P3/P4 addition |
| `fnTransaccionDescuento/utils/sanitization.mjs` | Modify | Same P3/P4 addition |
| `fnTransaccionEstado/utils/sanitization.mjs` | Modify | Same P3/P4 addition |
| `fnTransaccionComplemento/utils/sanitization.mjs` | Modify | Same P3/P4 addition |
| `fnTransaccionLineaBodegas/utils/sanitization.mjs` | Modify | Same P3/P4 addition |

> **Note**: `fnTransaccionLineas` is the canon and already has P1–P4. No changes needed there.

---

## Interfaces / Contracts

```javascript
// Routing guard — orchestrator.mjs
const ADMIN_CONTABLE_TYPES = new Set([
  'INGRESO_ADMINISTRATIVO_CONTABLE',
  'EGRESO_ADMINISTRATIVO_CONTABLE',
]);

_shouldIncludeContabilidad(tipoTransaccion) {
  return ADMIN_CONTABLE_TYPES.has(tipoTransaccion);
}

// lambdaNames addition
contabilidad: process.env.LAMBDA_FN_CONTABILIDAD || 'fnContabilidadTransaccion',

// Response shape — skipped domain reflected in metadata
// ResponseBuilder.success(data, msg, 200, {
//   skipped_domains: tipo is General ? ['contabilidad'] : []
// })
```

**No new API routes or DB schema changes required.** The 4 new `tipo_transaccion` values are data-level (existing `tipo_transaccion` column); no migration needed.

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `_shouldIncludeContabilidad()` with all 4 types + unknown | Jest, `orchestrator.test.mjs` |
| Unit | `extractTenantId()` P3 (body with `requestContext`, no authorizer) | Jest, `sanitization.test.mjs` per lambda |
| Unit | `extractTenantId()` P4 (raw event body, no `requestContext`) | Same file |
| Unit | P4 exhausted → 403 | Same file |
| Integration | Orchestrator with `INGRESO_ADMINISTRATIVO_GENERAL` — Contabilidad step absent | Jest + Lambda mock, assert `skipped_domains` |
| Integration | Orchestrator with `EGRESO_ADMINISTRATIVO_CONTABLE` — Contabilidad step present and rolls back on failure | Jest + Lambda mock |
| Integration | Cross-tenant isolation: two concurrent events → correct `tenant_id` isolation | Jest |

---

## Migration / Rollout

No database migration required. The `tipo_transaccion` values are inserted at the business layer (existing column supports free-text codes).

**Env var rollout**: add `LAMBDA_FN_CONTABILIDAD` to each lambda's environment before deploying `orchestrator.mjs`. The default fallback (`fnContabilidadTransaccion`) ensures no runtime crash if the var is missing.

**Deploy order**:
1. Deploy updated `sanitization.mjs` to all 5 child lambdas first (backward-compatible).
2. Deploy updated `orchestrator.mjs` (reads `LAMBDA_FN_CONTABILIDAD`).
3. Validate with integration tests against staging.

---

## Open Questions

- [ ] Does `fnContabilidadTransaccion` already exist, or does it need to be created? *(implementation phase must verify)*
- [ ] What is the exact payload contract that `fnContabilidad` expects? *(confirm before implementing the Contabilidad step in orchestrator)*

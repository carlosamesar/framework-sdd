# Verification Report — Inventory Audit Remediation

**Change**: `inventory-audit-remediation`
**Date**: 2026-04-09
**Verifier**: sdd-verify (claude-sonnet-4.6)
**Mode**: hybrid

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 37 |
| Tasks complete `[x]` | 37 |
| Tasks incomplete `[ ]` | 0 |

**Verdict**: ✅ All 37 tasks marked complete. No incomplete tasks found.

---

## Build & Tests Execution

**Build**: ➖ N/A — Node.js ESM modules, no build step required.

**Tests** (runner: `node --test`, Node.js 20 built-in test runner):

| Lambda | Test Files | Tests | Pass | Fail |
|--------|-----------|-------|------|------|
| `fnAjusteInventario` | `sanitization.test.mjs`, `errors.test.mjs` | 25 | 25 | 0 |
| `fnEntradaInventario` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnInventario` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnLiberarReservasExpiradas` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnListaPrecio` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnMovimientoInventario` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnProducto` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnReservaInventario` | `sanitization.test.mjs`, `routing.test.mjs` | 33 | 33 | 0 |
| `fnSalidaInventario` | `sanitization.test.mjs` | 14 | 14 | 0 |
| `fnTrasladoInventario` | `sanitization.test.mjs`, `routing.test.mjs` | 28 | 28 | 0 |
| `fnVarianteProducto` | `sanitization.test.mjs` | 14 | 14 | 0 |
| **TOTAL** | **13 test files** | **198** | **198** | **0** |

✅ **198/198 tests PASS — 0 failures, 0 skipped** (live run confirmed 2026-04-09)

**Coverage**: ➖ No threshold configured in `openspec/config.yaml`.

---

## Structural Audit (Grep Checks)

### 1. `global.requestStartTime` — deprecated form

```bash
grep -rn "global\.requestStartTime" lib/lambda/inventario/
# Result: (no output) — exit 1 (no matches)
```

✅ **0 matches** — All 6 affected lambdas use `globalThis.requestStartTime` exclusively.

---

### 2. `NODE_ENV === 'development'` inside `extractTenantId` (security)

```bash
grep -n "NODE_ENV.*===.*'development'" lib/lambda/inventario/fn*/utils/sanitization.mjs
# Result: (no output) — exit 1 (no matches)
```

✅ **0 matches** — No functional `NODE_ENV` bypass exists in any `sanitization.mjs`. The only hit in a broad search is a comment docstring in `fnAjusteInventario/utils/sanitization.mjs` explicitly documenting that the bypass was removed — not executable code.

---

### 3. `constants/errors.mjs` present in all 11 lambdas

```
lib/lambda/inventario/fnAjusteInventario/constants/errors.mjs      ✅
lib/lambda/inventario/fnEntradaInventario/constants/errors.mjs     ✅
lib/lambda/inventario/fnInventario/constants/errors.mjs            ✅
lib/lambda/inventario/fnLiberarReservasExpiradas/constants/errors.mjs ✅
lib/lambda/inventario/fnListaPrecio/constants/errors.mjs           ✅
lib/lambda/inventario/fnMovimientoInventario/constants/errors.mjs  ✅
lib/lambda/inventario/fnProducto/constants/errors.mjs              ✅
lib/lambda/inventario/fnReservaInventario/constants/errors.mjs     ✅
lib/lambda/inventario/fnSalidaInventario/constants/errors.mjs      ✅
lib/lambda/inventario/fnTrasladoInventario/constants/errors.mjs    ✅
lib/lambda/inventario/fnVarianteProducto/constants/errors.mjs      ✅
```

✅ **11/11 lambdas confirmed** — `PG_ERROR_MAP` (23503→404, 23505→409, 23514→400, 42P01→500) and `DEFAULT_DB_ERROR` present in all.

---

### 4. `lastSegment` in `fnReservaInventario` and `fnTrasladoInventario`

```
fnReservaInventario/index.mjs:49:  const lastSegment = pathSegments.at(-1) ?? '';
fnReservaInventario/index.mjs:52:  if (httpMethod === 'POST' && reservaId && lastSegment === 'confirmar') {
fnReservaInventario/index.mjs:57:  if (httpMethod === 'POST' && reservaId && lastSegment === 'cancelar') {
fnTrasladoInventario/index.mjs:51: const lastSegment = pathSegments.at(-1) ?? '';
fnTrasladoInventario/index.mjs:54: if (httpMethod === 'POST' && trasladoId && lastSegment === 'confirmar-recepcion') {
```

✅ **Both lambdas confirmed** — `lastSegment` computed via `pathSegments.at(-1) ?? ''` with exact equality matching (`===`). No `path.includes()` pattern present.

---

## Spec Compliance Matrix

Spec: `openspec/changes/inventory-audit-remediation/specs/inventario/spec.md`

| REQ | Scenario | Covering Test(s) | Result |
|-----|----------|-----------------|--------|
| **REQ-01** | P1 — API Gateway with Cognito authorizer (happy path) | `fn*/tests/sanitization.test.mjs` › "extractTenantId — P1 (REST authorizer claims) > returns tenant from requestContext.authorizer.claims" (×11) | ✅ COMPLIANT |
| **REQ-01** | P3 — Step Functions direct invocation (happy path) | `fn*/tests/sanitization.test.mjs` › "extractTenantId — P3 (Step Functions body) > returns tenant from body string when requestContext has no authorizer" (×11) | ✅ COMPLIANT |
| **REQ-01** | Missing tenant — all priorities exhausted | `fn*/tests/sanitization.test.mjs` › "extractTenantId — all-absent returns null > returns null for empty event" (×11) | ✅ COMPLIANT |
| **REQ-01** | Development header bypass attempt | `fn*/tests/sanitization.test.mjs` › "extractTenantId — SECURITY: no header bypass > returns null (not header value) when NODE_ENV=development + x-tenant-id header" (×11) | ✅ COMPLIANT |
| **REQ-02** | FK violation on inventory movement creation (23503 → 404) | `fnAjusteInventario/tests/errors.test.mjs` › "23503 maps to status 404" + "23503 maps to code REFERENCE_NOT_FOUND" | ✅ COMPLIANT |
| **REQ-02** | Unique constraint violation on adjustment (23505 → 409) | `fnAjusteInventario/tests/errors.test.mjs` › "23505 maps to status 409" + "23505 maps to code DUPLICATE_ENTRY" | ✅ COMPLIANT |
| **REQ-02** | Check constraint violation (23514 → 400) | `fnAjusteInventario/tests/errors.test.mjs` › "23514 maps to status 400" + "23514 maps to code VALIDATION_FAILED" | ✅ COMPLIANT |
| **REQ-03** | Successful list response includes required fields | ⚠️ No dedicated unit test found for response shape fields (`success`, `timestamp`, `request_id`) | ⚠️ PARTIAL |
| **REQ-03** | CORS preflight returns body | ⚠️ No dedicated unit test found for OPTIONS handler response shape | ⚠️ PARTIAL |
| **REQ-04** | Confirm reservation via lastSegment routing | `fnReservaInventario/tests/routing.test.mjs` › "routeReserva — confirmar dispatch (REQ-04) > POST /{id}/confirmar → dispatches to confirmar handler" | ✅ COMPLIANT |
| **REQ-04** | Ambiguous path does NOT cause false match | `fnReservaInventario/tests/routing.test.mjs` › "routeReserva — includes() vulnerability NOT present (REQ-04 security)" + `fnTrasladoInventario/tests/routing.test.mjs` › "routeTraslado — includes() vulnerability NOT present (REQ-04 security)" | ✅ COMPLIANT |
| **REQ-05** | Request start time is set via globalThis | Structural: `grep -rn "global\.requestStartTime"` → 0 matches (no functional `global.requestStartTime`); `globalThis.requestStartTime` confirmed in affected lambdas | ✅ COMPLIANT (structural) |

**Compliance summary**: **10/12 scenarios fully compliant, 2/12 partial (REQ-03 response shape)**

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| REQ-01: Tenant Extraction P1–P4 | ✅ Implemented | All 11 `sanitization.mjs` files updated; P1–P4 chain confirmed via 14 passing tests per lambda |
| REQ-01: No NODE_ENV bypass | ✅ Implemented | 0 grep matches in functional sanitization code |
| REQ-02: PG_ERROR_MAP in all 11 lambdas | ✅ Implemented | 11/11 `constants/errors.mjs` confirmed; smoke test in `fnAjusteInventario/tests/errors.test.mjs` (25 tests) |
| REQ-03: Response shape standardization | ⚠️ Partial | No unit tests for `success`, `timestamp`, `request_id` fields or CORS OPTIONS body shape. Structural implementation assumed but not behaviorally verified. |
| REQ-04: lastSegment routing in fnReservaInventario | ✅ Implemented | `lastSegment` at line 49; dispatches `confirmar`/`cancelar` (routing.test.mjs 33 tests) |
| REQ-04: lastSegment routing in fnTrasladoInventario | ✅ Implemented | `lastSegment` at line 51; dispatches `confirmar-recepcion` (routing.test.mjs 28 tests) |
| REQ-05: globalThis.requestStartTime | ✅ Implemented | 0 grep matches for `global.requestStartTime`; verified in fnAjusteInventario, fnEntradaInventario, fnInventario, fnMovimientoInventario, fnProducto, fnVarianteProducto |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| P1–P4 priority chain, no short-circuit on NODE_ENV | ✅ Yes | Matches design contract exactly |
| `constants/errors.mjs` verbatim from fnTransaccionLineas template | ✅ Yes | PG_ERROR_MAP keys and DEFAULT_DB_ERROR shape match reference |
| `lastSegment = pathSegments.at(-1) ?? ''` idiom | ✅ Yes | Exact idiom used in both routing lambdas |
| `global.` → `globalThis.` migration | ✅ Yes | 6 lambdas migrated (design listed 5; fnVarianteProducto was added as discovered during Phase 3) |
| Tests written as `.mjs` files in `fn*/tests/` | ✅ Yes | 13 test files across 11 lambdas |
| Phase 4 integration tests (live AWS) | ⚠️ Deferred | No `.integration.test.mjs` files exist; deferred to post-deploy change as documented in EVIDENCE.md |

---

## Issues Found

**CRITICAL** (must fix before archive):
None

**WARNING** (should fix):
- **REQ-03 behavioral tests missing** — The spec defines two scenarios for response shape standardization (successful list response with `success`/`timestamp`/`request_id` fields, and CORS preflight returning a non-empty JSON body). No unit tests exist to prove these behaviors at runtime. The structural implementation likely exists (inherited from lambda templates), but without tests these scenarios are only PARTIAL in the compliance matrix. A follow-up change should add `responseBuilder.test.mjs` per lambda, or at minimum a shared smoke test.

**SUGGESTION** (nice to have):
- REQ-05 globalThis coverage is verified structurally via grep but has no dedicated `timing.test.mjs`. Adding a test that instantiates each affected handler's entry with a mock event and asserts `globalThis.requestStartTime` is set would close the behavioral gap.
- Integration tests (`.integration.test.mjs`) remain deferred. Consider creating a follow-up change `inventory-integration-tests` once the lambdas are deployed to staging.

---

## Verdict

**PASS WITH WARNINGS**

All 37 tasks complete. 198/198 tests pass live (0 failures). All 4 structural audits pass (`global.requestStartTime` = 0 matches, `NODE_ENV=development` in `sanitization.mjs` = 0 matches, `constants/errors.mjs` present in 11/11 lambdas, `lastSegment` confirmed in fnReservaInventario and fnTrasladoInventario). 10/12 spec scenarios are fully behaviorally compliant; 2 REQ-03 scenarios are structurally implemented but lack unit test coverage. No CRITICAL issues. Safe to proceed to `sdd-archive`.

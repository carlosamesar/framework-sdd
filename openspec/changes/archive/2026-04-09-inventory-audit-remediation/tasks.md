# Tasks: Inventory Audit Remediation

> Base path: `develop/backend/gooderp-orchestation/lib/lambda/inventario/`
> Reference template: `lib/lambda/transacciones/fnTransaccionLineas/`

---

## Phase 1: Foundation — constants/errors.mjs + shared utils

Tasks in this phase can run in parallel per lambda.

- [x] 1.1 Create `fnAjusteInventario/constants/errors.mjs` — PG_ERROR_MAP (23503→404, 23505→409, 23514→400, 42P01→500) + DEFAULT_DB_ERROR, verbatim from fnTransaccionLineas template
- [x] 1.2 Create `fnEntradaInventario/constants/errors.mjs` — same shape as 1.1
- [x] 1.3 Create `fnReservaInventario/constants/errors.mjs` — same shape as 1.1
- [x] 1.4 Create `fnSalidaInventario/constants/errors.mjs` — same shape as 1.1
- [x] 1.5 Create `fnTrasladoInventario/constants/errors.mjs` — same shape as 1.1
- [x] 1.6 Create `fnLiberarReservasExpiradas/constants/errors.mjs` — same shape as 1.1
- [x] 1.7 Audit `fnInventario/constants/errors.mjs`, `fnListaPrecio/constants/errors.mjs`, `fnMovimientoInventario/constants/errors.mjs`, `fnProducto/constants/errors.mjs`, `fnVarianteProducto/constants/errors.mjs` — verify PG_ERROR_MAP keys and DEFAULT_DB_ERROR exist; patch if missing
- [x] 1.8 Write unit test `fnAjusteInventario/tests/errors.test.mjs` — assert PG codes map to correct HTTP status and code string (covers all 11 via shared shape; use as smoke for others)

---

## Phase 2: Security Upgrade — extractTenantId P1–P4 + bypass removal

Each lambda is independent. P1/P2 paths are not touched — only additive P3/P4 and bypass removal.

### Group A: NODE_ENV bypass removal + P3/P4 addition (5 lambdas)

- [x] 2.1 `fnAjusteInventario/utils/sanitization.mjs` — remove `NODE_ENV=development` + `x-tenant-id` block; add P3 (Step Functions body) and P4 (direct invocation body) paths; copy signature from design Section "Interfaces / Contracts"
- [x] 2.2 `fnEntradaInventario/utils/sanitization.mjs` — same as 2.1
- [x] 2.3 `fnReservaInventario/utils/sanitization.mjs` — same as 2.1
- [x] 2.4 `fnSalidaInventario/utils/sanitization.mjs` — same as 2.1
- [x] 2.5 `fnTrasladoInventario/utils/sanitization.mjs` — same as 2.1

### Group B: P3/P4 addition only (6 lambdas — no bypass to remove)

- [x] 2.6 `fnInventario/utils/sanitization.mjs` — add P3 + P4 blocks only
- [x] 2.7 `fnLiberarReservasExpiradas/utils/sanitization.mjs` — add P3 + P4 blocks only
- [x] 2.8 `fnListaPrecio/utils/sanitization.mjs` — add P3 + P4 blocks only
- [x] 2.9 `fnMovimientoInventario/utils/sanitization.mjs` — add P3 + P4 blocks only
- [x] 2.10 `fnProducto/utils/sanitization.mjs` — add P3 + P4 blocks only
- [x] 2.11 `fnVarianteProducto/utils/sanitization.mjs` — add P3 + P4 blocks only

### Security Tests (write alongside each lambda)

- [x] 2.12 `fnAjusteInventario/tests/sanitization.test.mjs` — P1 returns claims value; P3 Step Functions event returns body.tenant_id; all-absent returns null; NODE_ENV+x-tenant-id header returns null (REQ-01 scenarios)
- [x] 2.13 Repeat test suite pattern (2.12) for each remaining 10 lambdas — one test file per lambda at `fn*/tests/sanitization.test.mjs`

---

## Phase 3: Routing & Timing

### Sub-action lastSegment routing (2 lambdas)

- [x] 3.1 `fnReservaInventario/index.mjs` — replace `path.includes('/confirmar')` and `path.includes('/cancelar')` with `lastSegment === 'confirmar'` / `lastSegment === 'cancelar'`; compute `lastSegment = pathSegments.at(-1) ?? ''`
- [x] 3.2 `fnTrasladoInventario/index.mjs` — replace `path.includes('/confirmar-recepcion')` with `lastSegment === 'confirmar-recepcion'`
- [x] 3.3 `fnReservaInventario/tests/routing.test.mjs` — POST /{id}/confirmar → confirmarHandler; POST /confirmar-foo does NOT dispatch; POST /{id}/cancelar → cancelarHandler (REQ-04 scenarios)
- [x] 3.4 `fnTrasladoInventario/tests/routing.test.mjs` — POST /{id}/confirmar-recepcion → recepcionHandler; substring "confirmar-recepcion" inside longer path does NOT dispatch

### globalThis timing (5 lambdas)

- [x] 3.5 `fnAjusteInventario/index.mjs` — replace `global.requestStartTime` → `globalThis.requestStartTime`
- [x] 3.6 `fnEntradaInventario/index.mjs` — same as 3.5
- [x] 3.7 `fnInventario/index.mjs` — same as 3.5
- [x] 3.8 `fnMovimientoInventario/index.mjs` — same as 3.5
- [x] 3.9 `fnProducto/index.mjs` — same as 3.5

---

## Phase 4: Verification — Tests + EVIDENCE.md

- [x] 4.1 Run `grep -r "NODE_ENV" lib/lambda/inventario/` — assert 0 matches; document result
- [x] 4.2 Run `grep -r "x-tenant-id" lib/lambda/inventario/` — assert 0 matches; document result
- [x] 4.3 Run `grep -r "global\.requestStartTime" lib/lambda/inventario/` — assert 0 matches; document result
- [x] 4.4 Run `grep -rL "constants/errors.mjs" lib/lambda/inventario/` — assert all 11 lambdas have the file; document result
- [x] 4.5 Run all unit tests (`fn*/tests/*.test.mjs`) — assert 0 failures; capture output
- [x] 4.6 Run integration tests (`fn*/tests/*.integration.test.mjs`) — OPTIONS → 200 JSON body; 23505 PG error → 409; SF body tenant → 200; unknown path → 404
- [x] 4.7 Create `openspec/changes/inventory-audit-remediation/EVIDENCE.md` — paste grep outputs, test run summaries, and pass/fail matrix for REQ-01 through REQ-05

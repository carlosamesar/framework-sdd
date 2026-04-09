# Proposal: Inventory Audit Remediation

## Intent

Remediate security, consistency, and maturity gaps across the 11 inventory lambdas (`lib/lambda/inventario/**`) identified in audit. Current gaps expose a header-based tenant bypass (`x-tenant-id` gated on `NODE_ENV=development`) and lack P3/P4 (Step Functions / direct invocation) tenant extraction paths — both are explicit AGENTS.md violations. Additional gaps: missing `constants/errors.mjs` PostgreSQL→HTTP mapping, non-standard `ResponseBuilder` shapes, rigid path-segment routing in `fnReserva`/`fnTraslado`, and use of deprecated `global.*` instead of `globalThis.*`. Goal: 100% AGENTS.md compliance with zero unsafe fallbacks.

## Scope

### In Scope
- Remove all `NODE_ENV=development` + `x-tenant-id` fallbacks (5 lambdas affected)
- Add P3 (Step Functions: body `tenant_id`) and P4 (direct invocation: body `tenant_id`) to `extractTenantId` in all 11 lambdas
- Create `constants/errors.mjs` with PostgreSQL→HTTP code mapping for all 11 lambdas (6 currently missing it)
- Verify/standardize `ResponseBuilder`: `request_id` present, CORS OPTIONS returns body
- Fix routing in `fnReservaInventario` and `fnTrasladoInventario` to use `lastSegment` pattern (not brittle `path.includes()`)
- Replace `global.requestStartTime` → `globalThis.requestStartTime` in 4 lambdas
- Produce `EVIDENCE.md` with test results certifying all fixes

### Out of Scope
- New business logic or endpoints
- Database schema changes
- Frontend / UI changes
- Migration to NestJS microservice

## Approach

Use `fnTransaccionLineas` (`lib/lambda/transacciones/fnTransaccionLineas/`) as the maturity template. Copy its `extractTenantId` (4-priority chain) and `constants/errors.mjs` verbatim then adapt to inventario domain. Apply changes via a **shared upgrade pass**: first fix `utils/sanitization.mjs` and `constants/errors.mjs` per lambda, then verify `ResponseBuilder`, then fix routing and `globalThis` in the two affected index files. Each lambda is treated as an isolated unit — no cross-lambda shared `utils` directory (respects existing per-lambda isolation pattern).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/lambda/inventario/fnAjusteInventario/utils/sanitization.mjs` | Modified | Add P3/P4, remove `NODE_ENV` fallback |
| `lib/lambda/inventario/fnEntradaInventario/utils/sanitization.mjs` | Modified | Add P3/P4, remove `NODE_ENV` fallback |
| `lib/lambda/inventario/fnReservaInventario/utils/sanitization.mjs` | Modified | Add P3/P4, remove `NODE_ENV` fallback |
| `lib/lambda/inventario/fnSalidaInventario/utils/sanitization.mjs` | Modified | Add P3/P4, remove `NODE_ENV` fallback |
| `lib/lambda/inventario/fnTrasladoInventario/utils/sanitization.mjs` | Modified | Add P3/P4, remove `NODE_ENV` fallback |
| `lib/lambda/inventario/fn{Inventario,ListaPrecio,Movimiento,Producto,Reserva,Salida,Traslado,Variante,Ajuste,Entrada,LiberarReservas}/utils/sanitization.mjs` | Modified | Add P3/P4 to all remaining 6 lambdas |
| `lib/lambda/inventario/fn{Ajuste,Entrada,Reserva,Salida,Traslado,LiberarReservas}/constants/errors.mjs` | New | PostgreSQL→HTTP mapping (6 lambdas missing it) |
| `lib/lambda/inventario/fn{Inventario,ListaPrecio,Movimiento,Producto,Variante}/constants/errors.mjs` | Modified | Verify or upgrade to full PG mapping |
| `lib/lambda/inventario/fnReservaInventario/index.mjs` | Modified | `lastSegment` routing pattern |
| `lib/lambda/inventario/fnTrasladoInventario/index.mjs` | Modified | `lastSegment` routing pattern |
| `lib/lambda/inventario/fn{Inventario,Movimiento,Producto,Variante}/index.mjs` | Modified | `global.` → `globalThis.` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking Step Functions flows that currently don't pass `tenant_id` in body | Low | P3/P4 are additive — existing P1/P2 paths unchanged; SF callers should already include `tenant_id` per AGENTS.md |
| Routing change in `fnReserva`/`fnTraslado` breaking sub-path actions (`/confirmar`, `/cancelar`) | Med | Mirror exact pattern from `fnTransaccion`; test all sub-paths in EVIDENCE.md |
| `constants/errors.mjs` import colliding with existing `*Constants.mjs` naming | Low | Use `errors.mjs` filename (separate from domain constants); no naming clash |

## Rollback Plan

All changes are isolated to `utils/sanitization.mjs`, `constants/errors.mjs`, and `index.mjs` per lambda. Git revert of `inventory-audit-remediation` branch restores prior state. No DB migrations — pure code change, fully reversible.

## Dependencies

- `fnTransaccionLineas/utils/sanitization.mjs` — source template for P3/P4 pattern
- `fnTransaccionLineas/constants/errors.mjs` — source template for PostgreSQL mapping

## Success Criteria

- [ ] 0 occurrences of `NODE_ENV === 'development'` + `x-tenant-id` in all 11 lambdas
- [ ] All 11 `extractTenantId` functions include P3 (Step Functions body) and P4 (direct invocation body) paths
- [ ] All 11 lambdas have `constants/errors.mjs` with PostgreSQL→HTTP mapping
- [ ] `ResponseBuilder` in all 11 lambdas includes `request_id` field
- [ ] `fnReservaInventario` and `fnTrasladoInventario` use `lastSegment` routing
- [ ] 0 uses of `global.requestStartTime` (replaced by `globalThis.requestStartTime`)
- [ ] `EVIDENCE.md` certifying all fixes with passing test evidence

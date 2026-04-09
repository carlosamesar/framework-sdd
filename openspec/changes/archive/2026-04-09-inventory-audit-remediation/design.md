# Design: Inventory Audit Remediation

## Technical Approach

Apply a uniform upgrade pass across all 11 inventory lambdas in
`lib/lambda/inventario/**` using `fnTransaccionLineas` as the maturity
template. Five targeted file changes per lambda (sanitization, constants,
responseBuilder, index, and in two lambdas the routing block) eliminate the
`NODE_ENV` bypass, add P3/P4 tenant paths, provide standard PostgreSQL→HTTP
mapping, and harden sub-action routing — with zero new business logic.

---

## Architecture Decisions

### Decision 1: Standard `extractTenantId` implementation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Copy `fnTransaccionLineas` 4-priority chain verbatim | Zero divergence; future updates propagate from one source | ✅ Chosen |
| Per-lambda custom chain | Flexibility; no guarantees chains stay aligned | ❌ Rejected |
| Shared npm package | Cleaner but requires packaging infra change | ❌ Out of scope |

**Rationale**: AGENTS.md mandates no ad-hoc multi-tenant mechanisms while a
canonical implementation exists. Verbatim copy removes ambiguity about which
priority order is authoritative. P3/P4 are purely additive — P1/P2 paths are
unchanged, so no regression risk.

---

### Decision 2: `constants/errors.mjs` as separate module

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `constants/errors.mjs` alongside domain constants | Mirrors fnTransaccionLineas; grep-able filename `errors.mjs` | ✅ Chosen |
| Inline PG error map inside responseBuilder | One fewer file; no import | ❌ Rejected — breaks single-responsibility and makes the map invisible to handlers |
| Extend existing `*Constants.mjs` files | Avoids new file in 5 lambdas that already have constants | ❌ Rejected — mixes domain constants with infrastructure error codes |

**Rationale**: Handlers and responseBuilder can both import from a single
authoritative source. File name `errors.mjs` matches the reference lambda and
is directly searchable.

---

### Decision 3: `lastSegment` routing for sub-actions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `lastSegment = path.split('/').filter(Boolean).at(-1)` | Exact match; immune to substring collisions | ✅ Chosen |
| `path.includes('/confirmar')` | Simple; already in place | ❌ Rejected — `/confirmar` substring matches `/confirmar-recepcion`, causing wrong dispatch |
| Regex match per sub-action | Precise; verbose | ❌ Rejected — `lastSegment` already gives exact segment, regex is unnecessary |

**Rationale**: The current `path.includes()` guard would mis-route
`/reservas/{id}/confirmar-recepcion` to `confirmarHandler` in any lambda that
acquired that sub-path. `lastSegment` gives an exact, position-aware match
identical to the `fnTransaccion` reference.

---

## Data Flow

```
API Gateway / Step Functions / Direct Invocation
          │
          ▼
   index.mjs  ──globalThis.requestStartTime──►  (timing)
          │
          ├─ OPTIONS ──────────────────────────► ResponseBuilder.cors()
          │
          ▼
   extractTenantId(event)          ← sanitization.mjs (P1→P2→P3→P4)
          │ null
          └──────────────────────────────────► 401 UNAUTHORIZED
          │ tenantId
          ▼
   lastSegment routing (fnReserva / fnTraslado)
          │
          ▼
   handler(event)
          │ PG error
          ├─ code 23503 ──► errors.mjs → 404 REFERENCE_NOT_FOUND
          ├─ code 23505 ──► errors.mjs → 409 DUPLICATE_ENTRY
          ├─ code 23514 ──► errors.mjs → 400 VALIDATION_FAILED
          └─ default   ──► errors.mjs → 500 DATABASE_ERROR
          │
          ▼
   ResponseBuilder → { success, message, timestamp, request_id, data? }
```

---

## File Changes

> Base path: `develop/backend/gooderp-orchestation/lib/lambda/inventario/`

### All 11 lambdas — `utils/sanitization.mjs`

| File | Action | Description |
|------|--------|-------------|
| `fn*/utils/sanitization.mjs` | Modify | Replace with 4-priority chain from `fnTransaccionLineas`. Remove `NODE_ENV` + `x-tenant-id` block. Add P3 (body when `requestContext` present but no authorizer) and P4 (body when no `requestContext`). |

**Affected** (NODE_ENV removal + P3/P4): fnAjusteInventario, fnEntradaInventario, fnReservaInventario, fnSalidaInventario, fnTrasladoInventario  
**Affected** (P3/P4 addition only): fnInventario, fnLiberarReservasExpiradas, fnListaPrecio, fnMovimientoInventario, fnProducto, fnVarianteProducto

### 6 lambdas — `constants/errors.mjs` (new file)

| File | Action | Description |
|------|--------|-------------|
| `fnAjusteInventario/constants/errors.mjs` | Create | PG→HTTP map + `ERROR_CODES` + `ERROR_MESSAGES` (inventario domain) |
| `fnEntradaInventario/constants/errors.mjs` | Create | same |
| `fnReservaInventario/constants/errors.mjs` | Create | same |
| `fnSalidaInventario/constants/errors.mjs` | Create | same |
| `fnTrasladoInventario/constants/errors.mjs` | Create | same |
| `fnLiberarReservasExpiradas/constants/errors.mjs` | Create | same |

Lambdas already having domain `*Constants.mjs` (fnInventario, fnListaPrecio, fnMovimientoInventario, fnProducto, fnVarianteProducto) also receive `constants/errors.mjs` as a separate file.

> **Total new files**: 11 (one per lambda)

### 2 lambdas — `index.mjs` routing block

| File | Action | Description |
|------|--------|-------------|
| `fnReservaInventario/index.mjs` | Modify | Replace `path.includes('/confirmar')` and `path.includes('/cancelar')` guards with `lastSegment` extraction before the method `switch`. |
| `fnTrasladoInventario/index.mjs` | Modify | Replace `path.includes('/confirmar-recepcion')` guard with `lastSegment` extraction. |

### 4 lambdas — `index.mjs` global reference

| File | Action | Description |
|------|--------|-------------|
| `fnAjusteInventario/index.mjs` | Modify | `global.requestStartTime` → `globalThis.requestStartTime` |
| `fnEntradaInventario/index.mjs` | Modify | same |
| `fnInventario/index.mjs` | Modify | same |
| `fnMovimientoInventario/index.mjs` | Modify | same |
| `fnProducto/index.mjs` | Modify | same |

> fnSalidaInventario, fnReservaInventario, fnTrasladoInventario, fnVarianteProducto, fnLiberarReservasExpiradas, fnListaPrecio already use `globalThis` — no change needed.

### `utils/responseBuilder.mjs` — audit only

All 11 lambdas already include `request_id`, `timestamp`, and a JSON body on
OPTIONS via `handleCorsPreFlight`. No structural changes needed. The design
confirms compliance during the tasks pass; if a gap is found, modify the
specific lambda's `responseBuilder.mjs`.

---

## Interfaces / Contracts

### `extractTenantId` — canonical signature (all 11)

```js
// utils/sanitization.mjs
export const extractTenantId = (event) => {
  // P1: API Gateway + Cognito authorizer claims
  if (event.requestContext?.authorizer?.claims?.['custom:tenant_id'])
    return event.requestContext.authorizer.claims['custom:tenant_id'];

  // P2: HTTP API / Bearer token decode
  if (event.requestContext?.authorizer?.jwt?.claims?.['custom:tenant_id'])
    return event.requestContext.authorizer.jwt.claims['custom:tenant_id'];

  // P3: Step Functions — requestContext present, no authorizer
  if (event.requestContext && !event.requestContext.authorizer && event.body) {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (body.tenant_id) return body.tenant_id;
  }

  // P4: Direct Lambda invocation — no requestContext at all
  if (!event.requestContext && event.body) {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (body.tenant_id) return body.tenant_id;
  }

  return null;
};
```

### `constants/errors.mjs` — standard shape

```js
export const PG_ERROR_MAP = {
  '23503': { status: 404, code: 'REFERENCE_NOT_FOUND' },
  '23505': { status: 409, code: 'DUPLICATE_ENTRY'     },
  '23514': { status: 400, code: 'VALIDATION_FAILED'   },
  '42P01': { status: 500, code: 'TABLE_NOT_FOUND'     },
};
export const DEFAULT_DB_ERROR = { status: 500, code: 'DATABASE_ERROR' };
```

### `lastSegment` routing block (fnReservaInventario / fnTrasladoInventario)

```js
// Replaces path.includes() guards in index.mjs
const pathSegments = (event.path || '').split('/').filter(Boolean);
const lastSegment  = pathSegments[pathSegments.length - 1] ?? '';

if (httpMethod === 'POST' && reservaId && lastSegment === 'confirmar')
  return await confirmarHandler(event);
if (httpMethod === 'POST' && reservaId && lastSegment === 'cancelar')
  return await cancelarHandler(event);
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — sanitization | P1–P4 each return correct tenant; NODE_ENV bypass absent; null on all-absent | Jest, mock event shapes |
| Unit — errors.mjs | PG codes map to correct HTTP status + code string | Jest, direct import |
| Integration — index.mjs | OPTIONS → 200 with JSON body; unknown path → 404; PG 23505 → 409; Step Functions body tenant → 200 | Jest, synthetic Lambda events |
| Integration — routing | POST `/{id}/confirmar` → confirmarHandler; POST `/{id}/confirmar-recepcion` does NOT dispatch to confirmarHandler in fnReserva | Jest, mock handlers |

Test files: `fn*/tests/sanitization.test.mjs`, `fn*/tests/index.integration.test.mjs`

---

## Migration / Rollout

No database schema changes. No API contract changes (all endpoints unchanged).
Changes are isolated to three file types per lambda. Deploy order:
1. Lambdas with no sub-action routing (9 lambdas) — parallel deployment safe.
2. `fnReservaInventario` and `fnTrasladoInventario` — deploy after routing tests pass.
3. Produce `EVIDENCE.md` certifying all 5 REQ checks.

Rollback: `git revert` of branch; no compensating migrations required.

---

## Open Questions

- None — all decisions resolved by existing AGENTS.md canon and `fnTransaccionLineas` reference.

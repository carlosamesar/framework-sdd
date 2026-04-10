# Design: fnMovimientoInventario Lambda Architecture

## Technical Approach

Full CRUD Lambda following mature patterns:
- 7 separate handlers in `handlers/` directory
- Router in `index.mjs` with exact lastSegment matching
- `MovimientoInventarioDatabase` class for atomic DB operations
- `MovimientoInventarioValidator` for business rule validation
- Connection pooling via `pg.Pool` singleton
- Transaction handling for atomic inventory updates

## Arquitectura

```
fnMovimientoInventario/
├── index.mjs                    # Router + CORS + tenant extraction
├── handlers/                    # 7 handlers
│   ├── createMovimientoInventario.mjs
│   ├── getMovimientoInventarioById.mjs
│   ├── getMovimientoInventarios.mjs
│   ├── updateMovimientoInventario.mjs
│   ├── deleteMovimientoInventario.mjs
│   ├── searchMovimientoInventarios.mjs
│   └── getMovimientoInventariosAnalytics.mjs
├── utils/
│   ├── database.mjs             # Atomic inventory operations
│   ├── validation.mjs           # Business rules
│   ├── responseBuilder.mjs      # Standard responses
│   └── sanitization.mjs         # extractTenantId + sanitize
├── constants/
│   ├── errors.mjs               # PG error mapping
│   └── movimientoinventarioConstants.mjs
└── tests/
    ├── routing.test.mjs         # 14 tests
    ├── validation.test.mjs      # 38 tests
    ├── sanitization.test.mjs    # 14 tests
    └── handler.test.mjs         # Handler tests (mocked)
```

## Data Flow (CREATE)

```
POST /movimientos-inventario
    ↓
extractTenantId (P1→P4) → sanitizeRequest
    ↓
validateCreateData() → UUID, tipo_movimiento, cantidad, optional fields
    ↓
createMovimientoInventario(tenantId, data)
    ├── BEGIN transaction
    ├── Validate bodega exists (id_tenant filter)
    ├── Validate producto exists (id_tenant filter)
    ├── Validate variante (if provided)
    ├── Get current inventory (bodega + variante + tenant)
    ├── Calculate new quantity:
    │   - ENTRADA/AJUSTE_ENTRADA/TRASLADO_ENTRADA: +cantidad
    │   - SALIDA/AJUSTE_SALIDA/TRASLADO_SALIDA: -cantidad (validate >= 0)
    ├── UPDATE inventario OR INSERT (if ENTRADA and no record)
    ├── INSERT movimientos_inventario
    ├── COMMIT / ROLLBACK on error
    ↓
Return 201 created
```

## Architecture Decisions

### 1. Atomic inventory tracking
- **Choice**: BEGIN/COMMIT/ROLLBACK for each create operation
- **Rationale**: Prevents partial updates that would corrupt inventory

### 2. Stock validation in database layer
- **Choice**: Validate stock in DB query, not in handler
- **Rationale**: Single source of truth, prevents race conditions

### 3. Delete NOT allowed
- **Choice**: Throw error "Use ajustes para corregir"
- **Rationale**: Audit trail integrity

### 4. Update limited to observacion/referencia only
- **Choice**: Validator rejects changes to bodega/producto/tipo/cantidad
- **Rationale**: Historical accuracy, use adjustments for corrections

### 5. Inventory tracked by bodega + variante (not producto)
- **Choice**: `WHERE id_bodega = $1 AND id_variante IS NOT DISTINCT FROM $2`
- **Rationale**: Same product can have multiple variants with different stock

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `tests/routing.test.mjs` | Created | 14 routing tests |
| `tests/validation.test.mjs` | Created | 38 validation tests |
| `tests/handler.test.mjs` | Created | Handler tests (mocked) |
| `CONSUMO.md` | Created | Complete certification report |
| `package.json` | Updated | Changed from jest to node:test |

## Contrato HTTP

| Method | Path | Success | Error |
|--------|------|---------|-------|
| POST | `/movimientos-inventario` | 201 | 400 (validation/stock) |
| GET | `/movimientos-inventario` | 200 + pagination | 401 |
| GET | `/movimientos-inventario/{id}` | 200 + joins | 404 |
| PUT | `/movimientos-inventario/{id}` | 200 | 400 (forbidden fields) |
| DELETE | `/movimientos-inventario/{id}` | 400 (not allowed) | — |
| GET | `/movimientos-inventario/search` | 200 + filters | 401 |
| GET | `/movimientos-inventario/analytics` | 200 + aggregates | 401 |
| OPTIONS | `/movimientos-inventario` | 204 | — |

## Consideraciones de Seguridad (OWASP)

| OWASP | Status | Notes |
|-------|--------|-------|
| A01: Broken Access Control | ✅ Secure | Multi-tenant via JWT, no header bypass |
| A03: Injection | ✅ Secure | Parameterized queries, input sanitization |
| A05: Security Misconfiguration | ✅ Secure | CORS configured, JWT validation |
| A07: Auth Failures | ✅ Secure | Cognito authorizer, 401 without tenant |

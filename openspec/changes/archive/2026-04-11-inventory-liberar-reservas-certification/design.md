# Design: fnLiberarReservasExpiradas Lambda Architecture

## Technical Approach

Scheduled Lambda (EventBridge-triggered) following the pattern:
- Single handler in `index.mjs` (no HTTP routing, no API Gateway)
- `LiberarReservasDatabase` class in `utils/database.mjs` for DB operations
- Connection pooling via `pg.Pool` singleton
- Transaction handling (BEGIN/COMMIT/ROLLBACK) for atomicity

## Arquitectura General

```
fnLiberarReservasExpiradas/
├── index.mjs                    # EventBridge handler (single entry point)
├── lambda.config.json           # Deployment config
├── utils/
│   ├── database.mjs             # LiberarReservasDatabase class + pool
│   └── sanitization.mjs         # extractTenantId (P1→P4, present but not used)
├── constants/
│   └── errors.mjs               # PostgreSQL error mapping
└── tests/
    ├── sanitization.test.mjs    # 14 tests
    ├── handler.test.mjs         # 9 tests (mocked DB)
    └── database.test.mjs        # 10 tests (integration, requires live DB)
```

## Data Flow

```
EventBridge (every 1 min)
    ↓
handler(event)
    ↓
LiberarReservasDatabase.liberarReservasExpiradas()
    ├── BEGIN transaction
    ├── UPDATE transacciones SET id_estado=EXPIRADO
    │   WHERE tipo=RESERVA_INV AND estado=APROBADO AND fecha_expiracion <= NOW()
    ├── RETURNING updated rows
    ├── COMMIT / ROLLBACK on error
    ↓
LiberarReservasDatabase.getEstadisticasReservas()
    ├── SELECT estado, COUNT(*), expiradas, vigentes
    │   FROM transacciones JOIN tipos_transaccion JOIN estados
    │   WHERE tipo=RESERVA_INV GROUP BY estado
    ↓
Return { success, reservas_liberadas, detalles, estadisticas, duracion_ms }
```

## Architecture Decisions

### 1. Single handler (no router)
- **Choice**: All logic in single `handler()` function
- **Alternatives**: Router pattern like `fnReservaInventario`, separate handlers
- **Rationale**: EventBridge only sends one event type. No HTTP methods or paths to route.

### 2. Database query uses FK subqueries
- **Choice**: `id_estado = (SELECT id_estado FROM estados WHERE nombre = 'APROBADO')`
- **Alternatives**: JOIN with `estados` table in UPDATE, hardcode estado UUID
- **Rationale**: Subquery is self-contained and readable. Avoids hardcoding UUIDs. JOIN in UPDATE is more complex in PostgreSQL.

### 3. Transaction handling
- **Choice**: BEGIN/COMMIT/ROLLBACK in `liberarReservasExpiradas()`
- **Alternatives**: No transaction (auto-commit per row)
- **Rationale**: Atomicity ensures either all expired reservations are updated or none (on error). Prevents partial updates.

### 4. No tenant filtering
- **Choice**: Process ALL tenants in single run
- **Alternatives**: Per-tenant processing, batch by tenant
- **Rationale**: Expiration is time-based, tenant-agnostic. All tenants share same `RESERVA_INV` type. Single query is more efficient.

### 5. Statistics query runs after update
- **Choice**: Call `getEstadisticasReservas()` after expiration to include updated counts
- **Alternatives**: Stats before update, skip stats entirely
- **Rationale**: Post-update stats reflect the actual state after expiration, useful for monitoring.

## Bug Discovered via TDD

### `t.estado` column doesn't exist

**Root cause**: The `transacciones` table uses `id_estado` (UUID FK to `estados` table), not a text `estado` column.

**Impact**: Both queries in `database.mjs` failed with `column "estado" does not exist`.

**Fix**:
```sql
-- BEFORE (broken):
WHERE t.estado = 'APROBADO'
SET estado = 'EXPIRADO'

-- AFTER (fixed):
WHERE t.id_estado = (SELECT id_estado FROM estados WHERE nombre = 'APROBADO')
SET id_estado = (SELECT id_estado FROM estados WHERE nombre = 'EXPIRADO')
```

**Same fix for statistics**:
```sql
-- BEFORE:
SELECT t.estado, COUNT(*) ... GROUP BY t.estado

-- AFTER:
SELECT te.nombre as estado, COUNT(*) ...
LEFT JOIN estados te ON t.id_estado = te.id_estado
GROUP BY te.nombre
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `utils/database.mjs` | Fixed | Changed `t.estado` → `id_estado` FK subqueries in both queries |
| `tests/handler.test.mjs` | Created | 9 handler tests with mocked DB |
| `tests/database.test.mjs` | Created | 10 DB integration tests (corrected for schema) |
| `tests/sanitization.test.mjs` | Verified | 14 existing tests passing |
| `CONSUMO.md` | Created | Complete certification report |
| `package.json` | Updated | Added `test` script |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Tenant extraction | Test P1→P4 priority chain + security bypass |
| Unit | Handler flow | Mock DB methods, verify EventBridge event processing |
| Unit | Error handling | Mock DB failures, verify 500 responses |
| Unit | Response shape | Verify success and error response structures |
| Integration | DB queries | Live PostgreSQL required (tests written and corrected) |

## Migration / Rollout

- **No schema migration needed**: Uses existing tables and FK relationships
- **Deployment**: Via ZIP to AWS Lambda
- **EventBridge**: Requires rule configured for `rate(1 minute)`
- **Rollback**: Disable EventBridge rule, revert `database.mjs` if needed

## Open Questions

- [ ] EventBridge rule name and configuration in AWS Console
- [ ] CloudWatch alarm for monitoring expiration job failures
- [ ] Performance impact on large datasets (thousands of expired reservations)

## Contrato de Respuesta (EventBridge)

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "message": "Proceso de liberación de reservas completado",
    "reservas_liberadas": 2,
    "detalles": [
      { "numero_documento": "RES-000001", "tenant": "uuid-1", "fecha_expiracion": "..." }
    ],
    "estadisticas": [
      { "estado": "APROBADO", "total": "5", "expiradas": "0", "vigentes": "5" },
      { "estado": "EXPIRADO", "total": "7", "expiradas": "7", "vigentes": "0" }
    ],
    "duracion_ms": 42,
    "timestamp": "2026-04-11T12:00:00.042Z"
  }
}
```

### Error Response
```json
{
  "statusCode": 500,
  "body": {
    "success": false,
    "message": "Error al liberar reservas expiradas",
    "error": "Database connection failed",
    "timestamp": "2026-04-11T12:00:00.042Z"
  }
}
```

## Consideraciones de Seguridad (OWASP)

| OWASP | Status | Notes |
|-------|--------|-------|
| A01: Broken Access Control | ✅ N/A | System-triggered, no user access |
| A03: Injection | ✅ Secure | Parameterized queries, no user input |
| A07: Auth Failures | ✅ N/A | No authentication required (EventBridge) |
| A09: Logging | ✅ Secure | CloudWatch logs for debugging |

## Deviations from Spec

None. This is a certification of existing implementation. The bug fix (`t.estado` → `id_estado`) is documented as a TDD discovery.

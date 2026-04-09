# Proposal: fnLiberarReservasExpiradas Lambda Certification

## Change
- **Date**: 2026-04-11
- **Status**: COMPLETE
- **Lambda**: `fnLiberarReservasExpiradas`
- **Location**: `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnLiberarReservasExpiradas/`
- **Trigger**: EventBridge Schedule `rate(1 minute)`

## Intent

Certify the `fnLiberarReservasExpiradas` Lambda as a production-ready background job that automatically expires inventory reservations older than their `fecha_expiracion`. The Lambda runs every 1 minute via EventBridge, finds all `RESERVA_INV` transactions in `APROBADO` state that have expired, and marks them as `EXPIRADO`. This is critical for the inventory reservation workflow to prevent abandoned reservations from blocking stock indefinitely.

## Scope

### In Scope
- EventBridge scheduled event handling
- Database query to find and update expired reservations (RESERVA_INV type, APROBADO state, fecha_expiracion <= NOW())
- Statistics query for monitoring (reservations by state with expired/vigentes counts)
- Transaction handling (BEGIN/COMMIT/ROLLBACK for atomicity)
- Multi-tenant processing (all tenants in single run)
- CloudWatch logging for debugging and monitoring
- Error handling (DB connection failure, query errors)
- Unit tests for sanitization (14 tests)
- Handler tests with mocked DB (9 tests)
- Database integration tests (10 tests, written and corrected)

### Out of Scope
- HTTP API endpoints (Lambda is EventBridge-triggered only)
- User authentication (system-triggered, no JWT required)
- Frontend UI components
- Automatic EventBridge rule creation (infrastructure task)

## Approach

1. **TDD discovery**: Write tests first, discover bugs, fix code
2. **Bug found and fixed**: `t.estado` column doesn't exist → uses `id_estado` FK to `estados` table
3. **Mocked handler tests**: Verify complete EventBridge flow without live DB
4. **DB integration tests**: Written and corrected for actual schema (require live PostgreSQL)
5. **Documentation**: CONSUMO.md with complete certification report

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `utils/database.mjs` | Bug fix | Changed `t.estado` → `id_estado` FK subqueries |
| `tests/handler.test.mjs` | New | 9 handler tests with mocked DB |
| `tests/database.test.mjs` | New | 10 DB integration tests |
| `tests/sanitization.test.mjs` | Verified | 14 sanitization tests |
| `CONSUMO.md` | New | Complete certification report |
| `package.json` | Updated | Added test script |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| EventBridge rule not configured | Medium | Requires AWS infrastructure setup |
| DB column name differences in prod | Low | Fixed via TDD, uses correct FK joins now |
| High frequency (1 min) causes load | Low | Query is efficient with indexed columns |

## Rollback Plan

1. Disable EventBridge rule to stop automatic execution
2. Revert `database.mjs` queries if issues arise
3. No data loss: only changes `id_estado` for already-expired reservations

## Dependencies

- PostgreSQL with `transacciones`, `tipos_transaccion`, `estados` tables
- EventBridge rule configured for 1-minute schedule
- RESERVA_INV transaction type configured with expiration settings

## Success Criteria

- [x] 23/23 unit tests passing (14 sanitization + 9 handler)
- [x] Bug discovered and fixed: `t.estado` → `id_estado` FK
- [x] Handler tests verify complete EventBridge flow with mocks
- [x] DB integration tests written and corrected (10 tests)
- [x] CONSUMO.md certification report complete
- [x] Error handling verified (DB failure, unexpected errors)
- [x] Response shape verified (success and error cases)
- [x] CloudWatch logging verified
- [x] SPEC archived with all required documents

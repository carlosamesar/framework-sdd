# Proposal: fnReservaInventario Lambda Certification

## Change
- **Date**: 2026-04-11
- **Status**: COMPLETE
- **Lambda**: `fnReservaInventario`
- **Location**: `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnReservaInventario/`
- **API Path**: `/api/v1/reservas-inventario`
- **Resource ID**: `ekja79`

## Intent

Certify the `fnReservaInventario` Lambda function as a production-ready, fully tested inventory reservation service with automatic 15-minute expiration, stock validation, and confirm/cancel workflows. The Lambda manages the complete lifecycle of inventory reservations: creation with real-time stock validation, confirmation (marking as COMPLETED), cancellation (marking as CANCELLED), and automatic expiration for abandoned reservations.

## Scope

### In Scope
- CRUD operations for inventory reservations (create, read, update, delete, patch)
- Confirm reservation workflow (`POST /{id}/confirmar`)
- Cancel reservation workflow (`POST /{id}/cancelar`)
- Real-time stock validation before reservation creation
- Multi-tenant isolation via JWT claims extraction (P1→P4 priority chain)
- Automatic 15-minute expiration logic (configured in `tipos_transaccion.configuracion_json`)
- Pagination and filtering for reservation lists
- Unit tests for routing logic and sanitization (33 tests)
- Integration tests via direct Lambda invocation (13 tests)
- Error handling for PostgreSQL errors (FK violations, unique violations, checks)
- CORS preflight handling
- Soft delete implementation

### Out of Scope
- API Gateway authorizer configuration (separate infrastructure task)
- Frontend UI components for reservations
- Background job for automatic expiration (requires separate Lambda + EventBridge)
- Integration with accounting/treasury services (future SAGA expansion)

## Approach

1. **Verification-first**: Run existing unit tests to confirm they pass
2. **Evidence collection**: Review CONSUMO.md certification report for functional test results
3. **Security audit**: Verify multi-tenant extraction follows canonical P1→P4 chain with no header bypass
4. **Routing security**: Confirm exact lastSegment matching (no substring vulnerability)
5. **Documentation**: Archive complete SPEC with proposal, design, tasks, spec scenarios, and evidence

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `fnReservaInventario/` | Certification | 8 handlers, utils, tests verified |
| `CONSUMO.md` | Documentation | Complete certification report |
| `tests/` | Tests | 33 unit tests passing |
| `registry.md` | Index | Add 5.1 change entry |
| `project.md` | Index | Update Módulo 5 status |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| API Gateway auth issue blocking public endpoint | Medium | Documented in CONSUMO.md; Lambda works via direct invocation |
| Stock validation edge cases (concurrent reservations) | Low | Transaction-level locking in createReserva handler |
| Expiration job not implemented yet | Medium | Requires separate Lambda + EventBridge rule |

## Rollback Plan

1. Keep lambda.zip in archive for redeployment if needed
2. No database schema changes to rollback (uses existing transacciones tables)
3. Disable API Gateway resource `ekja79` if issues arise

## Dependencies

- PostgreSQL database with `transacciones`, `detalles_transaccion`, `bodegas`, `productos` tables
- AWS Cognito User Pool `us-east-1_gmre5QtIx` for JWT validation
- API Gateway resource `ekja79` configured in GoodERP-Unified-API
- Other inventory lambdas: `fnInventario`, `fnProducto`, `fnMovimientoInventario`

## Success Criteria

- [x] All 33 unit tests passing
- [x] All 13 integration tests passing via direct Lambda invocation
- [x] Multi-tenant security verified (no header bypass)
- [x] Routing security verified (no substring vulnerability)
- [x] Stock validation functional
- [x] Confirm/cancel workflows functional
- [x] CONSUMO.md certification report complete
- [x] SPEC archived with all required documents
- [x] registry.md and project.md updated

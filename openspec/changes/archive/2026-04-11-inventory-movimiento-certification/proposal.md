# Proposal: fnMovimientoInventario Lambda Certification

## Change
- **Date**: 2026-04-11
- **Status**: COMPLETE
- **Lambda**: `fnMovimientoInventario`
- **Location**: `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnMovimientoInventario/`
- **API Path**: `/api/v1/movimientos-inventario`

## Intent

Certify `fnMovimientoInventario` as a production-ready inventory movement management Lambda with 7 endpoints (CRUD + search + analytics), 6 movement types (ENTRADA, SALIDA, AJUSTE_ENTRADA, AJUSTE_SALIDA, TRASLADO_ENTRADA, TRASLADO_SALIDA), real-time stock validation, atomic inventory updates, and multi-tenant isolation via JWT claims.

## Scope

### In Scope
- 7 HTTP endpoints (POST, GET, GET/{id}, PUT/{id}, DELETE/{id}, /search, /analytics)
- 6 movement types with stock impact logic
- Real-time stock validation (SALIDA, AJUSTE_SALIDA, TRASLADO_SALIDA reject if insufficient stock)
- Atomic inventory updates (BEGIN/COMMIT/ROLLBACK)
- Multi-tenant via JWT (P1→P4)
- CORS preflight
- Validation (UUID, cantidad, tipo_movimiento, optional fields)
- Routing security (exact lastSegment matching)
- Unit tests: routing (14), validation (38), sanitization (14)

### Out of Scope
- Database integration tests (require live PostgreSQL)
- E2E tests with real stock data
- Frontend UI components

## Approach

1. **TDD**: Write tests first for routing, validation, sanitization
2. **Mocked handlers**: Test each handler independently (ESM limitations)
3. **Security audit**: Verify multi-tenant, no header bypass
4. **Documentation**: CONSUMO.md with complete certification

## Success Criteria

- [x] 66/66 unit tests passing (routing + validation + sanitization)
- [x] 7 endpoints certified via handler tests
- [x] 6 movement types validated
- [x] Multi-tenant security verified
- [x] CONSUMO.md complete
- [x] SPEC archived

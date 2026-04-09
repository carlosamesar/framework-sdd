# Design: fnReservaInventario Lambda Architecture

## Technical Approach

Lambda Node.js 20.x ESM following the mature pattern from `fnTransaccionLineas` and `fnTransaccion`:
- Router-based architecture with `index.mjs` centralizing CORS, tenant extraction, and routing
- Separate handlers per operation (8 handlers total)
- Shared utilities: `database.mjs` (PostgreSQL pool), `sanitization.mjs` (tenant extraction), `responseBuilder.mjs` (standard responses)
- Multi-tenant via JWT claims extraction with P1→P4 priority chain
- Real-time stock validation before reservation creation
- Automatic 15-minute expiration via transaction type configuration

## Arquitectura General

```
fnReservaInventario/
├── index.mjs                    # Router principal
├── lambda.config.json           # Deployment config
├── handlers/
│   ├── createReserva.mjs        # POST /reservas-inventario
│   ├── getReservas.mjs          # GET /reservas-inventario
│   ├── getReservaById.mjs       # GET /reservas-inventario/{id}
│   ├── confirmarReserva.mjs     # POST /reservas-inventario/{id}/confirmar
│   ├── cancelarReserva.mjs      # POST /reservas-inventario/{id}/cancelar
│   ├── updateReserva.mjs        # PUT /reservas-inventario/{id}
│   ├── deleteReserva.mjs        # DELETE /reservas-inventario/{id}
│   └── patchReserva.mjs         # PATCH /reservas-inventario/{id}
├── utils/
│   ├── database.mjs             # PostgreSQL pool + queries
│   ├── sanitization.mjs         # extractTenantId (P1→P4)
│   └── responseBuilder.mjs      # Standard response format
├── constants/
│   └── (error codes, states)
└── tests/
    ├── routing.test.mjs         # 18 routing tests
    └── sanitization.test.mjs    # 15 sanitization tests
```

## Data Flow

1. **Create Reservation**:
   ```
   Request → CORS → extractTenantId (P1→P4) → validation → 
   stock check → create transaccion → create detalles → return 201
   ```

2. **Confirm Reservation**:
   ```
   Request → CORS → extractTenantId → get reserva by ID → 
   validate state → update estado to COMPLETADO → decrement stock → return 200
   ```

3. **Cancel Reservation**:
   ```
   Request → CORS → extractTenantId → get reserva by ID → 
   validate state → update estado to CANCELADO → release stock → return 200
   ```

## Architecture Decisions

### 1. Routing: Exact lastSegment matching
- **Choice**: Use `pathSegments.at(-1) === 'confirmar'` instead of `path.includes('/confirmar')`
- **Alternatives**: substring matching, regex, path-to-regexp
- **Rationale**: Prevents routing collision with paths like `/confirmar-foo` or `/cancelar-extended`. Security fix applied per REQ-04.

### 2. Multi-tenant: JWT claims only
- **Choice**: Extract `custom:tenant_id` from JWT claims with P1→P4 priority chain
- **Alternatives**: Header `x-tenant-id` in dev mode, query param, body field
- **Rationale**: Security requirement. No bypass allowed even in development. P1: REST authorizer, P2: JWT authorizer, P3: Step Functions body, P4: Direct invocation body.

### 3. Stock Validation: Real-time at creation
- **Choice**: Validate `stock_disponible = stock_fisico - cantidad_reservada >= cantidad_solicitada`
- **Alternatives**: Async validation, optimistic creation with compensation SAGA
- **Rationale**: Immediate feedback to user. Prevents over-reservation.

### 4. Expiration: 15-minute automatic
- **Choice**: Configuration in `tipos_transaccion.configuracion_json` with `fecha_expiracion = fecha_emision + 15min`
- **Alternatives**: Hard-coded timeout, separate expiration Lambda
- **Rationale**: Configurable per tenant. Requires background job (future work).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `index.mjs` | Verified | Router with exact lastSegment matching |
| `handlers/createReserva.mjs` | Verified | Stock validation + transaccion creation |
| `handlers/getReservas.mjs` | Verified | List with filters + pagination |
| `handlers/getReservaById.mjs` | Verified | Get single reservation |
| `handlers/confirmarReserva.mjs` | Verified | Confirm + stock decrement |
| `handlers/cancelarReserva.mjs` | Verified | Cancel + stock release |
| `handlers/updateReserva.mjs` | Verified | Update observation |
| `handlers/deleteReserva.mjs` | Verified | Soft delete |
| `handlers/patchReserva.mjs` | Verified | Partial update |
| `utils/sanitization.mjs` | Verified | extractTenantId P1→P4 |
| `utils/responseBuilder.mjs` | Verified | Standard responses |
| `utils/database.mjs` | Verified | Pool + queries (t.estado fix applied) |
| `tests/routing.test.mjs` | Verified | 18 routing tests |
| `tests/sanitization.test.mjs` | Verified | 15 sanitization tests |
| `CONSUMO.md` | Reviewed | Complete certification report |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Routing logic | Mock handlers, verify dispatch decisions |
| Unit | Tenant extraction | Test P1→P4 priority chain + security bypass |
| Integration | All 10 endpoints | Direct Lambda invocation with simulated API Gateway events |
| Functional | Stock validation | Create with insufficient stock → 400 |
| Functional | Confirm workflow | POST /{id}/confirmar → COMPLETADO |
| Functional | Cancel workflow | POST /{id}/cancelar → CANCELADO |
| Functional | Error handling | Bodega not found → 404, validation errors → 400 |

## Migration / Rollout

- **No database migration required**: Uses existing `transacciones`, `detalles_transaccion`, `bodegas`, `productos` tables
- **Deployment**: Via ZIP to AWS Lambda (lambda.zip already generated)
- **Rollback**: Keep lambda.zip archive, disable API Gateway resource if needed

## Open Questions

- [ ] Background Lambda for automatic expiration (EventBridge rule every minute?)
- [ ] API Gateway authorizer fix for public endpoint access
- [ ] Integration with SAGA orchestr for cross-service reservations

## Contrato HTTP Final

| Method | Path | Status Codes | Description |
|--------|------|--------------|-------------|
| GET | `/reservas-inventario` | 200, 400 | List with filters |
| GET | `/reservas-inventario/{id}` | 200, 404 | Get by ID |
| POST | `/reservas-inventario` | 201, 400 | Create (validates stock) |
| POST | `/reservas-inventario/{id}/confirmar` | 200, 400 | Confirm reservation |
| POST | `/reservas-inventario/{id}/cancelar` | 200, 400 | Cancel reservation |
| PUT | `/reservas-inventario/{id}` | 200, 404 | Update observation |
| DELETE | `/reservas-inventario/{id}` | 200, 404 | Soft delete |
| PATCH | `/reservas-inventario/{id}` | 200, 404 | Partial update |
| OPTIONS | `/reservas-inventario` | 200 | CORS preflight |

## Consideraciones de Seguridad (OWASP)

| OWASP | Status | Notes |
|-------|--------|-------|
| A01: Broken Access Control | ✅ Secure | Multi-tenant via JWT, no header bypass |
| A02: Cryptographic Failures | ✅ Secure | JWT signature validated by API Gateway |
| A03: Injection | ✅ Secure | Parameterized queries in database.mjs |
| A04: Insecure Design | ✅ Secure | Stock validation prevents over-reservation |
| A05: Security Misconfiguration | ⚠️ Warning | API Gateway auth issue (documented) |
| A06: Vulnerable Components | ✅ Secure | Node.js 20.x, updated dependencies |
| A07: Auth Failures | ⚠️ Warning | API Gateway layer, not Lambda |
| A08: Data Integrity Failures | ✅ Secure | Transaction-level consistency |
| A09: Logging Failures | ✅ Secure | console.log for tenant/user actions |
| A10: SSRF | ✅ Secure | No external HTTP calls |

## Deviations from Spec

None. This is a certification of existing implementation, not a new design.

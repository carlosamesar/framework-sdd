# Archive Report: Fix 5xx/4xx errors in Stock Availability API

## Goal
Fix 5xx/4xx errors in the Stock Availability API when consuming the endpoint with specific parameters from the frontend.

## Instructions
- Use `fnStockAvailability` Lambda.
- Handle `id_producto` and `id_bodega` parameters.
- Ensure CORS compatibility.

## Discoveries
- The API Gateway uses the path `/api/v1/stock-disponibilidad`.
- The Lambda router was missing an explicit case for `/stock/availability`.
- Parameter naming was inconsistent between the frontend (snake_case with 'id_') and backend (camelCase).
- Sending an empty `id_producto` was likely causing unhandled database errors (5xx).

## Accomplished
- **Router Update**: Modified `index.mjs` to explicitly support `/stock/availability`.
- **Parameter Normalization**: Updated `getStockByWarehouse.mjs` to support `id_producto`, `id_bodega`, and `id_sucursal`.
- **Validation**: Verified that the Lambda now returns a 400 Bad Request instead of a 5xx when mandatory parameters are missing or invalid.
- **API Gateway Audit**: Confirmed `/api/v1/stock-disponibilidad` exists and `OPTIONS` has `authorizationType: NONE`.

## Next Steps
- Monitor logs in CloudWatch for the next production requests to ensure the 400 error is handled gracefully by the frontend.

## Relevant Files
- `develop/backend/gooderp-orchestation/lib/lambda/functionsConfiguration/fnStockAvailability/index.mjs`
- `develop/backend/gooderp-orchestation/lib/lambda/functionsConfiguration/fnStockAvailability/handlers/getStockByWarehouse.mjs`

## Archive Verification
- [x] Change details documented
- [x] Implementation verified
- [x] Session summary created
- [x] SDD cycle complete

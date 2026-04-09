# EVIDENCE.md - Delete All Transactions Script

## Task
Create SQL script to delete all transactions from `public.transacciones` considering all FK relationships, executed via NodeJS.

## Execution Date
2026-04-09

## Files Created

| File | Purpose |
|------|---------|
| `scripts/delete-all-transacciones.sql` | SQL script with proper FK cascade deletion order |
| `scripts/execute-delete-transacciones.mjs` | NodeJS executor with SSL, error handling, and verification |
| `scripts/find-fk-constraints.sql` | Helper to discover FK constraints (used during development) |
| `rag/scripts/verify-transacciones-deleted.mjs` | Verification script to confirm tables are empty |

## Tables Affected (11 total)

All FK constraints referencing `public.transacciones` were discovered and handled:

| # | Table | FK Column | Constraint Name | Status |
|---|-------|-----------|-----------------|--------|
| 1 | `transacciones` | `id_transaccion_base` | self-referencing | ✅ Cleared (SET NULL then DELETE) |
| 2 | `asientos_contables_encabezado` | `id_transaccion` | `fk_asiento_transaccion` | ✅ Deleted |
| 3 | `aplicaciones_anticipo` | `id_transaccion` | `fk_aplicaciones_anticipo_transaccion` | ✅ Deleted |
| 4 | `log_eventos_transaccion` | `id_transaccion` | `fk_log_eventos_transaccion` | ✅ Deleted |
| 5 | `movimientos_cartera` | `id_transaccion` | `fk_movcartera_transaccion` | ✅ Deleted |
| 6 | `pagos_transaccion` | `id_transaccion` | `fk_pago_transaccion` | ✅ Deleted |
| 7 | `retenciones_transaccion` | `id_transaccion` | `retenciones_transaccion_id_transaccion_fkey` | ✅ Deleted |
| 8 | `transaccion_complemento` | `id_transaccion` | `fk_transaccion_complemento_transaccion` | ✅ Deleted |
| 9 | `transaccion_impuesto` | `id_transaccion` | `fk_transaccion_impuesto_transaccion` | ✅ Deleted |
| 10 | `valores_campos_personalizados_transaccion` | `id_transaccion` | `fk_valores_campos_transaccion` | ✅ Deleted |
| 11 | `saga_eventos` | `id_transaccion` | (implicit) | ✅ Deleted |

## Verification Results

```
✅ public.transacciones: 0 records
✅ public.asientos_contables_encabezado: 0 records
✅ public.aplicaciones_anticipo: 0 records
✅ public.log_eventos_transaccion: 0 records
✅ public.movimientos_cartera: 0 records
✅ public.pagos_transaccion: 0 records
✅ public.retenciones_transaccion: 0 records
✅ public.transaccion_complemento: 0 records
✅ public.transaccion_impuesto: 0 records
✅ public.valores_campos_personalizados_transaccion: 0 records
✅ public.saga_eventos: 0 records

✅ SUCCESS: All transaction-related tables are EMPTY
```

## Execution Command

```bash
cd rag && node scripts/execute-delete-transacciones.mjs
```

## Notes

- Script uses transaction (BEGIN/COMMIT) for safety
- Handles missing tables gracefully with EXISTS checks
- Self-referencing FK (`id_transaccion_base`) cleared before DELETE
- SSL connection required (DigitalOcean PostgreSQL)
- Environment variables from `.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`

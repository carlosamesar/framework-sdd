-- ============================================================================
-- SCRIPT: Delete all transactions and related data
-- DATE: 2026-04-09
-- PURPOSE: Safely delete all records from public.transacciones considering
--          all FK relationships and dependent tables
-- WARNING: This is a DESTRUCTIVE operation - all transaction data will be lost
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Delete from tables that reference transacciones (child tables)
-- These must be deleted FIRST before we can delete from transacciones
-- Found 10 FK constraints - all must be handled
-- ============================================================================

-- 1.1 Delete inventory movements linked to transactions
DELETE FROM public.movimientos_inventario 
WHERE id_transaccion IS NOT NULL;

-- 1.2 Delete accounting entries linked to transactions
DELETE FROM public.asientos_contables_encabezado 
WHERE id_transaccion IS NOT NULL;

-- 1.3 Delete advance payment applications
DELETE FROM public.aplicaciones_anticipo 
WHERE id_transaccion IS NOT NULL;

-- 1.4 Delete transaction log events
DELETE FROM public.log_eventos_transaccion 
WHERE id_transaccion IS NOT NULL;

-- 1.5 Delete portfolio movements
DELETE FROM public.movimientos_cartera 
WHERE id_transaccion IS NOT NULL;

-- 1.6 Delete transaction payments
DELETE FROM public.pagos_transaccion 
WHERE id_transaccion IS NOT NULL;

-- 1.7 Delete transaction withholdings
DELETE FROM public.retenciones_transaccion 
WHERE id_transaccion IS NOT NULL;

-- 1.8 Delete transaction complements
DELETE FROM public.transaccion_complemento 
WHERE id_transaccion IS NOT NULL;

-- 1.9 Delete transaction taxes
DELETE FROM public.transaccion_impuesto 
WHERE id_transaccion IS NOT NULL;

-- 1.10 Delete custom field values
DELETE FROM public.valores_campos_personalizados_transaccion 
WHERE id_transaccion IS NOT NULL;

-- 1.11 Delete SAGA events related to transactions
DELETE FROM public.saga_eventos 
WHERE id_transaccion IS NOT NULL;

-- 1.12 Delete transaction details/line items (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'detalles_transaccion') THEN
    DELETE FROM public.detalles_transaccion 
    WHERE id_transaccion IS NOT NULL;
  END IF;
END $$;

-- 1.13 Delete transaction state history/audit trail (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaccion_estado') THEN
    DELETE FROM public.transaccion_estado 
    WHERE id_transaccion IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Delete from the main transacciones table
-- Now that all child records are deleted, we can safely delete transactions
-- Note: First clear self-referencing FK (id_transaccion_base)
-- ============================================================================

-- Clear self-referencing FK first
UPDATE public.transacciones 
SET id_transaccion_base = NULL 
WHERE id_transaccion_base IS NOT NULL;

-- Now delete all transactions
DELETE FROM public.transacciones;

-- ============================================================================
-- STEP 2.5: Delete accounting entries that were linked to transactions
-- (Those with id_transaccion NOT NULL were already deleted in STEP 1)
-- Now delete remaining entries that have NULL id_transaccion
-- ============================================================================

DELETE FROM public.asientos_contables_encabezado;

-- ============================================================================
-- STEP 3: Optional - Clean up related reference data if needed
-- (Uncomment only if you want to clean these tables too)
-- ============================================================================

-- -- Clean up estados that are no longer referenced
-- DELETE FROM public.estados 
-- WHERE id_estado NOT IN (
--   SELECT DISTINCT id_estado FROM public.transacciones WHERE id_estado IS NOT NULL
-- );

-- -- Clean up tipo_transaccion that are no longer referenced
-- DELETE FROM public.tipo_transaccion 
-- WHERE id_tipo_transaccion NOT IN (
--   SELECT DISTINCT id_tipo_transaccion FROM public.transacciones WHERE id_tipo_transaccion IS NOT NULL
-- );

-- Note: asientos_contables_encabezado is now fully deleted (both linked and standalone entries)

-- ============================================================================
-- STEP 4: Verification queries (should return 0 for all)
-- ============================================================================

DO $$
DECLARE
  v_transacciones BIGINT;
  v_asientos BIGINT;
  v_aplicaciones BIGINT;
  v_log BIGINT;
  v_movimientos_cartera BIGINT;
  v_pagos BIGINT;
  v_retenciones BIGINT;
  v_complemento BIGINT;
  v_impuesto BIGINT;
  v_valores BIGINT;
  v_saga BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_transacciones FROM public.transacciones;
  
  BEGIN SELECT COUNT(*) INTO v_asientos FROM public.asientos_contables_encabezado WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_asientos := 0; END;
  BEGIN SELECT COUNT(*) INTO v_aplicaciones FROM public.aplicaciones_anticipo WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_aplicaciones := 0; END;
  BEGIN SELECT COUNT(*) INTO v_log FROM public.log_eventos_transaccion WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_log := 0; END;
  BEGIN SELECT COUNT(*) INTO v_movimientos_cartera FROM public.movimientos_cartera WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_movimientos_cartera := 0; END;
  BEGIN SELECT COUNT(*) INTO v_pagos FROM public.pagos_transaccion WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_pagos := 0; END;
  BEGIN SELECT COUNT(*) INTO v_retenciones FROM public.retenciones_transaccion WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_retenciones := 0; END;
  BEGIN SELECT COUNT(*) INTO v_complemento FROM public.transaccion_complemento WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_complemento := 0; END;
  BEGIN SELECT COUNT(*) INTO v_impuesto FROM public.transaccion_impuesto WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_impuesto := 0; END;
  BEGIN SELECT COUNT(*) INTO v_valores FROM public.valores_campos_personalizados_transaccion WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_valores := 0; END;
  BEGIN SELECT COUNT(*) INTO v_saga FROM public.saga_eventos WHERE id_transaccion IS NOT NULL; EXCEPTION WHEN undefined_table THEN v_saga := 0; END;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DELETION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'transacciones: % records', v_transacciones;
  RAISE NOTICE 'asientos_contables_encabezado: %', v_asientos;
  RAISE NOTICE 'aplicaciones_anticipo: %', v_aplicaciones;
  RAISE NOTICE 'log_eventos_transaccion: %', v_log;
  RAISE NOTICE 'movimientos_cartera: %', v_movimientos_cartera;
  RAISE NOTICE 'pagos_transaccion: %', v_pagos;
  RAISE NOTICE 'retenciones_transaccion: %', v_retenciones;
  RAISE NOTICE 'transaccion_complemento: %', v_complemento;
  RAISE NOTICE 'transaccion_impuesto: %', v_impuesto;
  RAISE NOTICE 'valores_campos_personalizados_transaccion: %', v_valores;
  RAISE NOTICE 'saga_eventos: %', v_saga;
  RAISE NOTICE '========================================';
  
  IF v_transacciones = 0 AND v_asientos = 0 AND v_aplicaciones = 0 AND v_log = 0 
     AND v_movimientos_cartera = 0 AND v_pagos = 0 AND v_retenciones = 0 
     AND v_complemento = 0 AND v_impuesto = 0 AND v_valores = 0 AND v_saga = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All transaction-related data has been deleted';
  ELSE
    RAISE WARNING '⚠️  WARNING: Some records still remain';
  END IF;
  RAISE NOTICE '========================================';
END $$;

COMMIT;

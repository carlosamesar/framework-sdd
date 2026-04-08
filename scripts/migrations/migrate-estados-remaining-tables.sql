-- Migration: Complete id_estado UUID normalization for remaining tables
-- Context: Most tables are already normalized, but 4 tables remain with INTEGER id_estado.
-- Tables: condiciones_venta, medios_pago, tipos_descuento, tipos_estado

BEGIN;

-- 1. Ensure mapping table exists with correct column names
CREATE TABLE IF NOT EXISTS public.estado_migration_map (
    old_id integer PRIMARY KEY,
    new_uuid uuid,
    migrated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 2. Populate mapping from public.estados
-- ACTIVO = 1
-- INACTIVO = 2
-- ANULADO = 3
-- BLOQUEADO = 4
-- PENDIENTE = 5
INSERT INTO public.estado_migration_map (old_id, new_uuid) VALUES 
(1, 'e896155f-0031-4b75-96df-ce1daa97b5c8'),
(2, '92d69e75-0d87-498e-9815-c450410b4a42'),
(3, '9297a3f5-981b-4dd5-868e-cce58e1c4f74'),
(4, '46b73155-5f49-4506-b78b-550c356246b7'),
(5, 'aed0c5ed-be89-4ff8-8c19-42283fdbfcf0')
ON CONFLICT (old_id) DO UPDATE SET new_uuid = EXCLUDED.new_uuid;

-- 3. Migrate the 4 specific tables
DO $$
DECLARE
    tname text;
    cname text;
    fkname text;
    tbl_rec RECORD;
BEGIN
    FOR tbl_rec IN 
        SELECT * FROM (VALUES 
            ('condiciones_venta', 'id_estado', 'fk_condiciones_venta_estado'),
            ('medios_pago', 'id_estado', 'fk_medios_pago_estado'),
            ('tipos_descuento', 'id_estado', 'fk_tipos_descuento_estado'),
            ('tipos_estado', 'id_estado', 'fk_tipos_estado_estado')
        ) AS t(tbl, col, fk)
    LOOP
        tname := tbl_rec.tbl;
        cname := tbl_rec.col;
        fkname := tbl_rec.fk;

        -- Check if column is integer
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tname AND column_name = cname AND data_type = 'integer'
        ) THEN
            RAISE NOTICE 'Migrating table %.%', tname, cname;
            
            -- Drop FK if exists
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', tname, fkname);
            
            -- Add temp uuid column
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN id_estado_uuid uuid', tname);
            
            -- Update temp column from map
            EXECUTE format('UPDATE public.%I t SET id_estado_uuid = m.new_uuid FROM public.estado_migration_map m WHERE t.%I = m.old_id', tname, cname);
            
            -- Set default to 'ACTIVO' UUID (old_id = 1)
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id_estado_uuid SET DEFAULT ''e896155f-0031-4b75-96df-ce1daa97b5c8''::uuid', tname);
            
            -- Drop old integer column
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', tname, cname);
            
            -- Rename temp to original
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN id_estado_uuid TO %I', tname, cname);
            
            -- Restore FK
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.estados(id_estado)', tname, fkname, cname);
            
            RAISE NOTICE 'Table % migrated successfully.', tname;
        ELSE
            RAISE NOTICE 'Table % column % is already not integer or does not exist.', tname, cname;
        END IF;
    END LOOP;
END $$;

COMMIT;

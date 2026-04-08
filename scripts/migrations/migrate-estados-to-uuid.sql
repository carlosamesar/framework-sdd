-- Migration: public.estados integer to uuid
-- Change: id-estado-uuid-migration

BEGIN;

-- 1. Preparation: Table to map old IDs to new UUIDs
CREATE TABLE IF NOT EXISTS public.estado_migration_map (
    id_int integer PRIMARY KEY,
    id_uuid uuid DEFAULT gen_random_uuid()
);

-- 2. Populate mapping
INSERT INTO public.estado_migration_map (id_int)
SELECT id_estado FROM public.estados
ON CONFLICT (id_int) DO NOTHING;

-- 3. Prepare referencing tables
-- We'll do this for all 27 identified tables

DO $$
DECLARE
    r RECORD;
    table_name_var text;
    column_name_var text;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, kcu.column_name, ccu.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'estados' AND tc.table_schema = 'public'
    ) LOOP
        -- Drop FK constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
        
        -- Add temp uuid column
        EXECUTE format('ALTER TABLE %I.%I ADD COLUMN id_estado_uuid uuid', r.table_schema, r.table_name);
        
        -- Update temp column with new UUIDs from map
        EXECUTE format('UPDATE %I.%I t SET id_estado_uuid = m.id_uuid FROM public.estado_migration_map m WHERE t.id_estado = m.id_int', r.table_schema, r.table_name);
        
        -- Drop old integer column
        EXECUTE format('ALTER TABLE %I.%I DROP COLUMN id_estado', r.table_schema, r.table_name);
        
        -- Rename temp column to id_estado
        EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN id_estado_uuid TO id_estado', r.table_schema, r.table_name);
    END LOOP;
END $$;

-- 4. Update the main 'estados' table
-- Drop PK (assumes it's named 'estados_pkey')
ALTER TABLE public.estados DROP CONSTRAINT IF EXISTS estados_pkey;

-- Add temp uuid column
ALTER TABLE public.estados ADD COLUMN id_estado_uuid uuid;

-- Update with mapped UUIDs
UPDATE public.estados e SET id_estado_uuid = m.id_uuid FROM public.estado_migration_map m WHERE e.id_estado = m.id_int;

-- Drop old integer PK
ALTER TABLE public.estados DROP COLUMN id_estado;

-- Rename temp to id_estado and set as PK
ALTER TABLE public.estados RENAME COLUMN id_estado_uuid TO id_estado;
ALTER TABLE public.estados ADD PRIMARY KEY (id_estado);

-- 5. Restore FK constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        -- Re-identifying referencing tables (they now have uuid id_estado but no FK)
        -- Based on the manual list found in exploration
        SELECT unnest(ARRAY[
            'actividades_economicas', 'bancos', 'bodegas', 'cajas', 'categorias_producto',
            'centros_costos', 'ciudades', 'conceptos_tributarios', 'configuracion_eventos_transaccion',
            'cuentas_bancarias', 'departamentos', 'formas_pago', 'listas_precios', 'marcas_producto',
            'personas_contactos', 'personas', 'producto_variantes', 'productos', 'productos_lista_precios',
            'regimenes_tributarios', 'tenants', 'tipos_evento', 'tipos_identificacion', 'tipos_moneda',
            'tipos_producto', 'tipos_tercero', 'usuarios', 'condiciones_venta', 'medios_pago', 'tipos_descuento'
        ]) as tname
    ) LOOP
        -- Only attempt if table exists in public schema
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = r.tname) THEN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (id_estado) REFERENCES public.estados(id_estado)', r.tname, 'fk_' || r.tname || '_estado');
        END IF;
    END LOOP;
END $$;

-- 6. Set default value for id_estado to the 'ACTIVO' UUID
DO $$
DECLARE
    activo_uuid uuid;
BEGIN
    SELECT id_uuid INTO activo_uuid FROM public.estado_migration_map WHERE id_int = 1; -- 1 is ACTIVO
    
    IF activo_uuid IS NOT NULL THEN
        -- Apply default to common tables
        EXECUTE format('ALTER TABLE public.usuarios ALTER COLUMN id_estado SET DEFAULT %L', activo_uuid);
        EXECUTE format('ALTER TABLE public.productos ALTER COLUMN id_estado SET DEFAULT %L', activo_uuid);
        -- Add more as needed or apply to all referencing tables
    END IF;
END $$;

-- 7. Cleanup (Optional: keep map for a while or drop now)
-- DROP TABLE public.estado_migration_map;

COMMIT;

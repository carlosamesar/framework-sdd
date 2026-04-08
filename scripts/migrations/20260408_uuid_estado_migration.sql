-- Migración de id_estado a UUID en tablas relacionadas a transacciones
-- Fecha: 2026-04-08
-- Autor: Framework-SDD

-- 1. Verificar esquema en DigitalOcean antes de ejecutar:
-- SELECT table_name, column_name, data_type FROM information_schema.columns WHERE column_name = 'id_estado';

BEGIN;

-- 2. Asegurar que existe extensión uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Modificar columna id_estado en transacciones (si aplica)
-- ALTER TABLE transacciones ALTER COLUMN id_estado TYPE UUID USING id_estado::uuid;

-- 4. Modificar columna id_estado en auditoría (transaccion_estado)
-- Nota: Si id_estado era SERIAL (entero 8), la conversión directa fallará si no hay un mapeo previo a UUID reales.
-- Se recomienda recrear la columna si se desea limpiar datos antiguos o asignar UUIDs por defecto.

-- Ejemplo de migración conservadora:
ALTER TABLE transaccion_estados ALTER COLUMN id_estado TYPE UUID USING (
  CASE 
    WHEN id_estado::text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN id_estado::uuid 
    ELSE uuid_generate_v4() -- Generar uno nuevo para registros legacy (SERIAL)
  END
);

COMMIT;

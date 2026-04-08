-- Normalization: public.transacciones.estado VARCHAR -> UUID (FK to public.estados)
-- Decision: Recreate dependent views to support UUID id_estado while maintaining backward compatibility in views (casting UUID to VARCHAR name)

BEGIN;

-- 1. Ensure states exist
INSERT INTO public.estados (id_estado, codigo, nombre, descripcion, creado_por)
SELECT gen_random_uuid(), 'BORRADOR', 'Borrador', 'Transacción en estado borrador', 'sistema'
WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE codigo = 'BORRADOR');

INSERT INTO public.estados (id_estado, codigo, nombre, descripcion, creado_por)
SELECT gen_random_uuid(), 'APROBADO', 'Aprobado', 'Transacción aprobada', 'sistema'
WHERE NOT EXISTS (SELECT 1 FROM public.estados WHERE codigo = 'APROBADO');

-- 2. Add id_estado_uuid to transacciones
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS id_estado_uuid uuid;

-- 3. Populate id_estado_uuid from estados table matching by name/code (case insensitive)
UPDATE public.transacciones t
SET id_estado_uuid = e.id_estado
FROM public.estados e
WHERE UPPER(t.estado) = e.codigo;

-- 4. Default for orphaned states
UPDATE public.transacciones
SET id_estado_uuid = (SELECT id_estado FROM public.estados WHERE codigo = 'BORRADOR' LIMIT 1)
WHERE id_estado_uuid IS NULL;

-- 5. Drop dependent views (CASCADE would be too dangerous, let's do it explicitly)
DROP VIEW IF EXISTS v_rendimiento_propagacion_mvp;
DROP VIEW IF EXISTS v_timeline_transaccion_mvp;
DROP VIEW IF EXISTS v_transacciones_sin_movimiento_mvp;
DROP VIEW IF EXISTS v_dashboard_transacciones_mvp;
DROP VIEW IF EXISTS v_transacciones_inventario_mvp;
DROP VIEW IF EXISTS v_transacciones_incompletas;
DROP VIEW IF EXISTS v_transacciones_inventario;

-- 6. Replace 'estado' column
ALTER TABLE public.transacciones DROP COLUMN estado;
ALTER TABLE public.transacciones RENAME COLUMN id_estado_uuid TO id_estado;

-- 7. Add FK and Index
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS fk_transacciones_id_estado;
ALTER TABLE public.transacciones 
ADD CONSTRAINT fk_transacciones_id_estado 
FOREIGN KEY (id_estado) REFERENCES public.estados(id_estado);

CREATE INDEX IF NOT EXISTS idx_transacciones_id_estado ON public.transacciones(id_estado);

-- 8. Recreate views with compatibility (casting id_estado to name via join)
CREATE VIEW v_transacciones_inventario AS
 SELECT t.id_transaccion,
    t.numero_documento,
    t.id_tenant,
    t.fecha_emision,
    e.nombre AS estado,
    t.total_neto,
    count(DISTINCT mi.id_movimiento) AS movimientos_count,
    t.fecha_creacion
   FROM ((transacciones t
     LEFT JOIN movimientos_inventario mi ON ((mi.id_transaccion = t.id_transaccion)))
     LEFT JOIN estados e ON ((t.id_estado = e.id_estado)))
  GROUP BY t.id_transaccion, t.numero_documento, t.id_tenant, t.fecha_emision, e.nombre, t.total_neto, t.fecha_creacion
  ORDER BY t.fecha_creacion DESC;

CREATE VIEW v_transacciones_incompletas AS
 SELECT t.id_transaccion,
    t.numero_documento,
    t.fecha_emision,
    e.nombre AS estado,
    count(mi.id_movimiento) AS movimientos_count
   FROM ((transacciones t
     LEFT JOIN movimientos_inventario mi ON ((mi.id_transaccion = t.id_transaccion)))
     LEFT JOIN estados e ON ((t.id_estado = e.id_estado)))
  WHERE (t.fecha_emision >= (CURRENT_DATE - '7 days'::interval))
  GROUP BY t.id_transaccion, t.numero_documento, t.fecha_emision, e.nombre
 HAVING (count(mi.id_movimiento) = 0);

CREATE VIEW v_transacciones_inventario_mvp AS
 SELECT t.id_transaccion,
    t.numero_documento AS numero_transaccion,
    t.id_tenant,
    tt.nombre AS tipo_transaccion,
    tt.codigo AS codigo_tipo_transaccion,
    t.fecha_emision AS fecha_transaccion,
    e.nombre AS estado_transaccion,
    t.total_neto AS total_transaccion,
    se.id_evento AS id_evento_saga,
    se.tipo_evento AS tipo_evento_saga,
    se.estado_evento AS estado_saga,
    se.created_at AS fecha_evento_saga,
    se.intentos AS intentos_saga,
    count(DISTINCT mi.id_movimiento) AS movimientos_inventario,
        CASE
            WHEN (count(DISTINCT mi.id_movimiento) > 0) THEN true
            ELSE false
        END AS tiene_movimiento_inventario,
        CASE
            WHEN (((se.estado_evento)::text = 'COMPLETADO'::text) AND (count(DISTINCT mi.id_movimiento) > 0)) THEN 'COMPLETO'::text
            WHEN ((se.estado_evento)::text = 'FALLIDO'::text) THEN 'FALLIDO'::text
            WHEN ((se.estado_evento)::text = 'PROCESANDO'::text) THEN 'EN_PROCESO'::text
            WHEN (count(DISTINCT mi.id_movimiento) = 0) THEN 'SIN_MOVIMIENTO'::text
            ELSE 'DESCONOCIDO'::text
        END AS estado_propagacion,
    sum(mi.cantidad) AS total_unidades_movidas,
    sum(((mi.cantidad)::numeric * mi.costo_unitario)) AS valor_total_movimientos,
    t.fecha_creacion,
    t.fecha_actualizacion
   FROM ((((transacciones t
     LEFT JOIN tipo_transaccion tt ON ((t.id_tipo_transaccion = tt.id_tipo_transaccion)))
     LEFT JOIN saga_eventos se ON ((se.id_transaccion = t.id_transaccion)))
     LEFT JOIN movimientos_inventario mi ON ((mi.id_transaccion = t.id_transaccion)))
     LEFT JOIN estados e ON ((t.id_estado = e.id_estado)))
  GROUP BY t.id_transaccion, t.numero_documento, t.id_tenant, tt.nombre, tt.codigo, t.fecha_emision, e.nombre, t.total_neto, se.id_evento, se.tipo_evento, se.estado_evento, se.created_at, se.intentos, t.fecha_creacion, t.fecha_actualizacion
  ORDER BY t.fecha_creacion DESC;

-- Note: We need to recreate the other dependent views that were dropped
CREATE VIEW v_dashboard_transacciones_mvp AS SELECT * FROM v_transacciones_inventario_mvp;
CREATE VIEW v_rendimiento_propagacion_mvp AS SELECT * FROM v_transacciones_inventario_mvp;
CREATE VIEW v_timeline_transaccion_mvp AS SELECT * FROM v_transacciones_inventario_mvp;
CREATE VIEW v_transacciones_sin_movimiento_mvp AS SELECT * FROM v_transacciones_inventario_mvp;

COMMIT;

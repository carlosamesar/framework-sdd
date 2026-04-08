-- Normalización de nombres y códigos en public.estados para compatibilidad con fnSagaTransaccion
UPDATE public.estados 
SET 
    nombre = UPPER(nombre),
    codigo = UPPER(nombre)
WHERE nombre IN ('Borrador', 'Aprobado', 'Anulado', 'BORRADOR', 'APROBADO', 'ANULADO');

-- Verificación usando el nombre de columna correcto 'id_estado'
SELECT id_estado, nombre, codigo FROM public.estados WHERE nombre IN ('BORRADOR', 'APROBADO', 'ANULADO');

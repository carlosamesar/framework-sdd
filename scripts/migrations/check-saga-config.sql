-- Verificación de configuración SAGA
SELECT * FROM public.saga_event_configuration 
WHERE id_tenant = '11111111-1111-1111-1111-111111111111' 
LIMIT 10;

-- Verificación de nombres de estados disponibles
SELECT id_estado, nombre, codigo FROM public.estados 
WHERE id_estado IN (
    SELECT DISTINCT id_estado FROM public.transacciones
);

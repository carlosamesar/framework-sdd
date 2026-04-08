-- Query para obtener una transacción válida para pruebas
SELECT t.id_transaccion, t.id_tenant, e.nombre as estado_actual
FROM public.transacciones t
JOIN public.estados e ON t.id_estado = e.id_estado
WHERE t.id_tenant = '11111111-1111-1111-1111-111111111111'
LIMIT 5;

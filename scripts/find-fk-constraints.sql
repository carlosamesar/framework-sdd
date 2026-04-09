-- Find ALL tables that have FK constraints referencing transacciones
SELECT 
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'transacciones'
    AND ccu.table_schema = 'public'
ORDER BY 
    tc.table_schema,
    tc.table_name;

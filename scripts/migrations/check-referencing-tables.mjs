import pg from 'pg';

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
};

async function check() {
    const client = new pg.Client(dbConfig);
    try {
        await client.connect();
        console.log('Conectado para verificar dependencias de "public.estados"');

        const query = `
            SELECT 
                tc.table_schema, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                kcu.data_type
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
              ON tc.constraint_name = kcu.constraint_name 
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu 
              ON ccu.constraint_name = tc.constraint_name 
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'estados'
              AND ccu.table_schema = 'public';
        `;
        
        const res = await client.query(query);
        console.log('Tablas que referencian a public.estados via FK:');
        console.table(res.rows);

        // También buscar columnas llamadas id_estado que NO tengan FK pero sean integer
        const query2 = `
            SELECT table_schema, table_name, column_name, data_type
            FROM information_schema.columns
            WHERE column_name = 'id_estado' 
              AND data_type = 'integer'
              AND table_schema IN ('public', 'tesoreria', 'contabilidad', 'transacciones');
        `;
        const res2 = await client.query(query2);
        console.log('\nColumnas "id_estado" de tipo INTEGER (sin FK o pendientes):');
        console.table(res2.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

check();

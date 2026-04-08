import { getPool } from './db.mjs';

async function checkStatus() {
    const pool = getPool();
    try {
        console.log('--- Consultando tabla estados ---');
        const { rows } = await pool.query("SELECT id_estado, codigo, nombre FROM estados WHERE nombre ILIKE '%ACTIVO%' OR codigo ILIKE '%ACTIVO%'");
        console.log(JSON.stringify(rows, null, 2));
        
        console.log('\n--- Verificando tipo de columna id_estado ---');
        const colInfo = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'estados' AND column_name = 'id_estado'
        `);
        console.log(JSON.stringify(colInfo.rows, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}

checkStatus();

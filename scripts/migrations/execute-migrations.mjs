import '../lib/load-framework-env.mjs';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function run() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    
    try {
        const scripts = [
            'scripts/migrations/migrate-estados-remaining-tables.sql',
            'scripts/migrations/normalize-transacciones-estado.sql'
        ];

        for (const scriptPath of scripts) {
            console.log(`Executing ${scriptPath}...`);
            const sql = fs.readFileSync(scriptPath, 'utf8');
            await client.query(sql);
            console.log(`Success: ${scriptPath}`);
        }
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();

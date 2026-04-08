import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

// Función manual para cargar .env
function loadEnv(envPath) {
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const config = {};
    for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            config[match[1]] = value.trim();
        }
    }
    return config;
}

const env = loadEnv('/home/cto-grupo4d/Documents/Good4D/Framework-SDD/develop/backend/gooderp-orchestation/.env');

const pool = new Pool({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10) || 5432,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function checkUUIDs() {
    try {
        const result = await pool.query("SELECT id_estado, nombre, codigo FROM public.estados");
        console.log('--- ESTADOS ENCONTRADOS ---');
        console.table(result.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

checkUUIDs();

const pg = require('/home/cto-grupo4d/Documents/Good4D/Framework-SDD/develop/backend/gooderp-orchestation/lib/lambda/saga/fnSagaTransaccion/node_modules/pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente si dotenv no está disponible
const envPath = '/home/cto-grupo4d/Documents/Good4D/Framework-SDD/.env';
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

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
        const arg = process.argv[2];
        const isQuery = process.argv[2] === '-q' && process.argv[3];
        
        if (isQuery) {
            const sql = process.argv[3];
            console.log(`Executing Query: ${sql}`);
            const res = await client.query(sql);
            if (res.rows && res.rows.length > 0) {
                console.table(res.rows);
            } else {
                console.log('Query executed successfully. No rows returned.');
            }
            return;
        }

        const scripts = arg ? [arg] : [
            '/home/cto-grupo4d/Documents/Good4D/Framework-SDD/scripts/migrations/migrate-estados-remaining-tables.sql',
            '/home/cto-grupo4d/Documents/Good4D/Framework-SDD/scripts/migrations/repair-transacciones-views.sql'
        ];

        for (const scriptPath of scripts) {
            console.log(`Executing ${scriptPath}...`);
            const absolutePath = path.isAbsolute(scriptPath) ? scriptPath : path.resolve(process.cwd(), scriptPath);
            const sqlContent = fs.readFileSync(absolutePath, 'utf8');
            // Dividir el archivo por punto y coma para ejecutar múltiples sentencias si es necesario
            const queries = sqlContent.split(';').filter(q => q.trim().length > 0);
            
            for (const sql of queries) {
                const res = await client.query(sql);
                console.log(`Executed: ${sql.substring(0, 50).trim().replace(/\n/g, ' ')}...`);
                if (res.rows && res.rows.length > 0) {
                    console.table(res.rows);
                }
            }
            console.log(`Success: ${scriptPath}`);
        }
    } catch (err) {
        console.error('Operation failed:', err);
        process.exit(1);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

run();

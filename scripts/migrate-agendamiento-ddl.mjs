/**
 * Aplica scripts/migrations/20260417_agendamiento_agenda_cita.sql usando las mismas
 * variables DB_* que la Lambda (ver npm run lambda:agendamiento:env).
 *
 * Uso: node scripts/migrate-agendamiento-ddl.mjs
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { applyDatabaseEnvAliases } from './lib/load-framework-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env'), override: true });
applyDatabaseEnvAliases();

const sqlPath = path.join(ROOT, 'scripts', 'migrations', '20260417_agendamiento_agenda_cita.sql');

const dbUser = process.env.DB_USER || process.env.DB_USERNAME;
const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
if (!process.env.DB_HOST || !dbUser || !dbName || !process.env.DB_PASSWORD) {
  console.error('Defina DB_HOST, DB_USER/DB_USERNAME, DB_NAME/DB_DATABASE, DB_PASSWORD en .env');
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: dbName,
  user: dbUser,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(sqlPath, 'utf8');

try {
  await pool.query(sql);
  console.log('OK: DDL agendamiento.agenda_cita aplicado.');
} catch (e) {
  console.error(e.message);
  process.exit(1);
} finally {
  await pool.end();
}

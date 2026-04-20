import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Raíz del repo framework-sdd (donde está el `.env` compartido). */
export const FRAMEWORK_ROOT = path.resolve(__dirname, '..', '..');

let loaded = false;

/** Unifica `DB_USERNAME`→`DB_USER` y `DB_DATABASE`→`DB_NAME` (p. ej. tras otro `dotenv.config`). */
export function applyDatabaseEnvAliases() {
  if (!String(process.env.DB_USER ?? '').trim() && String(process.env.DB_USERNAME ?? '').trim()) {
    process.env.DB_USER = process.env.DB_USERNAME;
  }
  if (!String(process.env.DB_NAME ?? '').trim() && String(process.env.DB_DATABASE ?? '').trim()) {
    process.env.DB_NAME = process.env.DB_DATABASE;
  }
}

/**
 * Carga `/.env` en la raíz del framework y unifica nombres frecuentes:
 * - DB_USERNAME → DB_USER si falta DB_USER
 * - DB_DATABASE → DB_NAME si falta DB_NAME
 */
export function loadFrameworkEnv() {
  if (loaded) return;
  loaded = true;
  const envPath = path.join(FRAMEWORK_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  applyDatabaseEnvAliases();
}

loadFrameworkEnv();

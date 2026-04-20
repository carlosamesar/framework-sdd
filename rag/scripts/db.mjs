import '../../scripts/lib/load-framework-env.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAG_ROOT = path.join(__dirname, '..');
const FRAME_ROOT = path.join(RAG_ROOT, '..');

function loadEnv() {
  const ragEnv = path.join(RAG_ROOT, '.env');
  const frameEnv = path.join(FRAME_ROOT, '.env');
  if (fs.existsSync(ragEnv)) dotenv.config({ path: ragEnv });
  dotenv.config({ path: frameEnv });
}

loadEnv();

export const FRAME_ROOT_RESOLVED = FRAME_ROOT;

export function getPool() {
  const host = process.env.RAG_DB_HOST || process.env.DB_HOST;
  const port = parseInt(process.env.RAG_DB_PORT || process.env.DB_PORT || '5432', 10);
  const database =
    process.env.RAG_DB_NAME || process.env.DB_NAME || process.env.DB_DATABASE;
  const user =
    process.env.RAG_DB_USER || process.env.DB_USER || process.env.DB_USERNAME;
  const password = process.env.RAG_DB_PASSWORD || process.env.DB_PASSWORD;
  const sslFlag = (process.env.RAG_DB_SSL ?? 'true').toLowerCase() !== 'false';

  if (!host || !database || !user) {
    throw new Error(
      'RAG: faltan variables de BD. Defina RAG_DB_* o DB_* (host, name, user, password) en rag/.env o raíz .env',
    );
  }

  return new pg.Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: sslFlag ? { rejectUnauthorized: false } : false,
    max: 5,
    connectionTimeoutMillis: parseInt(process.env.RAG_DB_CONNECT_TIMEOUT_MS || '15000', 10),
  });
}

export function getEmbeddingDim() {
  return parseInt(process.env.RAG_EMBEDDING_DIM || '768', 10);
}

export function getEmbeddingBackend() {
  return (process.env.RAG_EMBEDDING_BACKEND || 'ollama').toLowerCase();
}

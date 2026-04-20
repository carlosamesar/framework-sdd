/**
 * Aplica variables de BD (y NODE_ENV) a la Lambda apisGoodErp-fnAgendamiento
 * leyendo el `.env` de la raíz del framework. No escribe secretos en el repo.
 *
 * Usa `override: true` para que los valores del archivo `.env` ganen sobre
 * variables ya definidas en el terminal (p. ej. credenciales AWS antiguas).
 *
 * Requisitos: AWS CLI v2, credenciales válidas en `.env` o en el entorno.
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const FRAMEWORK_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(FRAMEWORK_ROOT, '.env'), override: true });

const { applyDatabaseEnvAliases } = await import('./lib/load-framework-env.mjs');
applyDatabaseEnvAliases();

const region = process.env.AWS_REGION || 'us-east-1';
const fnName = 'apisGoodErp-fnAgendamiento';

const required = ['DB_HOST', 'DB_PASSWORD'];
const missing = required.filter((k) => !String(process.env[k] ?? '').trim());
if (missing.length) {
  console.error('Faltan variables en .env:', missing.join(', '));
  process.exit(1);
}

const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
const dbUser = process.env.DB_USER || process.env.DB_USERNAME;
if (!dbName || !dbUser) {
  console.error('Defina DB_NAME/DB_DATABASE y DB_USER/DB_USERNAME en .env');
  process.exit(1);
}

let existing = {};
try {
  const out = execFileSync(
    'aws',
    [
      'lambda',
      'get-function-configuration',
      '--function-name',
      fnName,
      '--region',
      region,
      '--query',
      'Environment.Variables',
      '--output',
      'json',
    ],
    { encoding: 'utf8', env: process.env },
  );
  existing = JSON.parse(out || '{}');
} catch {
  /* primera vez o sin permisos de lectura */
}

const dbVars = {
  NODE_ENV: 'production',
  DB_HOST: process.env.DB_HOST,
  DB_PORT: String(process.env.DB_PORT || '5432'),
  DB_NAME: dbName,
  DB_USER: dbUser,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SCHEMA: process.env.DB_SCHEMA || 'agendamiento',
};

const merged = { ...existing, ...dbVars };

const payload = {
  FunctionName: fnName,
  Environment: { Variables: merged },
};

const dir = mkdtempSync(path.join(tmpdir(), 'lambda-env-'));
const file = path.join(dir, 'input.json');
writeFileSync(file, JSON.stringify(payload), 'utf8');

try {
  const status = execFileSync(
    'aws',
    [
      'lambda',
      'update-function-configuration',
      '--cli-input-json',
      `file://${file}`,
      '--region',
      region,
      '--query',
      'LastUpdateStatus',
      '--output',
      'text',
    ],
    { encoding: 'utf8', env: process.env },
  ).trim();
  console.log(`OK: entorno actualizado en ${fnName} (${region}). Estado: ${status}`);
} catch (err) {
  console.error(
    '\nSi ves UnrecognizedClientException: credenciales AWS inválidas o variables del terminal más viejas que el .env. Este script ya fuerza override del .env; revisa las claves IAM o ejecuta desde una terminal limpia.',
  );
  process.exit(err.status ?? 1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

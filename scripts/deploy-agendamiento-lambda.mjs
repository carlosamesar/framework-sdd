/**
 * Empaqueta `fnAgendamiento` (npm ci + zip) y ejecuta `aws lambda update-function-code`.
 *
 * Requisitos: AWS CLI, credenciales en .env o entorno (mismo patrón que lambda:agendamiento:env).
 *
 * Uso:
 *   node scripts/deploy-agendamiento-lambda.mjs
 *
 * Variables opcionales:
 *   AGENDAMIENTO_LAMBDA_NAME (default: apisGoodErp-fnAgendamiento)
 *   AWS_REGION (default: us-east-1)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const lambdaRel = 'develop/backend/gooderp-orchestation/lib/lambda/agendamiento/fnAgendamiento';
const lambdaAbs = path.join(ROOT, lambdaRel);
const zipPath = path.join(lambdaAbs, 'deploy.zip');
const fnName = process.env.AGENDAMIENTO_LAMBDA_NAME || 'apisGoodErp-fnAgendamiento';
const region = process.env.AWS_REGION || 'us-east-1';

if (!fs.existsSync(lambdaAbs)) {
  console.error('No existe la carpeta de la lambda:', lambdaAbs);
  process.exit(1);
}

console.log('1) Empaquetando lambda…');
execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'package-lambda-zip.mjs'), '--lambda-path', lambdaRel, '--output', zipPath], {
  stdio: 'inherit',
  cwd: ROOT,
  env: process.env,
});

if (!fs.existsSync(zipPath)) {
  console.error('No se generó el zip:', zipPath);
  process.exit(1);
}

const zipArg = `fileb://${zipPath.replace(/\\/g, '/')}`;

console.log('\n2) Subiendo a AWS Lambda:', fnName, `(${region})…`);
execFileSync(
  'aws',
  [
    'lambda',
    'update-function-code',
    '--function-name',
    fnName,
    '--zip-file',
    zipArg,
    '--region',
    region,
    '--query',
    '[FunctionName,LastUpdateStatus,CodeSize]',
    '--output',
    'text',
  ],
  { stdio: 'inherit', env: process.env },
);

console.log('\nOK: despliegue de código enviado. Espera ~10–30 s y revisa LastUpdateStatus en la consola si hace falta.');

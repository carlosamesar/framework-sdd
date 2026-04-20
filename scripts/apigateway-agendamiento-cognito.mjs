/**
 * Asigna autorización COGNITO_USER_POOLS a los métodos HTTP del recurso API Gateway
 * cuya ruta incluye "agendamiento" (p. ej. /api/v1/agendamiento), reutilizando o
 * creando un autorizador Cognito, y despliega el stage.
 *
 * Corrige el error: "Invalid key=value pair ... Authorization header" cuando el
 * método estaba en AWS_IAM y el cliente envía Bearer JWT.
 *
 * Requisitos: AWS CLI v2, permisos apigateway:* en el API REST, cognito-idp:DescribeUserPool (opcional).
 *
 * Uso:
 *   node scripts/apigateway-agendamiento-cognito.mjs
 *   APIGATEWAY_DRY_RUN=1 node scripts/apigateway-agendamiento-cognito.mjs   # solo simula
 *
 * Nota: NO usa la variable genérica DRY_RUN del .env (suele estar en 1 para otras tareas).
 *
 * Variables opcionales (.env cargado desde la raíz del framework):
 *   REST_API_ID (default: 4j950zl6na)
 *   STAGE_NAME (default: dev)
 *   COGNITO_USER_POOL_ID (default: us-east-1_gmre5QtIx)
 *   AWS_REGION (default: us-east-1)
 *   AGENDAMIENTO_RESOURCE_IDS — ids separados por coma (p. ej. abc123,def456) si la ruta
 *     no contiene "agendamiento" (p. ej. recurso {proxy+} bajo /api/v1).
 *   RESOURCE_PATH_INCLUDES — subcadena para buscar en `path` (default: agendamiento, sin distinguir mayúsculas)
 */
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMEWORK_ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(FRAMEWORK_ROOT, '.env'), override: true });

const REST_API_ID = process.env.REST_API_ID || '4j950zl6na';
const STAGE_NAME = process.env.STAGE_NAME || 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gmre5QtIx';
const RESOURCE_PATH_INCLUDES = (process.env.RESOURCE_PATH_INCLUDES || 'agendamiento').trim();
const EXPLICIT_RESOURCE_IDS = (process.env.AGENDAMIENTO_RESOURCE_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
/** Solo APIGATEWAY_DRY_RUN — no leer DRY_RUN del .env (evita aplicar cambios en simulacro sin querer). */
const isDryRun = ['1', 'true', 'yes'].includes(String(process.env.APIGATEWAY_DRY_RUN || '').toLowerCase());
const listMode = process.argv.includes('--list') || process.argv.includes('-l');

function aws(args, { json = true } = {}) {
  const out = execFileSync('aws', args, {
    encoding: 'utf8',
    env: { ...process.env, AWS_DEFAULT_REGION: REGION },
  });
  if (!json) return out.trim();
  return JSON.parse(out || '{}');
}

function getAccountId() {
  return aws(['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text'], { json: false });
}

function listAllResources() {
  let position = null;
  const all = [];
  for (;;) {
    const args = [
      'apigateway',
      'get-resources',
      '--rest-api-id',
      REST_API_ID,
      '--limit',
      '500',
    ];
    if (position) args.push('--position', position);
    const data = aws(args);
    all.push(...(data.items || []));
    if (!data.position) break;
    position = data.position;
  }
  return all;
}

function poolArn(accountId) {
  return `arn:aws:cognito-idp:${REGION}:${accountId}:userpool/${POOL_ID}`;
}

function findOrCreateCognitoAuthorizer(accountId) {
  const data = aws(['apigateway', 'get-authorizers', '--rest-api-id', REST_API_ID]);
  const items = data.items || [];
  const expectedArn = poolArn(accountId);
  const existing = items.find((a) => {
    if (a.type !== 'COGNITO_USER_POOLS') return false;
    const arns = a.providerARNs || [];
    return arns.some((arn) => arn === expectedArn || arn.includes(POOL_ID));
  });
  if (existing) {
    console.log(`Autorizador Cognito existente: ${existing.name} (${existing.id})`);
    return existing.id;
  }
  if (isDryRun) {
    console.log(`[APIGATEWAY_DRY_RUN] Crearía autorizador Cognito con ARN ${expectedArn}`);
    return 'DRY_RUN_AUTHORIZER_ID';
  }
  const created = aws([
    'apigateway',
    'create-authorizer',
    '--rest-api-id',
    REST_API_ID,
    '--name',
    `gooderp-cognito-${POOL_ID.replace(/[^a-zA-Z0-9]/g, '-')}`,
    '--type',
    'COGNITO_USER_POOLS',
    '--provider-arns',
    expectedArn,
    '--identity-source',
    'method.request.header.Authorization',
    '--authorizer-result-ttl-in-seconds',
    '300',
  ]);
  console.log(`Autorizador creado: ${created.id} (${created.name})`);
  return created.id;
}

function getMethod(resourceId, httpMethod) {
  return aws([
    'apigateway',
    'get-method',
    '--rest-api-id',
    REST_API_ID,
    '--resource-id',
    resourceId,
    '--http-method',
    httpMethod,
  ]);
}

function setMethodCognito(resourceId, httpMethod, authorizerId) {
  if (isDryRun) {
    console.log(`[APIGATEWAY_DRY_RUN] PATCH ${httpMethod} resource ${resourceId} → COGNITO_USER_POOLS (${authorizerId})`);
    return;
  }
  execFileSync(
    'aws',
    [
      'apigateway',
      'update-method',
      '--rest-api-id',
      REST_API_ID,
      '--resource-id',
      resourceId,
      '--http-method',
      httpMethod,
      '--patch-operations',
      'op=replace,path=/authorizationType,value=COGNITO_USER_POOLS',
      `op=replace,path=/authorizerId,value=${authorizerId}`,
    ],
    { stdio: 'inherit', env: { ...process.env, AWS_DEFAULT_REGION: REGION } },
  );
  console.log(`  ✓ ${httpMethod} → COGNITO_USER_POOLS (authorizer ${authorizerId})`);
}

function resolveTargetResources(resources) {
  if (EXPLICIT_RESOURCE_IDS.length > 0) {
    const byId = new Map(resources.map((r) => [r.id, r]));
    const out = [];
    for (const id of EXPLICIT_RESOURCE_IDS) {
      const r = byId.get(id);
      if (!r) {
        console.error(`AGENDAMIENTO_RESOURCE_IDS: no existe recurso con id=${id}`);
        process.exit(1);
      }
      out.push(r);
    }
    return out;
  }

  const exactPaths = ['/api/v1/agendamiento', '/api/v1/agendamiento/{proxy+}'];
  for (const ep of exactPaths) {
    const hit = resources.find((r) => r.path === ep);
    if (hit) return [hit];
  }

  const needle = RESOURCE_PATH_INCLUDES.toLowerCase();
  const bySubstr = resources.filter((r) => r.path && String(r.path).toLowerCase().includes(needle));
  if (bySubstr.length) return bySubstr;

  return [];
}

function logSamplePaths(resources) {
  const paths = [...new Set(resources.map((r) => r.path).filter(Boolean))].sort();
  console.error(`\nTotal de recursos en el API: ${resources.length}`);
  const agendaHits = resources.filter((r) => r.path && /agenda|cita|schedul/i.test(r.path));
  if (agendaHits.length) {
    console.error('Rutas que podrían ser agendamiento (revise id en consola AWS):');
    agendaHits.forEach((r) => console.error(`  id=${r.id}  path=${r.path}`));
  }
  console.error('\nPrimeras rutas del API (referencia):');
  paths.slice(0, 40).forEach((p) => console.error(`  ${p}`));
  if (paths.length > 40) console.error(`  … y ${paths.length - 40} más`);
  console.error(
    '\nSi la ruta es un {proxy+} genérico, copie el resource id desde la consola de API Gateway y ejecute:',
  );
  console.error('  AGENDAMIENTO_RESOURCE_IDS=<id> node scripts/apigateway-agendamiento-cognito.mjs',
  );
  console.error(
    '\nComando útil: aws apigateway get-resources --rest-api-id ' +
      REST_API_ID +
      ' --query "items[?contains(path, `agendamiento`)].[id,path]" --output table',
  );
}

function deployStage() {
  if (isDryRun) {
    console.log(
      `[APIGATEWAY_DRY_RUN] create-deployment --rest-api-id ${REST_API_ID} --stage-name ${STAGE_NAME}`,
    );
    return;
  }
  const dep = aws([
    'apigateway',
    'create-deployment',
    '--rest-api-id',
    REST_API_ID,
    '--stage-name',
    STAGE_NAME,
    '--description',
    'Cognito JWT para agendamiento (script apigateway-agendamiento-cognito.mjs)',
  ]);
  console.log(`Despliegue creado: ${dep.id || dep}`);
}

function main() {
  console.log(`API REST: ${REST_API_ID} | stage: ${STAGE_NAME} | pool: ${POOL_ID} | dry-run: ${isDryRun}`);
  const accountId = getAccountId();
  console.log(`Cuenta AWS: ${accountId}`);

  const resources = listAllResources();
  if (listMode) {
    const hits = resources.filter((r) => r.path && String(r.path).toLowerCase().includes('agendamiento'));
    console.log(`Recursos con "agendamiento" en path: ${hits.length}`);
    hits.forEach((r) => console.log(`  ${r.id}\t${r.path}`));
    if (hits.length === 0) {
      console.log('Ninguno. Rutas con agenda/cita/schedul:');
      resources
        .filter((r) => r.path && /agenda|cita|schedul/i.test(r.path))
        .forEach((r) => console.log(`  ${r.id}\t${r.path}`));
    }
    return;
  }

  const authorizerId = findOrCreateCognitoAuthorizer(accountId);

  const targets = resolveTargetResources(resources);
  if (targets.length === 0) {
    console.error(
      `No se encontró ningún recurso (path incluye "${RESOURCE_PATH_INCLUDES}", case insensitive) ni AGENDAMIENTO_RESOURCE_IDS.`,
    );
    logSamplePaths(resources);
    process.exit(1);
  }

  for (const res of targets) {
    const methods = res.resourceMethods ? Object.keys(res.resourceMethods) : [];
    if (methods.length === 0) {
      console.log(`(Sin métodos en recurso ${res.id} path=${res.path})`);
      continue;
    }
    console.log(`\nRecurso ${res.id} path=${res.path} métodos: ${methods.join(', ')}`);

    for (const httpMethod of methods) {
      if (httpMethod === 'OPTIONS') {
        console.log(`  omitir ${httpMethod} (CORS)`);
        continue;
      }
      let current;
      try {
        current = getMethod(res.id, httpMethod);
      } catch (e) {
        console.warn(`  no se pudo leer ${httpMethod}:`, e.message);
        continue;
      }
      const authType = current.authorizationType;
      if (authType === 'COGNITO_USER_POOLS' && String(current.authorizerId) === String(authorizerId)) {
        console.log(`  ${httpMethod}: ya usa Cognito (${authorizerId})`);
        continue;
      }
      console.log(`  ${httpMethod}: ${authType} → COGNITO_USER_POOLS`);
      setMethodCognito(res.id, httpMethod, authorizerId);
    }
  }

  console.log('\nDesplegando stage...');
  deployStage();
  console.log('\nListo. Pruebe de nuevo el front con Bearer JWT.');
}

try {
  main();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

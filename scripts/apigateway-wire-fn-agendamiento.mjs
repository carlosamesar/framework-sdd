/**
 * Crea (si no existen) los recursos REST API Gateway bajo `/api/v1/agendamiento` y
 * `{proxy+}`, integra **AWS_PROXY** con la Lambda `apisGoodErp-fnAgendamiento`,
 * asigna Cognito al tráfico autenticado y **NONE** solo en OPTIONS (preflight CORS),
 * añade permiso `lambda:InvokeFunction` y despliega el stage `dev`.
 *
 * Motivação: `/gd:start` — la Lambda existía sin recurso/trigger en el API `4j950zl6na`.
 *
 * Uso:
 *   node scripts/apigateway-wire-fn-agendamiento.mjs
 *   APIGATEWAY_WIRE_DRY_RUN=1 node scripts/apigateway-wire-fn-agendamiento.mjs
 *
 * Variables: REST_API_ID, STAGE_NAME, AWS_REGION, LAMBDA_FUNCTION_NAME, COGNITO_USER_POOL_ID
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
const LAMBDA_FUNCTION_NAME = process.env.LAMBDA_FUNCTION_NAME || 'apisGoodErp-fnAgendamiento';
const POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-1_gmre5QtIx';
const isDryRun = ['1', 'true', 'yes'].includes(String(process.env.APIGATEWAY_WIRE_DRY_RUN || '').toLowerCase());

function aws(args, { json = true } = {}) {
  const out = execFileSync('aws', args, {
    encoding: 'utf8',
    env: { ...process.env, AWS_DEFAULT_REGION: REGION },
  });
  if (!json) return out.trim();
  return JSON.parse(out || '{}');
}

/** get-method etc. sin ruido en stderr si el método/recurso no existe */
function awsMaybe(args, { json = true } = {}) {
  try {
    const out = execFileSync('aws', args, {
      encoding: 'utf8',
      env: { ...process.env, AWS_DEFAULT_REGION: REGION },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (!json) return out.trim();
    return JSON.parse(out || '{}');
  } catch {
    return null;
  }
}

function getAccountId() {
  return aws(['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text'], { json: false });
}

function listAllResources() {
  let position = null;
  const all = [];
  for (;;) {
    const args = ['apigateway', 'get-resources', '--rest-api-id', REST_API_ID, '--limit', '500'];
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

function findCognitoAuthorizerId(accountId) {
  const data = aws(['apigateway', 'get-authorizers', '--rest-api-id', REST_API_ID]);
  const items = data.items || [];
  const expectedArn = poolArn(accountId);
  const hit = items.find((a) => {
    if (a.type !== 'COGNITO_USER_POOLS') return false;
    const arns = a.providerARNs || [];
    return arns.some((arn) => arn === expectedArn || arn.includes(POOL_ID));
  });
  return hit?.id ?? null;
}

function getLambdaArn() {
  return aws(
    [
      'lambda',
      'get-function',
      '--function-name',
      LAMBDA_FUNCTION_NAME,
      '--query',
      'Configuration.FunctionArn',
      '--output',
      'text',
    ],
    { json: false },
  );
}

function integrationUri(lambdaArn) {
  return `arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`;
}

function ensureResource(parentId, pathPart, resources) {
  const existing = resources.find((r) => r.parentId === parentId && r.pathPart === pathPart);
  if (existing) {
    console.log(`Recurso ya existe: pathPart=${pathPart} id=${existing.id} path=${existing.path}`);
    return existing.id;
  }
  if (isDryRun) {
    console.log(`[DRY_RUN] create-resource parent=${parentId} pathPart=${pathPart}`);
    return `dry-${pathPart}`;
  }
  const created = aws([
    'apigateway',
    'create-resource',
    '--rest-api-id',
    REST_API_ID,
    '--parent-id',
    parentId,
    '--path-part',
    pathPart,
  ]);
  console.log(`Creado recurso pathPart=${pathPart} id=${created.id} path=${created.path}`);
  return created.id;
}

function putMethodAuth(resourceId, httpMethod, authorizationType, authorizerId) {
  if (isDryRun) {
    console.log(
      `[DRY_RUN] put-method ${httpMethod} ${authorizationType} resource=${resourceId}`,
    );
    return;
  }
  const existing = awsMaybe([
    'apigateway',
    'get-method',
    '--rest-api-id',
    REST_API_ID,
    '--resource-id',
    resourceId,
    '--http-method',
    httpMethod,
  ]);
  if (!existing) {
    if (isDryRun) {
      console.log(`[DRY_RUN] put-method ${httpMethod} ${authorizationType} resource=${resourceId}`);
      return;
    }
    const args = [
      'apigateway',
      'put-method',
      '--rest-api-id',
      REST_API_ID,
      '--resource-id',
      resourceId,
      '--http-method',
      httpMethod,
      '--authorization-type',
      authorizationType,
      '--no-api-key-required',
    ];
    if (authorizationType === 'COGNITO_USER_POOLS' && authorizerId) {
      args.push('--authorizer-id', authorizerId);
    }
    execFileSync('aws', args, { stdio: 'inherit', env: { ...process.env, AWS_DEFAULT_REGION: REGION } });
    console.log(`  put-method ${httpMethod} ${authorizationType}`);
    return;
  }

  const cur = existing.authorizationType;
  if (
    cur === authorizationType &&
    (authorizationType !== 'COGNITO_USER_POOLS' ||
      String(existing.authorizerId) === String(authorizerId))
  ) {
    console.log(`  ${httpMethod}: ya está ${authorizationType}`);
    return;
  }
  if (isDryRun) {
    console.log(`[DRY_RUN] update-method ${httpMethod} ${cur} → ${authorizationType}`);
    return;
  }
  const patches = [`op=replace,path=/authorizationType,value=${authorizationType}`];
  if (authorizationType === 'COGNITO_USER_POOLS' && authorizerId) {
    patches.push(`op=replace,path=/authorizerId,value=${authorizerId}`);
  }
  const argv = [
    'apigateway',
    'update-method',
    '--rest-api-id',
    REST_API_ID,
    '--resource-id',
    resourceId,
    '--http-method',
    httpMethod,
    '--patch-operations',
    `op=replace,path=/authorizationType,value=${authorizationType}`,
  ];
  if (authorizationType === 'NONE') {
    argv.push('op=remove,path=/authorizerId');
  } else if (authorizationType === 'COGNITO_USER_POOLS' && authorizerId) {
    argv.push(`op=replace,path=/authorizerId,value=${authorizerId}`);
  }
  execFileSync('aws', argv, { stdio: 'inherit', env: { ...process.env, AWS_DEFAULT_REGION: REGION } });
  console.log(`  update-method ${httpMethod} → ${authorizationType}`);
}

function putLambdaProxyIntegration(resourceId, httpMethod, lambdaArn) {
  const uri = integrationUri(lambdaArn);
  if (isDryRun) {
    console.log(`[DRY_RUN] put-integration ${httpMethod} AWS_PROXY → ${LAMBDA_FUNCTION_NAME}`);
    return;
  }
  execFileSync(
    'aws',
    [
      'apigateway',
      'put-integration',
      '--rest-api-id',
      REST_API_ID,
      '--resource-id',
      resourceId,
      '--http-method',
      httpMethod,
      '--type',
      'AWS_PROXY',
      '--integration-http-method',
      'POST',
      '--uri',
      uri,
      '--passthrough-behavior',
      'WHEN_NO_MATCH',
    ],
    { stdio: 'inherit', env: { ...process.env, AWS_DEFAULT_REGION: REGION } },
  );
  console.log(`  put-integration ${httpMethod} AWS_PROXY`);
}

function ensureLambdaInvokePermission(accountId, statementId) {
  const srcArn = `arn:aws:execute-api:${REGION}:${accountId}:${REST_API_ID}/*/*/*`;
  if (isDryRun) {
    console.log(`[DRY_RUN] lambda add-permission ${statementId}`);
    return;
  }
  try {
    execFileSync(
      'aws',
      [
        'lambda',
        'add-permission',
        '--function-name',
        LAMBDA_FUNCTION_NAME,
        '--statement-id',
        statementId,
        '--action',
        'lambda:InvokeFunction',
        '--principal',
        'apigateway.amazonaws.com',
        '--source-arn',
        srcArn,
      ],
      { stdio: 'pipe', encoding: 'utf8', env: process.env },
    );
    console.log(`Permiso Lambda OK: ${statementId}`);
  } catch (e) {
    const msg = String(e.stderr || e.message || e);
    if (msg.includes('already exists') || msg.includes('ResourceConflictException')) {
      console.log(`Permiso Lambda ya existía (${statementId}), se omite.`);
    } else {
      throw e;
    }
  }
}

function deploy() {
  if (isDryRun) {
    console.log('[DRY_RUN] create-deployment');
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
    'Wire fnAgendamiento — apigateway-wire-fn-agendamiento.mjs',
  ]);
  console.log(`Despliegue: ${dep.id ?? JSON.stringify(dep)}`);
}

function main() {
  console.log(
    `Wire Lambda ${LAMBDA_FUNCTION_NAME} ↔ API ${REST_API_ID} stage=${STAGE_NAME} dry-run=${isDryRun}`,
  );
  const accountId = getAccountId();
  const lambdaArn = getLambdaArn();
  console.log(`Cuenta=${accountId} LambdaArn=${lambdaArn}`);

  const authorizerId = findCognitoAuthorizerId(accountId);
  if (!authorizerId) {
    console.error('No hay autorizador Cognito en este API; cree uno o defina COGNITO_USER_POOL_ID.');
    process.exit(1);
  }
  console.log(`Authorizer Cognito id=${authorizerId}`);

  let resources = listAllResources();
  const v1 = resources.find((r) => r.path === '/api/v1');
  if (!v1?.id) {
    console.error('No existe recurso /api/v1 en este API. Revise REST_API_ID.');
    process.exit(1);
  }

  const agRegId = ensureResource(v1.id, 'agendamiento', resources);
  resources = listAllResources();
  const proxyRegId = ensureResource(agRegId, '{proxy+}', resources);

  console.log('\n=== /api/v1/agendamiento ===');
  putMethodAuth(agRegId, 'OPTIONS', 'NONE', null);
  putLambdaProxyIntegration(agRegId, 'OPTIONS', lambdaArn);
  putMethodAuth(agRegId, 'GET', 'COGNITO_USER_POOLS', authorizerId);
  putLambdaProxyIntegration(agRegId, 'GET', lambdaArn);
  putMethodAuth(agRegId, 'POST', 'COGNITO_USER_POOLS', authorizerId);
  putLambdaProxyIntegration(agRegId, 'POST', lambdaArn);

  console.log('\n=== /api/v1/agendamiento/{proxy+} ===');
  const methodsProxy = ['OPTIONS', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE'];
  for (const m of methodsProxy) {
    const auth =
      m === 'OPTIONS' ? { type: 'NONE', id: null } : { type: 'COGNITO_USER_POOLS', id: authorizerId };
    putMethodAuth(proxyRegId, m, auth.type, auth.id);
    putLambdaProxyIntegration(proxyRegId, m, lambdaArn);
  }

  ensureLambdaInvokePermission(accountId, 'apigateway-invoke-apisGoodErp-fnAgendamiento');

  console.log('\nDesplegando...');
  deploy();
  console.log(
    `\nHecho. Prueba: GET https://${REST_API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/api/v1/agendamiento`,
  );
}

try {
  main();
} catch (e) {
  console.error(e.stderr?.toString?.() || e.message || e);
  process.exit(1);
}

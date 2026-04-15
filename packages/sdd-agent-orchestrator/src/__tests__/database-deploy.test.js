// sdd-agent-orchestrator/src/__tests__/database-deploy.test.js
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { analyzeDatabase } = require('../database.cjs');
const { simulateDeploy } = require('../deploy.cjs');

describe('/gd:database', () => {
  it('detecta tablas sin tenant_id y convenciones', () => {
    const schema = {
      tables: [
        { name: 'users', columns: ['id', 'email'] },
        { name: 'tenant_orders', columns: ['id', 'tenant_id', 'amount'] }
      ]
    };
    const res = analyzeDatabase(schema);
    expect(res.missingTenantId).toContain('users');
    expect(res.conventionViolations).toContain('users');
    expect(res.suggestions).toContain('Agregar tenant_id a users');
    expect(res.suggestions).toContain('Renombrar users a tenant_users');
  });
});

describe('/gd:deploy', () => {
  it('detecta errores de configuración Lambda', () => {
    const res = simulateDeploy({ target: 'lambda' });
    expect(res.status).toBe('error');
    expect(res.errors).toContain('Falta nombre de función Lambda');
  });
  it('detecta errores de configuración ECS', () => {
    const res = simulateDeploy({ target: 'ecs' });
    expect(res.status).toBe('error');
    expect(res.errors).toContain('Falta nombre de servicio ECS');
  });
  it('advierte si faltan variables AWS', () => {
    const res = simulateDeploy({ target: 'lambda', function: 'myFunc' });
    expect(res.warnings).toContain('Variables AWS no definidas');
  });
  it('genera un plan real de GitHub Actions para ZIP', () => {
    const res = simulateDeploy({
      target: 'lambda',
      function: 'fnSede',
      lambdaPath: 'develop/backend/gooderp-orchestation/lib/lambda/core/fnSede',
      env: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
    });
    expect(res.status).toBe('success');
    expect(res.method).toBe('github-actions-zip');
    expect(res.workflow).toBe('.github/workflows/deploy-post-merge.yml');
    expect(res.steps).toContain('npm ci');
    expect(res.steps).toContain('aws lambda update-function-code');
  });
  it('advierte cuando falta la ruta de la lambda para empaquetar', () => {
    const res = simulateDeploy({
      target: 'lambda',
      function: 'fnSede',
      env: ['AWS_ACCESS_KEY_ID']
    });
    expect(res.warnings).toContain('Falta lambdaPath para empaquetado ZIP reproducible');
  });
});

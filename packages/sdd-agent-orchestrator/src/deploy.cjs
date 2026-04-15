const fs = require('fs');
const path = require('path');

function hasAwsCredentials(envList = []) {
  const values = Array.isArray(envList) ? envList : [];
  return values.includes('AWS_ACCESS_KEY_ID') || values.includes('AWS_LAMBDA_DEPLOY_ROLE_ARN');
}

function simulateDeploy(config = {}) {
  const result = {
    target: config.target,
    status: 'success',
    method: null,
    workflow: null,
    steps: [],
    warnings: [],
    errors: [],
    requiredSecrets: []
  };

  if (config.target === 'lambda') {
    if (!config.function) {
      result.status = 'error';
      result.errors.push('Falta nombre de función Lambda');
      return result;
    }

    result.method = 'github-actions-zip';
    result.workflow = '.github/workflows/deploy-post-merge.yml';
    result.steps = [
      'npm ci',
      'npm run build (si existe)',
      'node scripts/package-lambda-zip.mjs --lambda-path <path> --output <zip>',
      'aws lambda update-function-code'
    ];
    result.requiredSecrets = [
      'AWS_REGION',
      'AWS_LAMBDA_DEPLOY_ROLE_ARN o AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY'
    ];

    if (!config.lambdaPath) {
      result.warnings.push('Falta lambdaPath para empaquetado ZIP reproducible');
    } else {
      const resolvedPath = path.resolve(config.lambdaPath);
      if (!fs.existsSync(resolvedPath)) {
        result.warnings.push(`La ruta de la lambda no existe en el workspace: ${config.lambdaPath}`);
      }
    }

    if (!hasAwsCredentials(config.env) && !config.roleToAssume) {
      result.warnings.push('Variables AWS no definidas');
    }

    return result;
  }

  if (config.target === 'ecs') {
    if (!config.service) {
      result.status = 'error';
      result.errors.push('Falta nombre de servicio ECS');
      return result;
    }

    result.method = 'github-actions-ecs';
    result.workflow = '.github/workflows/deploy-post-merge.yml';
    result.steps = ['npm ci', 'docker build', 'aws ecs update-service'];

    if (!hasAwsCredentials(config.env) && !config.roleToAssume) {
      result.warnings.push('Variables AWS no definidas');
    }

    return result;
  }

  result.status = 'error';
  result.errors.push('Target de despliegue no soportado');
  return result;
}

function buildDeployPlan(config = {}) {
  return simulateDeploy(config);
}

module.exports = { simulateDeploy, buildDeployPlan };

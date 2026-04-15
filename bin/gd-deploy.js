#!/usr/bin/env node

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { simulateDeploy } from '../packages/sdd-agent-orchestrator/src/deploy.js';

const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  console.log('Uso: node bin/gd-deploy.js --target <lambda|ecs> [--function <name>] [--service <name>] [--lambda-path <ruta>] [--region <aws-region>] [--env <VAR1,VAR2,...>] [--execute]');
  process.exit(0);
}

const config = {};
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--target') config.target = args[i + 1];
  if (args[i] === '--function') config.function = args[i + 1];
  if (args[i] === '--service') config.service = args[i + 1];
  if (args[i] === '--lambda-path') config.lambdaPath = args[i + 1];
  if (args[i] === '--region') config.region = args[i + 1];
  if (args[i] === '--env') config.env = args[i + 1].split(',');
  if (args[i] === '--execute') config.execute = true;
}

const result = simulateDeploy(config);
console.log('Resultado despliegue:');
console.log(JSON.stringify(result, null, 2));

if (!config.execute || result.status !== 'success' || config.target !== 'lambda') {
  process.exit(result.status === 'success' ? 0 : 1);
}

if (!config.lambdaPath) {
  console.error('Se requiere --lambda-path para ejecutar el empaquetado real de la lambda.');
  process.exit(1);
}

const outputZip = path.resolve(process.cwd(), 'deploy.zip');
const packageResult = spawnSync(process.execPath, [
  'scripts/package-lambda-zip.mjs',
  '--lambda-path',
  config.lambdaPath,
  '--output',
  outputZip
], {
  stdio: 'inherit'
});

if (packageResult.status !== 0) {
  process.exit(packageResult.status ?? 1);
}

const region = config.region || process.env.AWS_REGION || 'us-east-1';
const deployResult = spawnSync('aws', [
  'lambda',
  'update-function-code',
  '--function-name',
  config.function,
  '--zip-file',
  `fileb://${outputZip}`,
  '--region',
  region
], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(deployResult.status ?? 0);

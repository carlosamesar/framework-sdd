#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SUBPKG = path.join(ROOT, 'packages', 'sdd-agent-orchestrator');
const SUBPKG_PACKAGE = path.join(SUBPKG, 'package.json');
const SUBPKG_LOCK = path.join(SUBPKG, 'package-lock.json');

const [, , action = 'test', ...extraArgs] = process.argv;

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  return res.status ?? 1;
}

function runNode(relPath, args = []) {
  return run(process.execPath, [path.join(ROOT, relPath), ...args]);
}

function runNpmScriptInSubpackage(scriptName, args = []) {
  const installCmd = fs.existsSync(SUBPKG_LOCK) ? 'ci' : 'install';
  let status = run('npm', [installCmd, '--prefix', SUBPKG]);
  if (status !== 0) return status;
  return run('npm', ['run', scriptName, '--prefix', SUBPKG, '--', ...args]);
}

function runWorkspaceFallback(kind, args = []) {
  console.log(`run-orchestrator-task: subpaquete no materializado; usando fallback local para ${kind}.`);

  if (kind === 'test') {
    let status = runNode('bin/sdd-agent.mjs', ['list-tools']);
    if (status !== 0) return status;
    return runNode('scripts/react-runner.mjs', ['--plan', 'scripts/fixtures/react-plan-smoke.json']);
  }

  if (kind === 'pipeline') {
    return runNode('scripts/react-runner.mjs', ['--plan', 'scripts/fixtures/react-plan-smoke.json']);
  }

  if (kind === 'gd-catalog') {
    return runNode('bin/sdd-agent.mjs', ['list-tools']);
  }

  if (kind === 'gd-phase') {
    return runNode('bin/sdd-agent.mjs', ['list-tools']);
  }

  if (kind === 'gd-cycle' || kind === 'gd-mega-flow' || kind === 'llm' || kind === 'audit-inventario') {
    console.log('run-orchestrator-task: fallback informativo activo; catálogo local disponible.');
    return runNode('bin/sdd-agent.mjs', ['list-tools']);
  }

  console.error(`run-orchestrator-task: acción no soportada: ${kind}`);
  return 1;
}

let exitCode;
if (fs.existsSync(SUBPKG_PACKAGE)) {
  const scriptMap = {
    test: 'test',
    pipeline: 'graph:pipeline',
    llm: 'graph:llm',
    'gd-cycle': 'graph:gd-cycle',
    'gd-catalog': 'graph:gd-catalog',
    'gd-phase': 'graph:gd-phase',
    'gd-mega-flow': 'graph:gd-mega-flow',
    'audit-inventario': 'graph:audit-inventario',
  };
  const scriptName = scriptMap[action];
  if (!scriptName) {
    console.error(`run-orchestrator-task: acción no soportada: ${action}`);
    process.exit(1);
  }
  exitCode = runNpmScriptInSubpackage(scriptName, extraArgs);
} else {
  exitCode = runWorkspaceFallback(action, extraArgs);
}

process.exit(exitCode);

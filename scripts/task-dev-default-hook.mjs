#!/usr/bin/env node
/**
 * Hook de ejemplo para watch-development-tasks.mjs:
 * marca running + ejecuta gd-cycle con el título de la tarea.
 *
 * TASK_DEV_HOOK=node scripts/task-dev-default-hook.mjs npm run task-dev:watch
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskId = process.env.TASK_ID || '';
const title = process.env.TASK_TITLE || 'Tarea sin título';

if (!taskId) {
  console.error('task-dev-default-hook: falta TASK_ID');
  process.exit(1);
}

const statusScript = path.join(ROOT, 'scripts/update-development-task-status.mjs');
let r = spawnSync(process.execPath, [statusScript, taskId, 'running'], {
  stdio: 'inherit',
  cwd: ROOT,
  env: process.env,
});
if (r.status !== 0) process.exit(r.status ?? 1);

const sddAgent = path.join(ROOT, 'bin/sdd-agent.mjs');
r = spawnSync(process.execPath, [sddAgent, 'gd-cycle', title], {
  stdio: 'inherit',
  cwd: ROOT,
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);

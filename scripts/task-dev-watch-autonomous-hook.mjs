#!/usr/bin/env node
/**
 * Para usar con watch-development-tasks.mjs: ejecuta solo la tarea nueva (TASK_ID) en modo autónomo.
 *
 * TASK_DEV_HOOK="node scripts/task-dev-watch-autonomous-hook.mjs" npm run task-dev:watch
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.env.TASK_ID;
if (!id) {
  console.error('Falta TASK_ID');
  process.exit(1);
}

const r = spawnSync(
  process.execPath,
  [path.join(ROOT, 'scripts/run-autonomous-dev-queue.mjs'), id],
  { cwd: ROOT, stdio: 'inherit', env: process.env },
);
process.exit(r.status === null ? 1 : r.status);

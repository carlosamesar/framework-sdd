#!/usr/bin/env node
/**
 * Observa tasks-development.md y, al aparecer un **id de tarea nuevo** con status `pending`,
 * ejecuta un hook (comando externo). Así el agente puede reaccionar sin editar el archivo a mano
 * en bucle: las actualizaciones de estado del mismo archivo no crean IDs nuevos.
 *
 * Estado local: tasks-development.watch.json (junto al .md o TASK_DEV_STATE_FILE)
 *
 * Variables:
 *   TASK_DEV_FILE        ruta al .md (default: <repo>/tasks-development.md)
 *   TASK_DEV_STATE_FILE  ruta al JSON de estado visto
 *   TASK_DEV_HOOK        comando a ejecutar (obligatorio para hacer algo útil)
 *   TASK_DEV_HOOK_SHELL  si "1", ejecuta con sh -c (default: spawn argv[0] con args)
 *   TASK_DEV_DEBOUNCE_MS default 800
 *
 * Ejemplo:
 *   TASK_DEV_HOOK='npx sdd-agent gd-cycle' npm run task-dev:watch
 *
 * El hook recibe env: TASK_ID, TASK_TITLE, TASK_STATUS, TASK_DEV_FILE
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskFile = process.env.TASK_DEV_FILE || path.join(ROOT, 'tasks-development.md');
const stateFile =
  process.env.TASK_DEV_STATE_FILE ||
  path.join(path.dirname(taskFile), 'tasks-development.watch.json');
const debounceMs = Math.max(200, Number(process.env.TASK_DEV_DEBOUNCE_MS) || 800);

function parseTaskctlDocs(text) {
  const re = /```taskctl\s*\n([\s\S]*?)```/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      const doc = parseYaml(m[1]);
      if (doc && typeof doc.id === 'string') {
        out.push(doc);
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

function loadState() {
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const j = JSON.parse(raw);
    if (j && Array.isArray(j.seenTaskIds) && j.seenTaskIds.length > 0) {
      return new Set(j.seenTaskIds);
    }
  } catch {
    /* sin estado */
  }
  return null;
}

function saveState(seen) {
  fs.writeFileSync(
    stateFile,
    JSON.stringify({ seenTaskIds: [...seen].sort(taskIdSort), updatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );
}

function taskIdSort(a, b) {
  const na = parseInt(String(a).replace(/^TASK-/i, ''), 10);
  const nb = parseInt(String(b).replace(/^TASK-/i, ''), 10);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

function findNewPendingTasks(docs, seen) {
  const byId = new Map();
  for (const d of docs) {
    if (!d.id) continue;
    byId.set(d.id, d);
  }
  const ids = [...byId.keys()].sort(taskIdSort);
  const newIds = ids.filter((id) => !seen.has(id));
  const pendingNew = newIds.filter((id) => byId.get(id)?.status === 'pending');
  return { byId, pendingNew };
}

function runHook(taskDoc) {
  const hook = process.env.TASK_DEV_HOOK;
  if (!hook || !hook.trim()) {
    console.error(
      '[task-dev:watch] Nueva tarea detectada:',
      taskDoc.id,
      '— defina TASK_DEV_HOOK para ejecutar un comando.',
    );
    return 1;
  }

  const env = {
    ...process.env,
    TASK_ID: taskDoc.id,
    TASK_TITLE: String(taskDoc.title || ''),
    TASK_STATUS: String(taskDoc.status || ''),
    TASK_DEV_FILE: taskFile,
  };

  if (process.env.TASK_DEV_HOOK_SHELL === '1') {
    const r = spawnSync(hook, { shell: true, env, stdio: 'inherit', cwd: ROOT });
    return r.status === null ? 1 : r.status;
  }

  const parts = hook.match(/(?:[^\s"]+|"[^"]*")+/g) || [hook];
  const argv = parts.map((p) => p.replace(/^"(.*)"$/, '$1'));
  const r = spawnSync(argv[0], argv.slice(1), { env, stdio: 'inherit', cwd: ROOT });
  return r.status === null ? 1 : r.status;
}

let seen = loadState();
let debounceTimer = null;
let processing = false;

function bootstrapIfNeeded(docs) {
  if (seen !== null) return;
  seen = new Set();
  for (const d of docs) {
    if (d.id) seen.add(d.id);
  }
  saveState(seen);
  console.error(
    `[task-dev:watch] Inicializado: ${seen.size} id(s) registrados en ${path.basename(stateFile)}. ` +
      'Solo se disparará el hook cuando **añadas** un bloque TASK-00N nuevo con status pending.',
  );
}

function processFile() {
  if (processing) return;
  processing = true;
  try {
    let text;
    try {
      text = fs.readFileSync(taskFile, 'utf8');
    } catch {
      return;
    }
    let docs = parseTaskctlDocs(text);
    bootstrapIfNeeded(docs);

    // Varias tareas nuevas pending en un mismo guardado: procesar en orden
    // Releer el archivo tras cada hook exitoso por si el hook lo modificó.
    while (true) {
      text = fs.readFileSync(taskFile, 'utf8');
      docs = parseTaskctlDocs(text);
      const { byId, pendingNew } = findNewPendingTasks(docs, seen);
      if (pendingNew.length === 0) break;

      const nextId = pendingNew[0];
      const doc = byId.get(nextId);
      console.error(`[task-dev:watch] Disparando hook para ${nextId} (${doc.title || 'sin título'})…`);
      const code = runHook(doc);
      if (code === 0) {
        seen.add(nextId);
        saveState(seen);
        console.error(
          `[task-dev:watch] Hook exit 0 — ${nextId} registrado en estado (no se relanza salvo nuevo id).`,
        );
      } else {
        console.error(
          `[task-dev:watch] Hook exit ${code} — ${nextId} no registrado; corregí el hook o el archivo.`,
        );
        break;
      }
    }
  } finally {
    processing = false;
  }
}

function scheduleProcess() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    try {
      processFile();
    } catch (e) {
      console.error('[task-dev:watch]', e);
    }
  }, debounceMs);
}

if (!fs.existsSync(taskFile)) {
  console.error('No existe TASK_DEV_FILE:', taskFile);
  process.exit(1);
}

console.error(`[task-dev:watch] Observando ${taskFile}`);
console.error(`[task-dev:watch] Estado: ${stateFile}`);

fs.watch(taskFile, { persistent: true }, () => {
  scheduleProcess();
});

// Primera pasada (por si el archivo ya tenía cambios sin evento)
scheduleProcess();

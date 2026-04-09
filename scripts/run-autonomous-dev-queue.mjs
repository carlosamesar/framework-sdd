#!/usr/bin/env node
/**
 * Procesa en orden todas las tareas con status **pending** en tasks-development.md:
 * running → (comandos configurables) → evidencia en markdown → certified | failed
 * y notificaciones por correo si están definidas (ver notify-task-email.mjs).
 *
 * Variables principales:
 *   TASK_DEV_CMD_WORKFLOW   Si está definido, un solo comando cubre todo (implement+deploy+test).
 *   TASK_DEV_CMD_SPEC       Opcional (p.ej. gd-cycle, audit)
 *   TASK_DEV_CMD_IMPLEMENT  Implementación / build en repo producto
 *   TASK_DEV_CMD_DEPLOY     Despliegue
 *   TASK_DEV_CMD_TEST       Pruebas
 *   TASK_DEV_WORKDIR        cwd para los comandos (default: raíz Framework-SDD)
 *   TASK_DEV_EVIDENCE_DIR   default: evidence/autonomous
 *   TASK_NOTIFY_TO + RESEND_API_KEY | SENDGRID_API_KEY  (correo)
 *   TASK_NOTIFY_DISABLE=1   sin enviar correo ni escribir fallback
 *
 * El bloque taskctl recibe evidence_path al certificar (TASK_DEV_EVIDENCE_PATH).
 *
 * Uso:
 *   node scripts/run-autonomous-dev-queue.mjs              # todas las pending
 *   node scripts/run-autonomous-dev-queue.mjs TASK-004      # solo esa si está pending
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { parse as parseYaml } from 'yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const taskFile = process.env.TASK_DEV_FILE || path.join(ROOT, 'tasks-development.md');
const notifyScript = path.join(ROOT, 'scripts/notify-task-email.mjs');
const updateScript = path.join(ROOT, 'scripts/update-development-task-status.mjs');

function notify(subject, body) {
  if (process.env.TASK_NOTIFY_DISABLE === '1') return;
  spawnSync(process.execPath, [notifyScript, subject], {
    cwd: ROOT,
    env: { ...process.env, NOTIFY_BODY: body },
    stdio: 'inherit',
  });
}

function parseTaskDocs() {
  if (!fs.existsSync(taskFile)) {
    throw new Error(`No existe TASK_DEV_FILE: ${taskFile}`);
  }
  const text = fs.readFileSync(taskFile, 'utf8');
  const re = /```taskctl\s*\n([\s\S]*?)```/g;
  const docs = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      const doc = parseYaml(m[1]);
      if (doc?.id) docs.push(doc);
    } catch {
      /* ignore */
    }
  }
  return docs;
}

function taskNum(id) {
  return parseInt(String(id).replace(/^TASK-/i, ''), 10);
}

function runShell(title, cmd, lines) {
  lines.push(`\n## ${title}\n`);
  const c = cmd?.trim();
  if (!c) {
    lines.push('_Omitido: comando no definido en variables de entorno._\n');
    return 0;
  }
  lines.push(`\`\`\`bash\n${c}\n\`\`\`\n`);
  const cwd = process.env.TASK_DEV_WORKDIR || ROOT;
  const r = spawnSync(c, {
    shell: true,
    cwd,
    env: { ...process.env },
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  const code = r.status === null ? 1 : r.status;
  lines.push(`\n**exit:** ${code}\n`);
  lines.push(`\n### stdout\n\`\`\`\n${r.stdout || ''}\n\`\`\`\n`);
  lines.push(`\n### stderr\n\`\`\`\n${r.stderr || ''}\n\`\`\`\n`);
  return code;
}

function updateStatus(taskId, status, reason = '', extra = {}) {
  const args = [updateScript, taskId, status];
  if (reason) args.push(reason);
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...extra },
  });
}

function hasAnyCommand() {
  if (process.env.TASK_DEV_CMD_WORKFLOW?.trim()) return true;
  return ['TASK_DEV_CMD_SPEC', 'TASK_DEV_CMD_IMPLEMENT', 'TASK_DEV_CMD_DEPLOY', 'TASK_DEV_CMD_TEST'].some(
    (k) => process.env[k]?.trim(),
  );
}

function runOneTask(doc) {
  if (!hasAnyCommand() && process.env.TASK_DEV_ALLOW_EMPTY !== '1') {
    throw new Error(
      'Definí TASK_DEV_CMD_WORKFLOW o al menos uno de TASK_DEV_CMD_SPEC / _IMPLEMENT / _DEPLOY / _TEST. ' +
        'Para dry-run sin comandos: TASK_DEV_ALLOW_EMPTY=1',
    );
  }

  const id = doc.id;
  const taskTitle = doc.title || id;
  const envExtra = {
    TASK_ID: id,
    TASK_TITLE: taskTitle,
    TASK_DEV_FILE: taskFile,
  };

  notify(
    `[SDD] Inicio ${id}`,
    `Tarea: ${taskTitle}\nUTC: ${new Date().toISOString()}\nArchivo: ${taskFile}`,
  );

  let r = updateStatus(id, 'running', '', envExtra);
  if (r.status !== 0) throw new Error(`No se pudo marcar ${id} como running`);

  const lines = [
    `# Evidencia — cola autónoma`,
    ``,
    `- **ID:** ${id}`,
    `- **Título:** ${taskTitle}`,
    `- **Inicio UTC:** ${new Date().toISOString()}`,
    `- **WORKDIR:** ${process.env.TASK_DEV_WORKDIR || ROOT}`,
    ``,
  ];

  let code = 0;
  const wf = process.env.TASK_DEV_CMD_WORKFLOW?.trim();

  if (wf) {
    lines.push(`_Modo monolítico: TASK_DEV_CMD_WORKFLOW_\n`);
    code = runShell('workflow', wf, lines);
  } else {
    code |= runShell('spec / SDD (opcional)', process.env.TASK_DEV_CMD_SPEC, lines);
    code |= runShell('implementación', process.env.TASK_DEV_CMD_IMPLEMENT, lines);

    if (process.env.TASK_DEV_CMD_DEPLOY?.trim()) {
      updateStatus(id, 'deploying', '', envExtra);
      notify(`[SDD] ${id} — despliegue`, `Ejecutando TASK_DEV_CMD_DEPLOY`);
      code |= runShell('despliegue', process.env.TASK_DEV_CMD_DEPLOY, lines);
    }

    if (process.env.TASK_DEV_CMD_TEST?.trim()) {
      updateStatus(id, 'testing', '', envExtra);
      notify(`[SDD] ${id} — pruebas`, `Ejecutando TASK_DEV_CMD_TEST`);
      code |= runShell('pruebas funcionales', process.env.TASK_DEV_CMD_TEST, lines);
    }
  }

  const evidenceDir = process.env.TASK_DEV_EVIDENCE_DIR || path.join(ROOT, 'evidence', 'autonomous');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const relName = `${id}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
  const evidenceAbs = path.join(evidenceDir, relName);
  const evidenceRel = path.relative(ROOT, evidenceAbs);

  lines.push(`\n---\n`);
  lines.push(`**Fin UTC:** ${new Date().toISOString()}\n`);
  lines.push(`**Código acumulado (0 = éxito):** ${code}\n`);

  fs.writeFileSync(evidenceAbs, lines.join('\n'), 'utf8');

  if (code === 0) {
    const cert = spawnSync(process.execPath, [updateScript, id, 'certified'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...envExtra,
        TASK_DEV_EVIDENCE_PATH: evidenceRel.replace(/\\/g, '/'),
      },
    });
    if (cert.status !== 0) throw new Error(`No se pudo certificar ${id}`);
    notify(
      `[SDD] ✓ ${id} certificada`,
      `Evidencia: ${evidenceRel}\n`,
    );
  } else {
    updateStatus(id, 'failed', `exit acumulado ${code}`, envExtra);
    notify(
      `[SDD] ✗ ${id} falló`,
      `Código: ${code}\nEvidencia parcial: ${evidenceRel}\n`,
    );
  }
}

function main() {
  const onlyId = process.argv[2];
  const docs = parseTaskDocs();
  let pending = docs
    .filter((d) => d.status === 'pending')
    .sort((a, b) => taskNum(a.id) - taskNum(b.id));

  if (onlyId) {
    pending = pending.filter((d) => d.id === onlyId);
    if (pending.length === 0) {
      const exists = docs.some((d) => d.id === onlyId);
      const st = docs.find((d) => d.id === onlyId)?.status;
      console.error(
        JSON.stringify(
          {
            ok: false,
            message: exists
              ? `${onlyId} no está en pending (estado actual: ${st})`
              : `No existe ${onlyId} en ${taskFile}`,
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }
  }

  if (pending.length === 0) {
    console.log(JSON.stringify({ ok: true, message: 'Sin tareas pending', count: 0 }, null, 2));
    return;
  }

  notify(
    `[SDD] Cola autónoma iniciada`,
    `Tareas pending: ${pending.map((p) => p.id).join(', ')}\nTotal: ${pending.length}`,
  );

  for (const doc of pending) {
    runOneTask(doc);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        processed: pending.map((p) => p.id),
        message: 'Cola procesada (revisar estados y evidence/)',
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (e) {
  console.error(e);
  notify(`[SDD] Error cola autónoma`, String(e.message || e));
  process.exit(1);
}

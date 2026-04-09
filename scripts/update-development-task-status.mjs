#!/usr/bin/env node
/**
 * Actualiza el bloque ```taskctl de tasks-development.md y regenera la tabla resumen.
 *
 * Uso:
 *   node scripts/update-development-task-status.mjs --sync
 *   node scripts/update-development-task-status.mjs <TASK-ID> <status> [motivo_si_failed_o_blocked]
 *   TASK_DEV_FILE=/ruta/tasks-development.md ...
 *
 * Estados válidos: pending | running | deploying | testing | certified | failed | blocked | skipped
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const VALID = new Set([
  'pending',
  'running',
  'deploying',
  'testing',
  'certified',
  'failed',
  'blocked',
  'skipped',
]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const taskFile = process.env.TASK_DEV_FILE || path.join(ROOT, 'tasks-development.md');

function parseTaskctlBlocks(text) {
  const re = /```taskctl\s*\n([\s\S]*?)```/g;
  const blocks = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      const doc = parseYaml(m[1]);
      if (doc && typeof doc.id === 'string') {
        blocks.push({ raw: m[0], inner: m[1], doc, start: m.index });
      }
    } catch {
      /* ignore */
    }
  }
  return blocks;
}

function updateBlock(inner, nextDoc) {
  return stringifyYaml(nextDoc).trimEnd() + '\n';
}

function replaceTaskctlById(fullText, taskId, mutator) {
  const re = /```taskctl\s*\n([\s\S]*?)```/g;
  let replaced = false;
  const out = fullText.replace(re, (full, inner) => {
    let doc;
    try {
      doc = parseYaml(inner);
    } catch {
      return full;
    }
    if (!doc || doc.id !== taskId) return full;
    replaced = true;
    const next = mutator({ ...doc });
    return '```taskctl\n' + updateBlock(inner, next) + '```';
  });
  if (!replaced) throw new Error(`No se encontró taskctl con id: ${taskId}`);
  return out;
}

function injectQueueSummary(fullText, blocks) {
  const start = '<!-- TASK_QUEUE_SUMMARY_START -->';
  const end = '<!-- TASK_QUEUE_SUMMARY_END -->';
  if (!fullText.includes(start) || !fullText.includes(end)) {
    return fullText;
  }
  const rows = [
    '| ID | Título (H2) | Estado | Actualizado (UTC) | Certificado (UTC) |',
    '|----|-------------|--------|---------------------|---------------------|',
  ];
  for (const b of blocks) {
    const d = b.doc;
    rows.push(
      `| ${d.id} | ${d.title || '—'} | **${d.status || '—'}** | ${d.updated_at || '—'} | ${d.certified_at || '—'} |`,
    );
  }
  const table = rows.join('\n') + '\n';
  return fullText.replace(
    new RegExp(`${escapeRe(start)}[\\s\\S]*?${escapeRe(end)}`, 'm'),
    `${start}\n${table}${end}`,
  );
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTitleForId(fullText, taskId) {
  const h2 = new RegExp(`^##\\s+${escapeRe(taskId)}\\s+[—-]\\s*(.+)$`, 'm');
  const m = fullText.match(h2);
  return m ? m[1].trim() : '';
}

function syncSummaryOnly() {
  if (!fs.existsSync(taskFile)) {
    console.error('No existe:', taskFile);
    process.exit(1);
  }
  let text = fs.readFileSync(taskFile, 'utf8');
  const blocks = parseTaskctlBlocks(text).map((b) => {
    const doc = parseYaml(b.inner);
    if (doc.id && !doc.title) {
      doc.title = extractTitleForId(text, doc.id) || '';
    }
    return { ...b, doc };
  });
  text = injectQueueSummary(text, blocks);
  fs.writeFileSync(taskFile, text, 'utf8');
  console.log(
    JSON.stringify(
      { ok: true, synced: true, task_count: blocks.length, file: taskFile },
      null,
      2,
    ),
  );
}

function main() {
  if (process.argv[2] === '--sync') {
    syncSummaryOnly();
    return;
  }

  const taskId = process.argv[2];
  const status = process.argv[3];
  const reason = process.argv.slice(4).join(' ').trim();

  if (!taskId || !status) {
    console.error(
      'Uso: node scripts/update-development-task-status.mjs --sync\n' +
        '   node scripts/update-development-task-status.mjs <TASK-ID> <status> [motivo]\n' +
        `Archivo: ${taskFile}\n` +
        `Estados: ${[...VALID].join(', ')}`,
    );
    process.exit(1);
  }

  if (!VALID.has(status)) {
    console.error('Estado inválido:', status);
    process.exit(1);
  }

  if (!fs.existsSync(taskFile)) {
    console.error('No existe:', taskFile);
    process.exit(1);
  }

  let text = fs.readFileSync(taskFile, 'utf8');

  const now = new Date().toISOString();

  text = replaceTaskctlById(text, taskId, (doc) => {
    doc.status = status;
    doc.updated_at = now;
    doc.updated_by = process.env.TASK_DEV_UPDATED_BY || 'agent';
    if (status === 'certified') {
      doc.certified_at = now;
      doc.blocker = '';
      doc.failure_reason = '';
      if (process.env.TASK_DEV_EVIDENCE_PATH) {
        doc.evidence_path = process.env.TASK_DEV_EVIDENCE_PATH;
      }
    }
    if (status === 'failed' || status === 'blocked') {
      doc.failure_reason = reason || doc.failure_reason || '';
      if (status === 'blocked') doc.blocker = reason || doc.blocker || '';
    }
    if (!doc.title) {
      doc.title = extractTitleForId(text, taskId) || doc.title;
    }
    return doc;
  });

  const blocks = parseTaskctlBlocks(text).map((b) => {
    const doc = parseYaml(b.inner);
    if (doc.id && !doc.title) {
      doc.title = extractTitleForId(text, doc.id) || '';
    }
    return { ...b, doc };
  });

  text = injectQueueSummary(text, blocks);

  fs.writeFileSync(taskFile, text, 'utf8');
  console.log(JSON.stringify({ ok: true, taskId, status, file: taskFile, updated_at: now }, null, 2));
}

main();

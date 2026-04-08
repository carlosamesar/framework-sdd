#!/usr/bin/env node
/**
 * Genera reporte JSON de verificación por change (tasks completadas + specs presentes).
 * Uso: node scripts/verify-change.mjs <slug> | --all
 * Salida: reports/verify-<slug>.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');

function readChangesRoot() {
  const cfg = path.join(REPO_ROOT, 'openspec', 'config.yaml');
  if (!fs.existsSync(cfg)) return path.join('openspec', 'changes');
  const text = fs.readFileSync(cfg, 'utf8');
  const m = text.match(/changes_root:\s*(\S+)/);
  return m ? m[1].replace(/['"]/g, '') : path.join('openspec', 'changes');
}

function parseTasks(tasksMd) {
  if (!fs.existsSync(tasksMd)) {
    return { total: 0, done: 0, lines: [] };
  }
  const text = fs.readFileSync(tasksMd, 'utf8');
  const re = /-\s*\[([ xX])\]\s*(.+)/g;
  let m;
  const items = [];
  while ((m = re.exec(text)) !== null) {
    items.push({ done: m[1].toLowerCase() === 'x', text: m[2].trim() });
  }
  const done = items.filter((i) => i.done).length;
  return { total: items.length, done, items };
}

function listSpecFiles(specsDir) {
  if (!fs.existsSync(specsDir)) return [];
  const out = [];
  const walk = (dir) => {
    for (const x of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, x.name);
      if (x.isDirectory()) walk(p);
      else if (x.name.endsWith('.md')) out.push(path.relative(REPO_ROOT, p));
    }
  };
  walk(specsDir);
  return out;
}

function verifyChange(slug) {
  const changesRel = readChangesRoot();
  const changeDir = path.join(REPO_ROOT, changesRel, slug);
  if (!fs.existsSync(changeDir)) {
    return { error: `Change no encontrado: ${slug}`, path: changeDir };
  }

  const tasksPath = path.join(changeDir, 'tasks.md');
  const tasks = parseTasks(tasksPath);
  const specFiles = listSpecFiles(path.join(changeDir, 'specs'));

  const artifacts = {
    proposal: fs.existsSync(path.join(changeDir, 'proposal.md')),
    design: fs.existsSync(path.join(changeDir, 'design.md')),
    tasks: fs.existsSync(tasksPath),
  };

  const tasksComplete = tasks.total > 0 && tasks.done === tasks.total;
  const hasSpecs = specFiles.length > 0;

  let status;
  if (tasks.total === 0) {
    status = hasSpecs ? 'SPEC_ONLY' : 'INCOMPLETE';
  } else if (tasksComplete && hasSpecs) {
    status = 'PASS';
  } else if (tasksComplete) {
    status = 'PASS_WITH_WARNING';
  } else {
    status = 'FAIL';
  }

  return {
    change: slug,
    timestamp: new Date().toISOString(),
    schema_version: 1,
    artifacts,
    spec_files: specFiles,
    tasks: {
      total: tasks.total,
      done: tasks.done,
      percent: tasks.total ? Math.round((tasks.done / tasks.total) * 100) : null,
    },
    status,
    criteria: {
      all_tasks_checked: tasksComplete,
      has_spec_files: hasSpecs,
    },
  };
}

function writeReport(slug, data) {
  const dir = path.join(REPO_ROOT, 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `verify-${slug}.json`);
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
  return out;
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Uso: npm run spec:verify -- <slug> | --all');
    process.exit(1);
  }

  const changesAbs = path.join(REPO_ROOT, readChangesRoot());
  const slugs =
    arg === '--all'
      ? fs
          .readdirSync(changesAbs, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : [arg];

  const summaries = [];
  for (const slug of slugs) {
    const data = verifyChange(slug);
    if (data.error) {
      console.error(data.error);
      summaries.push({ slug, error: data.error });
      continue;
    }
    const outPath = writeReport(slug, data);
    console.log(`Escrito ${path.relative(REPO_ROOT, outPath)} — status=${data.status}`);
    summaries.push({ slug, status: data.status, path: outPath });
  }

  const bad = summaries.filter(
    (s) => s.error || s.status === 'FAIL' || s.status === 'INCOMPLETE',
  );
  process.exit(bad.length ? 1 : 0);
}

main();

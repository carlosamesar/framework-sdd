#!/usr/bin/env node
/**
 * Valida estructura mínima de OpenSpec bajo openspec/changes (y opcionalmente frontmatter en specs).
 * Sin dependencias externas. Exit 0 = OK, 1 = errores.
 */
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from './lib/paths.mjs';

const REPO_ROOT = getProjectRoot();

function readChangesRoot() {
  const cfg = path.join(REPO_ROOT, 'openspec', 'config.yaml');
  if (!fs.existsSync(cfg)) return path.join('openspec', 'changes');
  const text = fs.readFileSync(cfg, 'utf8');
  const m = text.match(/changes_root:\s*(\S+)/);
  return m ? m[1].replace(/['"]/g, '') : path.join('openspec', 'changes');
}

const ENTRY_FILES = ['proposal.md', 'design.md', 'tasks.md'];

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Carpetas de change bajo changes_root: hijos directos + hijos de archive/ (no tratar archive como change). */
function listChangeDirectories(changesAbs) {
  const dirs = [];
  for (const ent of fs.readdirSync(changesAbs, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ent.name === 'archive') {
      const arch = path.join(changesAbs, 'archive');
      for (const sub of fs.readdirSync(arch, { withFileTypes: true })) {
        if (sub.isDirectory()) dirs.push(path.join(arch, sub.name));
      }
      continue;
    }
    dirs.push(path.join(changesAbs, ent.name));
  }
  return dirs;
}

/** Spec debe contener escenarios verificables (Gherkin o Dado/Cuando/Entonces o escenarios tabulados). */
function specHasScenarios(content) {
  const c = content.replace(/\r\n/g, '\n');
  const boldGherkin =
    /\*\*(?:GIVEN|WHEN|THEN|Dado|Cuando|Entonces)\*\*/i.test(c) ||
    (/\*\*Dado\*\*/i.test(c) && /\*\*Cuando\*\*/i.test(c) && /\*\*Entonces\*\*/i.test(c));
  const lineGherkin = /^(GIVEN|WHEN|THEN)\s+/im.test(c);
  const listGherkin = /(^|\n)\s*-\s+(GIVEN|WHEN|THEN|Dado|Cuando|Entonces)\b/i.test(c);
  const scenarioBlocks = /(?:^|\n)#{3,4}\s+(?:Scenario|Escenario|\d+|R\d+)/i.test(c);
  const tableMust =
    /\n\|\s*#\s*\|\s*Requirement/i.test(c) && /\bMUST\b/.test(c) && /\|\s*R\d+/i.test(c);
  return (
    boldGherkin ||
    lineGherkin ||
    listGherkin ||
    (scenarioBlocks && /\*\*(?:WHEN|GIVEN|THEN|Cuando)/i.test(c)) ||
    (scenarioBlocks && listGherkin) ||
    tableMust
  );
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return { body: content, fm: null };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { body: content, fm: null };
  const block = content.slice(4, end);
  const body = content.slice(end + 5);
  const fm = {};
  for (const line of block.split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return { body, fm };
}

function validateSpecFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { body, fm } = parseFrontmatter(content);
  const errs = [];
  if (fm && Object.keys(fm).length && !fm.id) {
    errs.push('frontmatter sin campo id');
  }
  if (!specHasScenarios(body)) {
    errs.push(
      'sin escenarios detectables (use **GIVEN**/**WHEN**/**THEN**, **Dado**/**Cuando**/**Entonces**, o tabla Requirements+MUST+R#)',
    );
  }
  return errs;
}

function hasTaskCheckboxes(tasksPath) {
  const t = fs.readFileSync(tasksPath, 'utf8');
  return /-\s*\[[ xX]\]/.test(t);
}

function main() {
  const changesRel = readChangesRoot();
  const changesAbs = path.join(REPO_ROOT, changesRel);

  const errors = [];
  const warnings = [];

  if (!isDir(changesAbs)) {
    errors.push(`Directorio de changes no existe: ${changesRel}`);
    printReport(errors, warnings);
    process.exit(1);
  }

  const changeDirs = listChangeDirectories(changesAbs);

  if (changeDirs.length === 0) {
    warnings.push(`Sin carpetas de change bajo ${changesRel} (OK si aún no hay changes).`);
  }

  for (const changeDir of changeDirs) {
    const slug = path.relative(changesAbs, changeDir);
    const hasEntry = ENTRY_FILES.some((f) => fs.existsSync(path.join(changeDir, f)));
    if (!hasEntry) {
      errors.push(`[${slug}] falta al menos uno de: ${ENTRY_FILES.join(', ')}`);
      continue;
    }

    const tasksPath = path.join(changeDir, 'tasks.md');
    if (fs.existsSync(tasksPath) && !hasTaskCheckboxes(tasksPath)) {
      warnings.push(`[${slug}] tasks.md sin checkboxes - [ ] / [x] (recomendado)`);
    }

    const specsDir = path.join(changeDir, 'specs');
    if (!fs.existsSync(specsDir)) continue;

    const walkMd = (dir) => {
      for (const x of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, x.name);
        if (x.isDirectory()) walkMd(p);
        else if (x.isFile() && x.name.endsWith('.md')) {
          const rel = path.relative(REPO_ROOT, p);
          const specErrs = validateSpecFile(p);
          for (const e of specErrs) errors.push(`[${rel}] ${e}`);
        }
      }
    };
    walkMd(specsDir);
  }

  printReport(errors, warnings);
  process.exit(errors.length ? 1 : 0);
}

function printReport(errors, warnings) {
  if (warnings.length) {
    console.warn('Advertencias:');
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  if (errors.length) {
    console.error('Errores de validación OpenSpec:');
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    console.log('spec:validate — OK');
  }
}

main();

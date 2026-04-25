#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const idx = arg.indexOf('=');
    if (idx > -1) {
      opts[arg.substring(2, idx)] = arg.substring(idx + 1);
    } else {
      opts[arg.substring(2)] = true;
    }
  }
  return opts;
}

function findArchivedChange(archiveRoot, slug) {
  if (!existsSync(archiveRoot)) return null;

  return readdirSync(archiveRoot)
    .sort()
    .reverse()
    .find(name => name.endsWith(`-${slug}`)) || null;
}

const opts = parseArgs(process.argv.slice(2));
const changeSlug = opts.change;
const force = opts.force === true;
const jsonOutput = opts.json === true;

if (!changeSlug) {
  console.error('Usage: node scripts/activate-change.mjs --change=<slug> [--force] [--json]');
  process.exit(1);
}

const repoRoot = getWorkspaceRoot();
const changesRoot = path.join(repoRoot, 'openspec', 'changes');
const archiveRoot = path.join(changesRoot, 'archive');
const targetDir = path.join(changesRoot, changeSlug);

if (existsSync(targetDir) && !force) {
  const output = {
    change_slug: changeSlug,
    status: 'already-active',
    target_dir: targetDir,
    source_dir: null,
  };
  if (jsonOutput) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`[activate-change] already active: ${targetDir}`);
  }
  process.exit(0);
}

const archivedFolder = findArchivedChange(archiveRoot, changeSlug);
if (!archivedFolder) {
  console.error(`Archived change not found for slug: ${changeSlug}`);
  console.error(`Expected folder suffix '-${changeSlug}' under ${archiveRoot}`);
  process.exit(1);
}

const sourceDir = path.join(archiveRoot, archivedFolder);
mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, {
  recursive: true,
  force: true,
});

const output = {
  change_slug: changeSlug,
  status: 'activated',
  source_dir: sourceDir,
  target_dir: targetDir,
};

if (jsonOutput) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(`[activate-change] activated ${changeSlug}`);
  console.log(`[activate-change] source=${sourceDir}`);
  console.log(`[activate-change] target=${targetDir}`);
}

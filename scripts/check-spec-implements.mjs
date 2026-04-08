#!/usr/bin/env node
/**
 * Contrasta frontmatter `implements:` en specs OpenSpec con archivos del repo.
 * - Rutas bajo openspec/, docs/, scripts/, rag/, .github/ DEBEN existir (fs o git ls-files).
 * - Rutas típicas de otro monorepo (lib/, servicio-*, develop/, terraform/) se informan sin fallar.
 * Exit 1 solo ante rutas internas faltantes o paths inválidos (.., absolutas).
 * CLI: [--root /ruta/repo] [--verbose]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getProjectRoot } from './lib/paths.mjs';

const DEFAULT_ROOT = getProjectRoot();

function parseCliRoot() {
  const argv = process.argv;
  let repoRoot = DEFAULT_ROOT;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--root' && argv[i + 1]) {
      repoRoot = path.resolve(argv[++i]);
    }
  }
  return repoRoot;
}

const INTERNAL_PREFIXES = ['openspec/', 'docs/', 'scripts/', 'rag/', '.github/'];

function walkMarkdown(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      walkMarkdown(p, out);
    } else if (ent.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function extractFrontmatterBlock(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

/** Extrae lista bajo clave implements (YAML indentado con -). */
function parseImplementsList(fmBlock) {
  const paths = [];
  let inImplements = false;
  for (const line of fmBlock.split('\n')) {
    if (/^implements:\s*$/.test(line)) {
      inImplements = true;
      continue;
    }
    if (!inImplements) continue;
    const item = line.match(/^\s*-\s*["']?([^"'\n]+?)["']?\s*$/);
    if (item) {
      paths.push(item[1].trim());
      continue;
    }
    if (/^\S[^:]*:\s*/.test(line) && !line.trimStart().startsWith('-')) break;
  }
  return paths;
}

function isInternalPath(p) {
  const n = p.replace(/\\/g, '/');
  return INTERNAL_PREFIXES.some((pre) => n === pre || n.startsWith(pre));
}

function isCrossRepoHint(p) {
  const n = p.replace(/\\/g, '/');
  return (
    n.startsWith('lib/') ||
    n.startsWith('servicio-') ||
    n.startsWith('develop/') ||
    n.startsWith('terraform/')
  );
}

function safeRelativePath(raw) {
  const n = raw.replace(/\\/g, '/').trim();
  if (!n || n.startsWith('/')) return { ok: false, reason: 'ruta vacía o absoluta' };
  if (n.includes('..')) return { ok: false, reason: 'path traversal' };
  return { ok: true, normalized: n };
}

function existsInRepo(rel, repoRoot) {
  const abs = path.join(repoRoot, rel);
  if (fs.existsSync(abs)) return true;
  try {
    const out = execFileSync('git', ['ls-files', '--', rel], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function main() {
  const verbose = process.argv.includes('--verbose');
  const REPO_ROOT = parseCliRoot();
  const openspecDir = path.join(REPO_ROOT, 'openspec');
  const mdFiles = walkMarkdown(openspecDir);

  let errors = 0;
  let specsWithImplements = 0;
  let internalOk = 0;
  let externalRefs = 0;

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fm = extractFrontmatterBlock(content);
    if (!fm || !fm.includes('implements:')) continue;

    const impl = parseImplementsList(fm);
    if (impl.length === 0) continue;

    specsWithImplements++;
    const relSpec = path.relative(REPO_ROOT, file);

    for (const raw of impl) {
      const s = safeRelativePath(raw);
      if (!s.ok) {
        console.error(`[ERROR] ${relSpec} implements inválido: "${raw}" (${s.reason})`);
        errors++;
        continue;
      }
      const rel = s.normalized;

      if (isInternalPath(rel)) {
        if (existsInRepo(rel, REPO_ROOT)) internalOk++;
        else {
          console.error(`[ERROR] ${relSpec} → implements no existe en repo: ${rel}`);
          errors++;
        }
        continue;
      }

      if (existsInRepo(rel, REPO_ROOT)) continue;

      if (isCrossRepoHint(rel)) {
        externalRefs++;
        if (verbose) console.log(`[externo] ${relSpec} → ${rel}`);
      } else {
        console.warn(`[WARN] ${relSpec} → implements no resuelto (revisar ruta): ${rel}`);
      }
    }
  }

  console.log(
    `check-spec-implements: ${mdFiles.length} .md bajo openspec/, ` +
      `${specsWithImplements} con implements, internas OK=${internalOk}, refs externas=${externalRefs}, errores=${errors}`,
  );

  process.exit(errors > 0 ? 1 : 0);
}

main();

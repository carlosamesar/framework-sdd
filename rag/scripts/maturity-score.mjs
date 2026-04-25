#!/usr/bin/env node
/**
 * ============================================================================
 * FRAMEWORK-SDD: Maturity Score Engine
 * ============================================================================
 * Computes a 0-100% evidence maturity score for a change-slug.
 * Used as a gate before archive/release.
 *
 * Usage:
 *   node scripts/maturity-score.mjs --change=<slug> [--threshold=95] [--json]
 *   node scripts/maturity-score.mjs --all [--threshold=95] [--json]
 *
 * Exit codes:
 *   0  Score meets threshold (CERTIFICADO)
 *   2  Score below threshold (INCOMPLETO)
 * ============================================================================
 */

import path from 'path';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const DB_PATH = path.join(getWorkspaceRoot(), '.data', 'framework-sdd-audit.db');

function buildE2eOrSmokeSql(alias = 'evidence') {
  return `(
    lower(coalesce(json_extract(${alias}.metadata, '$.test_kind'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_type'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_level'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.suite_type'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.framework'), '')) IN ('playwright', 'supertest')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.title'), '')) LIKE '%e2e%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.title'), '')) LIKE '%smoke%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_name'), '')) LIKE '%e2e%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_name'), '')) LIKE '%smoke%'
    OR lower(coalesce(${alias}.content, '')) LIKE '%e2e%'
    OR lower(coalesce(${alias}.content, '')) LIKE '%smoke%'
  )`;
}

// Dimension definitions: { key, label, weight, query }
const DIMENSIONS = [
  {
    key: 'code',
    label: 'Evidencia de código (commits)',
    weight: 15,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'code'`
    ).get(slug).cnt > 0
  },
  {
    key: 'test',
    label: 'Evidencia de tests (ejecutados)',
    weight: 10,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'test'`
    ).get(slug).cnt > 0
  },
  {
    key: 'tests_passing',
    label: 'Tests pasando (passed=true)',
    weight: 15,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'test'
         AND json_extract(metadata, '$.passed') = 1`
    ).get(slug).cnt > 0
  },
  {
    key: 'tests_e2e_or_smoke',
    label: 'Pruebas e2e/smoke aprobadas',
    weight: 15,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'test'
         AND json_extract(metadata, '$.passed') = 1
         AND ${buildE2eOrSmokeSql('evidence')}`
    ).get(slug).cnt > 0
  },
  {
    key: 'review_approved',
    label: 'Review aprobado',
    weight: 15,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'review_decision'
         AND json_extract(metadata, '$.decision') = 'approve'`
    ).get(slug).cnt > 0
  },
  {
    key: 'verify',
    label: 'Verificación aprobada',
    weight: 15,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type IN ('verification', 'verification_matrix')
         AND json_extract(metadata, '$.passed') = 1`
    ).get(slug).cnt > 0
  },
  {
    key: 'deploy',
    label: 'Despliegue exitoso',
    weight: 10,
    query: (db, slug) => db.prepare(
      `SELECT COUNT(*) as cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'deployment_report'
         AND json_extract(metadata, '$.status') = 'success'`
    ).get(slug).cnt > 0
  },
  {
    key: 'vectors',
    label: 'Vectorización (RAG activo)',
    weight: 5,
    query: (db, slug) => {
      const hasVectors = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='vectors'`
      ).get();
      if (!hasVectors) return false;
      return db.prepare(
        `SELECT COUNT(*) as cnt FROM vectors v
         JOIN evidence e ON v.evidence_id = e.id
         WHERE e.change_slug = ?`
      ).get(slug).cnt > 0;
    }
  }
];

function computeScore(db, slug) {
  const results = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const dim of DIMENSIONS) {
    let passed = false;
    try {
      passed = dim.query(db, slug);
    } catch (_) {
      passed = false;
    }
    const contrib = passed ? dim.weight : 0;
    earnedWeight += contrib;
    totalWeight += dim.weight;
    results.push({
      key: dim.key,
      label: dim.label,
      weight: dim.weight,
      passed,
      pct: passed ? 100 : 0,
      contrib
    });
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { slug, score, dimensions: results, earnedWeight, totalWeight };
}

function getLevel(score) {
  if (score >= 100) return { nivel: 5, label: '🏆 CERTIFICADO (nivel 5/5)' };
  if (score >= 80)  return { nivel: 4, label: '✅ APROBADO (nivel 4/5)' };
  if (score >= 60)  return { nivel: 3, label: '⚠️  EN PROGRESO (nivel 3/5)' };
  if (score >= 40)  return { nivel: 2, label: '🔶 PARCIAL (nivel 2/5)' };
  return                   { nivel: 1, label: '❌ INCOMPLETO (nivel 1/5)' };
}

function renderBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function printReport(result, threshold) {
  const { slug, score, dimensions } = result;
  const level = getLevel(score);
  const certified = score >= threshold;

  console.log('══════════════════════════════════════════════════════');
  console.log('  MATURITY SCORE — Framework SDD Evidence Report');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  Change: ${slug}`);
  console.log(`  Score : ${score}% [${renderBar(score)}]`);
  console.log(`  Nivel : ${level.label}`);
  console.log(`  ${'Dimensión'.padEnd(38)} Peso   %     Contrib`);
  console.log('  ────────────────────────────────────────────────────────────');
  for (const d of dimensions) {
    const icon = d.passed ? '✅' : '❌';
    const label = d.label.padEnd(36);
    const w = `${d.weight}%`.padStart(3);
    const p = `${d.pct}%`.padStart(4);
    const c = d.contrib.toFixed(1).padStart(7);
    console.log(`  ${icon} ${label} ${w}   ${p}  ${c}`);
  }
  console.log('  ────────────────────────────────────────────────────────────');
  console.log(`  Total ponderado: ${score}%`);
  if (certified) {
    console.log(`  ✅ CERTIFICADO: score=${score}% ≥ threshold=${threshold}%`);
  } else {
    console.log(`  ❌ NO CERTIFICADO: score=${score}% < threshold=${threshold}%`);
  }
}

// ──────────────────────────── CLI ────────────────────────────
const args = process.argv.slice(2);
const opts = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const eqIdx = arg.indexOf('=');
    if (eqIdx > -1) {
      opts[arg.substring(2, eqIdx)] = arg.substring(eqIdx + 1);
    } else {
      opts[arg.substring(2)] = true;
    }
  }
}

const threshold = parseInt(opts.threshold || '95', 10);
const asJson = opts.json === true;
const allSlugs = opts.all === true;
const changeSlug = opts.change;

if (!changeSlug && !allSlugs) {
  console.error('Usage: node scripts/maturity-score.mjs --change=<slug> [--threshold=95] [--json]');
  console.error('       node scripts/maturity-score.mjs --all [--threshold=95] [--json]');
  process.exit(1);
}

let db;
try {
  db = new Database(DB_PATH, { readonly: true });
} catch (err) {
  console.error(`Cannot open DB at ${DB_PATH}: ${err.message}`);
  process.exit(1);
}

let slugs;
if (allSlugs) {
  slugs = db.prepare(`SELECT DISTINCT change_slug FROM evidence ORDER BY change_slug`).all().map(r => r.change_slug);
} else {
  slugs = [changeSlug];
}

const results = slugs.map(s => computeScore(db, s));
db.close();

if (asJson) {
  console.log(JSON.stringify(results.map(r => ({
    slug: r.slug,
    score: r.score,
    certified: r.score >= threshold,
    threshold,
    dimensions: r.dimensions
  })), null, 2));
} else {
  for (const result of results) {
    printReport(result, threshold);
    if (results.length > 1) console.log();
  }
}

// Exit code: 0 if all pass threshold, 2 if any fail
const allCertified = results.every(r => r.score >= threshold);
process.exit(allCertified ? 0 : 2);

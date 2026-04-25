#!/usr/bin/env node
/**
 * ============================================================================
 * FRAMEWORK-SDD: Local Evidence Vectorizer
 * ============================================================================
 * Generates embeddings for evidence records that don't have vectors yet.
 *
 * Primary:  Ollama nomic-embed-text (768-dim) — requires Ollama running locally
 * Fallback: Deterministic SHA-256 hash expansion (128-dim) — always available
 *
 * Usage:
 *   node scripts/vectorize.mjs [--force] [--change=<slug>] [--model=<name>] [--no-ollama]
 *
 * Options:
 *   --force          Re-vectorize all records (even those already vectorized)
 *   --change=<slug>  Limit to a specific change slug
 *   --model=<name>   Ollama model name (default: nomic-embed-text)
 *   --no-ollama      Skip Ollama, always use hash fallback
 * ============================================================================
 */

import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'nomic-embed-text';
const HASH_MODEL = 'local-hash-v1';
const HASH_DIM = 128;
const OLLAMA_DIM = 768;

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const DB_PATH = path.join(getWorkspaceRoot(), '.data', 'framework-sdd-audit.db');

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {};
for (const arg of args) {
  if (arg.startsWith('--')) {
    const eq = arg.indexOf('=');
    if (eq > -1) opts[arg.substring(2, eq)] = arg.substring(eq + 1);
    else opts[arg.substring(2)] = true;
  }
}

const force = opts.force === true;
const filterSlug = opts.change;
const ollamaModel = opts.model || DEFAULT_MODEL;
const skipOllama = opts['no-ollama'] === true;

// ── Embeddings ────────────────────────────────────────────────────────────────

/**
 * Call Ollama /api/embeddings to get a real semantic embedding.
 * Returns Float32Array on success, null on failure.
 */
async function ollamaEmbed(text) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ollamaModel, prompt: text }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const vec = json.embedding;
    if (!Array.isArray(vec) || vec.length === 0) return null;
    return new Float32Array(vec);
  } catch {
    return null;
  }
}

/**
 * Deterministic 128-dim float32 embedding derived from SHA-256.
 * Always available, no external dependencies.
 */
function hashEmbed(content) {
  const buf = crypto.createHash('sha256').update(content || '').digest();
  const floats = new Float32Array(HASH_DIM);
  for (let i = 0; i < 4; i++) {
    const seed = crypto.createHash('sha256').update(buf).update(Buffer.from([i])).digest();
    for (let j = 0; j < 32; j++) {
      floats[i * 32 + j] = (seed[j] / 127.5) - 1.0;
    }
  }
  return floats;
}

// ── DB ────────────────────────────────────────────────────────────────────────
let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error(`Cannot open DB: ${err.message}`);
  process.exit(1);
}

const vectorCols = new Set(db.prepare('PRAGMA table_info(vectors)').all().map((c) => c.name));
const usesNewVectorSchema = vectorCols.has('embedding') && !vectorCols.has('embedding_blob');

// ── Query rows to vectorize ──────────────────────────────────────────────────
let query;
const params = [];

if (force) {
  query = `SELECT e.id, e.content, e.change_slug FROM evidence e`;
  if (filterSlug) {
    query += ` WHERE e.change_slug = ?`;
    params.push(filterSlug);
  }
} else {
  query = `SELECT e.id, e.content, e.change_slug FROM evidence e
           WHERE NOT EXISTS (SELECT 1 FROM vectors v WHERE v.evidence_id = e.id)`;
  if (filterSlug) {
    query += ` AND e.change_slug = ?`;
    params.push(filterSlug);
  }
}

const rows = db.prepare(query).all(...params);

if (rows.length === 0) {
  console.log(`ok vectorized=0 (nothing to do)`);
  db.close();
  process.exit(0);
}

// ── Probe Ollama availability ────────────────────────────────────────────────
let useOllama = false;
if (!skipOllama) {
  try {
    const probe = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5_000) });
    if (probe.ok) {
      const json = await probe.json();
      const models = json.models?.map((m) => m.name) || [];
      useOllama = models.some((m) => m.startsWith(ollamaModel));
      if (!useOllama) {
        console.warn(`warn: model '${ollamaModel}' not found in Ollama — falling back to hash`);
      }
    }
  } catch {
    console.warn(`warn: Ollama not reachable at ${OLLAMA_URL} — falling back to hash`);
  }
}

const provider = useOllama ? 'ollama' : 'hash';
const model = useOllama ? ollamaModel : HASH_MODEL;
const dim = useOllama ? OLLAMA_DIM : HASH_DIM;

console.log(`info: provider=${provider} model=${model} dim=${dim} rows=${rows.length} force=${force}`);

// ── Prepare insert ────────────────────────────────────────────────────────────
const insertStmt = usesNewVectorSchema
  ? db.prepare(`
      INSERT OR REPLACE INTO vectors (id, evidence_id, embedding, embedding_dim, embedding_model, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
  : db.prepare(`
      INSERT OR REPLACE INTO vectors (evidence_id, embedding_blob, embedding_dim, embedding_model, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

// ── Vectorize ─────────────────────────────────────────────────────────────────
let vectorized = 0;
let ollamaFailed = 0;
let hashFallbacks = 0;

for (const row of rows) {
  const text = row.content || '';
  let floats;

  if (useOllama) {
    floats = await ollamaEmbed(text);
    if (!floats) {
      ollamaFailed++;
      hashFallbacks++;
      floats = hashEmbed(text);
    }
  } else {
    floats = hashEmbed(text);
  }

  const blob = Buffer.from(floats.buffer);
  const actualDim = floats.length;
  const actualModel = floats.length === HASH_DIM && useOllama ? HASH_MODEL : model;
  const now = new Date().toISOString();

  if (usesNewVectorSchema) {
    insertStmt.run(crypto.randomUUID(), row.id, blob, actualDim, actualModel, now);
  } else {
    insertStmt.run(row.id, blob, actualDim, actualModel, now);
  }

  vectorized++;
  if (vectorized % 10 === 0) {
    process.stdout.write(`\r  vectorized ${vectorized}/${rows.length}...`);
  }
}

if (vectorized >= 10) process.stdout.write('\n');

db.close();

const summary = [`ok vectorized=${vectorized} provider=${provider} model=${model} dim=${dim}`];
if (ollamaFailed > 0) summary.push(`hash_fallbacks=${hashFallbacks}`);
console.log(summary.join(' '));

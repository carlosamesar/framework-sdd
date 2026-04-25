#!/usr/bin/env node

import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const DB_PATH = path.join(getWorkspaceRoot(), '.data', 'framework-sdd-audit.db');
const SEMANTIC_DIM = 128;

function parseArgs(argv) {
  const opts = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    const eq = arg.indexOf('=');
    if (eq > -1) {
      const key = arg.substring(2, eq);
      const val = arg.substring(eq + 1);
      opts[key] = val;
      continue;
    }

    const key = arg.substring(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      opts[key] = next;
      i++;
    } else {
      opts[key] = true;
    }
  }

  return { opts, positional };
}

function hashEmbed(content) {
  const base = crypto.createHash('sha256').update(content || '').digest();
  const floats = new Float32Array(SEMANTIC_DIM);
  for (let i = 0; i < 4; i++) {
    const seed = crypto
      .createHash('sha256')
      .update(base)
      .update(Buffer.from([i]))
      .digest();
    for (let j = 0; j < 32; j++) {
      floats[i * 32 + j] = seed[j] / 127.5 - 1.0;
    }
  }
  return floats;
}

function toFloat32Array(blob) {
  if (!blob) return null;
  const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  if (buf.byteLength % 4 !== 0) return null;
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

class EvidenceSearch {
  constructor() {
    this.db = new Database(DB_PATH, { readonly: true });
    this.db.pragma('journal_mode = WAL');
    this.vectorCols = new Set(
      this.db.prepare('PRAGMA table_info(vectors)').all().map((c) => c.name)
    );
    this.vectorBlobColumn = this.vectorCols.has('embedding')
      ? 'embedding'
      : (this.vectorCols.has('embedding_blob') ? 'embedding_blob' : null);
  }

  buildFTSQuery(query) {
    return (query || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => `"${t.replace(/"/g, '""')}"`)
      .join(' OR ');
  }

  ftsSearch(query, options = {}) {
    const { type, change, phase, severity, limit = 20 } = options;

    let sql = `
      SELECT
        e.id,
        e.change_slug,
        e.task_id,
        e.artifact_type,
        e.severity,
        e.content,
        e.created_at,
        ai.relevance_score,
        COUNT(DISTINCT a.id) AS audit_count
      FROM evidence e
      JOIN artifact_index ai ON e.id = ai.evidence_id
      LEFT JOIN audit_trail a ON e.id = a.evidence_id
      WHERE ai.searchable_text MATCH ?
    `;

    const params = [this.buildFTSQuery(query)];

    if (type) {
      sql += ' AND e.artifact_type = ?';
      params.push(type);
    }
    if (change) {
      sql += ' AND e.change_slug = ?';
      params.push(change);
    }
    if (phase) {
      sql += `
        AND EXISTS (
          SELECT 1 FROM audit_trail a2
          WHERE a2.evidence_id = e.id AND a2.event_phase = ?
        )
      `;
      params.push(phase);
    }
    if (severity) {
      sql += ' AND e.severity = ?';
      params.push(severity);
    }

    sql += `
      GROUP BY e.id
      ORDER BY ai.relevance_score DESC, e.created_at DESC
      LIMIT ?
    `;
    params.push(Number(limit));

    return this.db.prepare(sql).all(...params);
  }

  semanticSearch(query, options = {}) {
    const {
      type,
      change,
      severity,
      limit = 20,
      similarityThreshold = 0.5,
    } = options;

    if (!this.vectorBlobColumn) {
      throw new Error('vectors table does not contain an embedding column');
    }

    const queryVec = hashEmbed(query);

    let sql = `
      SELECT
        e.id,
        e.change_slug,
        e.task_id,
        e.artifact_type,
        e.severity,
        e.content,
        e.created_at,
        v.${this.vectorBlobColumn} AS embedding_blob
      FROM vectors v
      JOIN evidence e ON e.id = v.evidence_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND e.artifact_type = ?';
      params.push(type);
    }
    if (change) {
      sql += ' AND e.change_slug = ?';
      params.push(change);
    }
    if (severity) {
      sql += ' AND e.severity = ?';
      params.push(severity);
    }

    sql += ' ORDER BY e.created_at DESC LIMIT ?';
    params.push(Math.max(Number(limit) * 5, 100));

    const candidates = this.db.prepare(sql).all(...params);

    const scored = candidates
      .map((row) => {
        const vec = toFloat32Array(row.embedding_blob);
        const sim = cosineSimilarity(queryVec, vec);
        return {
          id: row.id,
          change_slug: row.change_slug,
          task_id: row.task_id,
          artifact_type: row.artifact_type,
          severity: row.severity,
          content: row.content,
          created_at: row.created_at,
          relevance_score: sim,
        };
      })
      .filter((r) => r.relevance_score >= Number(similarityThreshold))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, Number(limit));

    return scored;
  }

  getStats(changeSlug = null) {
    const where = changeSlug ? 'WHERE change_slug = ?' : '';
    const params = changeSlug ? [changeSlug] : [];

    const byType = this.db.prepare(`
      SELECT artifact_type, COUNT(*) AS count
      FROM evidence
      ${where}
      GROUP BY artifact_type
      ORDER BY count DESC
    `).all(...params);

    const bySeverity = this.db.prepare(`
      SELECT severity, COUNT(*) AS count
      FROM evidence
      ${where}
      GROUP BY severity
      ORDER BY count DESC
    `).all(...params);

    const byPhase = this.db.prepare(`
      SELECT a.event_phase, COUNT(*) AS count
      FROM audit_trail a
      JOIN evidence e ON e.id = a.evidence_id
      ${changeSlug ? 'WHERE e.change_slug = ?' : ''}
      GROUP BY a.event_phase
      ORDER BY count DESC
    `).all(...params);

    const total = this.db.prepare(
      `SELECT COUNT(*) AS count FROM evidence ${where}`
    ).get(...params).count;

    return { by_type: byType, by_severity: bySeverity, by_phase: byPhase, total };
  }

  getTimeline(changeSlug) {
    return this.db.prepare(`
      SELECT
        e.id,
        e.artifact_type,
        e.severity,
        e.created_at,
        a.event_type,
        a.event_phase,
        a.message,
        a.actor
      FROM evidence e
      LEFT JOIN audit_trail a ON a.evidence_id = e.id
      WHERE e.change_slug = ?
      ORDER BY e.created_at ASC, a.created_at ASC
    `).all(changeSlug);
  }

  getTaskEvidence(taskId) {
    return this.db.prepare(`
      SELECT
        id,
        change_slug,
        task_id,
        artifact_type,
        severity,
        source_type,
        source_id,
        created_at
      FROM evidence
      WHERE task_id = ?
      ORDER BY created_at DESC
    `).all(taskId);
  }

  formatResults(results, format = 'table') {
    if (format === 'json') return JSON.stringify(results, null, 2);

    if (format === 'summary') {
      return results.map((r) => {
        const score = r.relevance_score != null
          ? `  Relevance: ${(r.relevance_score * 100).toFixed(1)}%\n`
          : '';
        return `[${r.artifact_type}] ${String(r.severity || '').toUpperCase()}\n` +
          `  Change: ${r.change_slug}\n` +
          `  Task: ${r.task_id || '-'}\n` +
          `  Created: ${new Date(r.created_at).toLocaleString()}\n` +
          score;
      }).join('\n');
    }

    const header = ['Type', 'Severity', 'Task', 'Score', 'Created'].join(' | ');
    const rows = results.map((r) => [
      String(r.artifact_type || '').substring(0, 12),
      String(r.severity || '').substring(0, 8),
      String(r.task_id || '-').substring(0, 16),
      r.relevance_score != null ? `${(r.relevance_score * 100).toFixed(1)}%` : '-',
      new Date(r.created_at).toLocaleDateString(),
    ].join(' | '));

    return `${header}\n${rows.join('\n')}`;
  }

  close() {
    this.db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { opts, positional } = parseArgs(process.argv.slice(2));
  const query = positional[0] || '';

  if (opts.help) {
    console.log(`
Framework-SDD Evidence Search

Usage:
  node scripts/search.mjs "<query>" [options]

Options:
  --type <type>                  Filter by artifact type
  --change <slug>                Filter by change slug
  --phase <phase>                Filter by lifecycle phase (FTS mode)
  --severity <level>             Filter by severity
  --limit <n>                    Max results (default: 20)
  --format <json|table|summary>  Output format
  --semantic                     Enable semantic search
  --threshold <0..1>             Semantic similarity threshold (default: 0.5)
  --stats                        Show statistics
  --timeline <slug>              Show timeline for change
  --task <id>                    Show evidence for task

Examples:
  node scripts/search.mjs "tenant jwt"
  node scripts/search.mjs "review approve" --change=bodega-tipo-responsables
  node scripts/search.mjs "auth failure" --semantic --threshold=0.4
  node scripts/search.mjs --stats --change=bodega-tipo-responsables
`);
    process.exit(0);
  }

  const search = new EvidenceSearch();
  try {
    if (opts.stats) {
      console.log(JSON.stringify(search.getStats(opts.change || null), null, 2));
      process.exit(0);
    }

    if (opts.timeline) {
      const results = search.getTimeline(opts.timeline);
      console.log(search.formatResults(results, opts.format || 'summary'));
      process.exit(0);
    }

    if (opts.task) {
      const results = search.getTaskEvidence(opts.task);
      console.log(search.formatResults(results, opts.format || 'table'));
      process.exit(0);
    }

    if (!query) {
      console.error('Query text is required unless using --stats, --timeline, or --task');
      process.exit(1);
    }

    const baseOpts = {
      type: opts.type,
      change: opts.change,
      phase: opts.phase,
      severity: opts.severity,
      limit: parseInt(opts.limit || '20', 10),
    };

    const results = opts.semantic
      ? search.semanticSearch(query, {
          ...baseOpts,
          similarityThreshold: Number(opts.threshold || 0.5),
        })
      : search.ftsSearch(query, baseOpts);

    if (results.length === 0) {
      console.log('No results found');
      process.exit(0);
    }

    if ((opts.format || 'table') === 'json') {
      console.log(search.formatResults(results, 'json'));
    } else {
      console.log(`Found ${results.length} evidence records\n`);
      console.log(search.formatResults(results, opts.format || 'table'));
    }
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    search.close();
  }
}

export { EvidenceSearch, hashEmbed, cosineSimilarity };

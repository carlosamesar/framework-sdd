#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const DB_PATH = path.join(getWorkspaceRoot(), '.data', 'framework-sdd-audit.db');

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const eq = arg.indexOf('=');
    if (eq > -1) {
      opts[arg.substring(2, eq)] = arg.substring(eq + 1);
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
  return opts;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

function toMarkdown(rows) {
  if (!rows.length) return '_No data_';
  const headers = Object.keys(rows[0]);
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${headers.map((h) => String(r[h] ?? '')).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

function normalizeFileOutputPath(outArg, format) {
  if (!outArg) return null;
  const out = path.isAbsolute(outArg)
    ? outArg
    : path.join(getWorkspaceRoot(), outArg);
  if (path.extname(out)) return out;
  return `${out}.${format}`;
}

function exportData(options) {
  const db = new Database(DB_PATH, { readonly: true });
  db.pragma('journal_mode = WAL');

  const evidenceCols = new Set(
    db.prepare('PRAGMA table_info(evidence)').all().map((c) => c.name)
  );

  const format = String(options.format || 'json').toLowerCase();
  const includeAudit = Boolean(options['include-audit']);

  if (!['json', 'csv', 'md', 'markdown'].includes(format)) {
    throw new Error(`Unsupported format: ${format}`);
  }

  const where = [];
  const params = [];

  if (options.change) {
    where.push('e.change_slug = ?');
    params.push(options.change);
  }
  if (options.from) {
    where.push('e.created_at >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('e.created_at <= ?');
    params.push(options.to);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sourceIdExpr = evidenceCols.has('source_id')
    ? 'e.source_id AS source_id'
    : "NULL AS source_id";

  const sourceHashExpr = evidenceCols.has('source_hash')
    ? 'e.source_hash AS source_hash'
    : "NULL AS source_hash";

  const sourceFileExpr = evidenceCols.has('source_file')
    ? 'e.source_file AS source_file'
    : "NULL AS source_file";

  const evidenceRows = db.prepare(`
    SELECT
      e.id,
      e.change_slug,
      e.task_id,
      e.artifact_type,
      e.severity,
      e.source_type,
      ${sourceIdExpr},
      ${sourceHashExpr},
      ${sourceFileExpr},
      e.created_at,
      SUBSTR(REPLACE(REPLACE(e.content, CHAR(10), ' '), CHAR(13), ' '), 1, 220) AS content_preview
    FROM evidence e
    ${whereSql}
    ORDER BY e.created_at DESC
  `).all(...params);

  let auditRows = [];
  if (includeAudit) {
    auditRows = db.prepare(`
      SELECT
        a.id,
        a.evidence_id,
        a.event_type,
        a.event_phase,
        a.actor,
        a.message,
        a.created_at
      FROM audit_trail a
      JOIN evidence e ON e.id = a.evidence_id
      ${whereSql}
      ORDER BY a.created_at DESC
    `).all(...params);
  }

  const totalEvidence = db.prepare(`
    SELECT COUNT(*) AS count
    FROM evidence e
    ${whereSql}
  `).get(...params).count;

  const byType = db.prepare(`
    SELECT e.artifact_type, COUNT(*) AS count
    FROM evidence e
    ${whereSql}
    GROUP BY e.artifact_type
    ORDER BY count DESC
  `).all(...params);

  db.close();

  const payload = {
    meta: {
      generated_at: new Date().toISOString(),
      filters: {
        change: options.change || null,
        from: options.from || null,
        to: options.to || null,
        include_audit: includeAudit,
      },
      totals: {
        evidence: totalEvidence,
        audit: auditRows.length,
      },
    },
    by_type: byType,
    evidence: evidenceRows,
    ...(includeAudit ? { audit: auditRows } : {}),
  };

  const normalizedFormat = format === 'markdown' ? 'md' : format;
  const outputPath = normalizeFileOutputPath(options.out, normalizedFormat);

  let rendered;
  if (normalizedFormat === 'json') {
    rendered = JSON.stringify(payload, null, options.pretty ? 2 : 0);
  } else if (normalizedFormat === 'csv') {
    rendered = toCsv(evidenceRows);
  } else {
    const parts = [];
    parts.push(`# Evidence Export`);
    parts.push(`Generated: ${payload.meta.generated_at}`);
    parts.push(`\n## Summary`);
    parts.push(`- Evidence: ${payload.meta.totals.evidence}`);
    parts.push(`- Audit events: ${payload.meta.totals.audit}`);
    parts.push(`\n## Evidence`);
    parts.push(toMarkdown(evidenceRows));
    if (includeAudit) {
      parts.push(`\n## Audit`);
      parts.push(toMarkdown(auditRows));
    }
    rendered = parts.join('\n');
  }

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, rendered, 'utf8');
  }

  return { outputPath, format: normalizedFormat, payload, rendered };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`
Export audit/evidence records for compliance and reporting.

Usage:
  node scripts/audit-export.mjs [options]

Options:
  --change <slug>          Filter by change slug
  --from <iso>             Start date/time inclusive
  --to <iso>               End date/time inclusive
  --format <json|csv|md>   Output format (default: json)
  --include-audit          Include audit trail rows in payload
  --out <path>             Output file path (optional)
  --pretty                 Pretty JSON output

Examples:
  node scripts/audit-export.mjs --change=bodega-tipo-responsables --pretty
  node scripts/audit-export.mjs --change=bodega-tipo-responsables --format=csv --out=.data/reports/bodega
`);
    process.exit(0);
  }

  try {
    const result = exportData(opts);
    if (result.outputPath) {
      console.log(`Export completed: ${result.outputPath}`);
    } else {
      process.stdout.write(result.rendered + '\n');
    }
  } catch (error) {
    console.error(`Export failed: ${error.message}`);
    process.exit(1);
  }
}

export { exportData };

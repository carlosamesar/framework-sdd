#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { getPool, FRAME_ROOT_RESOLVED } from './db.mjs';
import { embedText, vectorLiteral } from './embed.mjs';
import { chunkMarkdown } from './chunk.mjs';
import { saveLocalIndex } from './local-fallback.mjs';

const ROOT = FRAME_ROOT_RESOLVED;
const IGNORE_DIR = new Set([
  'node_modules',
  '.git',
  'engineering-knowledge-base',
  'dist',
  'coverage',
]);

const GLOBS_ROOT_FILES = [
  'AGENTS.md',
  'project.md',
  'registry.md',
  'CLAUDE.md',
  'GEMINI.md',
  'QWEN.md',
  'MODELS.md',
  'README.md',
];

function walkMarkdown(dir, out, depth = 0) {
  if (depth > 12) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (IGNORE_DIR.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMarkdown(p, out, depth + 1);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(p);
  }
}

function collectFiles() {
  const files = [];
  for (const f of GLOBS_ROOT_FILES) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) files.push(p);
  }
  walkMarkdown(path.join(ROOT, 'openspec'), files);
  walkMarkdown(path.join(ROOT, 'docs'), files);
  return [...new Set(files)];
}

async function main() {
  const files = collectFiles();
  console.error('RAG index: archivos MD:', files.length);

  const localChunks = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const raw = fs.readFileSync(abs, 'utf8');
    if (raw.length > 800_000) {
      console.error('Omitido (muy grande):', rel);
      continue;
    }
    const parts = chunkMarkdown(raw);
    parts.forEach((content, index) => localChunks.push({ path: rel, index, content }));
  }

  saveLocalIndex(localChunks);
  console.error('RAG local fallback index OK:', localChunks.length, 'chunks');

  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      for (const abs of files) {
        const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
        const raw = fs.readFileSync(abs, 'utf8');
        if (raw.length > 800_000) continue;
        const parts = chunkMarkdown(raw);
        await client.query('DELETE FROM rag.document_chunks WHERE source_path = $1', [rel]);
        let idx = 0;
        for (const content of parts) {
          const vec = await embedText(content);
          const lit = vectorLiteral(vec);
          await client.query(
            `INSERT INTO rag.document_chunks (source_path, chunk_index, content, embedding)
             VALUES ($1, $2, $3, $4::vector)`,
            [rel, idx, content, lit],
          );
          idx += 1;
          process.stderr.write('.');
        }
        process.stderr.write(` ${rel} (${parts.length})\n`);
      }
      console.error('RAG index OK');
    } finally {
      client.release();
      await pool.end();
    }
  } catch (e) {
    console.error('RAG DB unavailable; local fallback preserved.');
    if (process.env.RAG_REQUIRE_DB === '1') {
      throw e;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAG_ROOT = path.join(__dirname, '..');
export const LOCAL_INDEX_FILE = path.join(RAG_ROOT, '.rag-local-index.json');

export function saveLocalIndex(chunks) {
  const payload = {
    generatedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    chunks,
  };
  fs.writeFileSync(LOCAL_INDEX_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function loadLocalIndex() {
  if (!fs.existsSync(LOCAL_INDEX_FILE)) {
    throw new Error('No existe índice RAG local todavía. Ejecute npm run rag:index');
  }
  return JSON.parse(fs.readFileSync(LOCAL_INDEX_FILE, 'utf8'));
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}_]+/u)
    .filter((part) => part.length >= 3);
}

export function searchLocalIndex(query, limit = 8) {
  const { chunks } = loadLocalIndex();
  const terms = [...new Set(tokenize(query))];
  const q = String(query || '').toLowerCase();

  const scored = chunks
    .map((chunk) => {
      const text = `${chunk.path}\n${chunk.content}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (text.includes(term)) score += 1;
      }
      if (q && text.includes(q)) score += 3;
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const fallback = scored.length ? scored : chunks.slice(0, limit).map((chunk) => ({ ...chunk, score: 0.1 }));

  return fallback.map((chunk) => ({
    path: chunk.path,
    index: chunk.index,
    similarity: Number(Math.min(0.9999, chunk.score / Math.max(1, terms.length + 3))).toFixed(4),
    excerpt: chunk.content.slice(0, 1200),
  }));
}

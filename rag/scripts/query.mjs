#!/usr/bin/env node
import { getPool } from './db.mjs';
import { embedText, vectorLiteral } from './embed.mjs';

const q = process.argv.slice(2).join(' ').trim();
if (!q) {
  console.error('Uso: node scripts/query.mjs "tu pregunta"');
  process.exit(1);
}

async function main() {
  const pool = getPool();
  const vec = await embedText(q);
  const lit = vectorLiteral(vec);
  const limit = parseInt(process.env.RAG_QUERY_LIMIT || '8', 10);
  const { rows } = await pool.query(
    `SELECT source_path, chunk_index,
            1 - (embedding <=> $1::vector) AS similarity,
            LEFT(content, 1200) AS excerpt
     FROM rag.document_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [lit, limit],
  );
  await pool.end();

  const out = {
    query: q,
    chunks: rows.map((r) => ({
      path: r.source_path,
      index: r.chunk_index,
      similarity: Number(r.similarity).toFixed(4),
      excerpt: r.excerpt,
    })),
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

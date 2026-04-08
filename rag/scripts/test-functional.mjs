#!/usr/bin/env node
/**
 * Pruebas funcionales RAG: conexión, tabla, opcionalmente embeddings.
 * Sin Ollama/OpenAI: falla la parte embed salvo SKIP_RAG_EMBED=1 (solo conexión + esquema).
 */
import { getPool, getEmbeddingBackend } from './db.mjs';
import { embedText } from './embed.mjs';

let passed = 0;
let failed = 0;

function ok(name) {
  console.log('OK:', name);
  passed += 1;
}

function fail(name, err) {
  console.error('FAIL:', name, err?.message || err);
  failed += 1;
}

async function main() {
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'rag' AND table_name = 'document_chunks'
      ) AS ok`,
    );
    if (!rows[0]?.ok) {
      fail('tabla rag.document_chunks', new Error('Ejecute npm run migrate en rag/'));
    } else ok('tabla rag.document_chunks');

    const cnt = await pool.query('SELECT COUNT(*)::int AS n FROM rag.document_chunks');
    console.log('Chunks indexados:', cnt.rows[0].n);
    ok('lectura conteo chunks');

    if (process.env.SKIP_RAG_EMBED === '1') {
      console.warn('SKIP_RAG_EMBED=1 — omitiendo prueba de embedding');
      await pool.end();
      console.log(`\n${passed} passed, ${failed} failed`);
      process.exit(failed ? 1 : 0);
      return;
    }

    const probe = 'multi-tenant JWT custom:tenant_id';
    const vec = await embedText(probe);
    if (!Array.isArray(vec) || vec.length < 64) {
      fail('embedding', new Error('vector inválido'));
    } else ok(`embedding (${getEmbeddingBackend()}, dim=${vec.length})`);

    const n = cnt.rows[0].n;
    if (n > 0) {
      const { rows: hits } = await pool.query(
        `SELECT source_path FROM rag.document_chunks ORDER BY embedding <=> $1::vector LIMIT 1`,
        [`[${vec.map((v) => v.toFixed(6)).join(',')}]`],
      );
      if (hits.length) ok('retrieval top-1');
      else fail('retrieval', new Error('sin filas'));
    } else {
      console.warn('Sin chunks: ejecute npm run index en rag/ para probar retrieval');
      ok('retrieval omitido (0 chunks)');
    }

    await pool.end();
  } catch (e) {
    fail('pool/query', e);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();

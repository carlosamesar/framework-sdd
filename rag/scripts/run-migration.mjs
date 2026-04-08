#!/usr/bin/env node
import { getPool, getEmbeddingDim } from './db.mjs';

async function main() {
  const pool = getPool();
  const dim = getEmbeddingDim();
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE SCHEMA IF NOT EXISTS rag');
    await client.query(`
      CREATE TABLE IF NOT EXISTS rag.document_chunks (
        id BIGSERIAL PRIMARY KEY,
        source_path TEXT NOT NULL,
        chunk_index INT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(${dim}),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(source_path, chunk_index)
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS document_chunks_source_idx ON rag.document_chunks (source_path)
    `);
    // Índice vectorial (HNSW si está disponible en la versión de pgvector)
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
        ON rag.document_chunks
        USING hnsw (embedding vector_cosine_ops)
      `);
    } catch (e) {
      console.warn('RAG migrate: HNSW no disponible, se usará búsqueda secuencial en tablas pequeñas:', e.message);
    }
    console.log('RAG migrate OK (dimensión vector:', dim + ')');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

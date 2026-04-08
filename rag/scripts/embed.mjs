import { getEmbeddingBackend, getEmbeddingDim } from './db.mjs';

/**
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  const backend = getEmbeddingBackend();
  const dim = getEmbeddingDim();

  if (backend === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY requerido para RAG_EMBEDDING_BACKEND=openai');
    const model = process.env.RAG_OPENAI_MODEL || 'text-embedding-3-small';
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embeddings: ${res.status} ${err}`);
    }
    const json = await res.json();
    const vec = json.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== dim) {
      throw new Error(
        `Dimensión embedding OpenAI ${vec?.length} != RAG_EMBEDDING_DIM=${dim}. Ajuste RAG_EMBEDDING_DIM (1536 para text-embedding-3-small).`,
      );
    }
    return vec;
  }

  const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = process.env.RAG_EMBED_MODEL || 'nomic-embed-text';
  const res = await fetch(`${host}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text.slice(0, 8000) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama embeddings: ${res.status} ${err}. ¿Está Ollama arriba y el modelo ${model} instalado?`);
  }
  const json = await res.json();
  const vec = json.embedding;
  if (!Array.isArray(vec)) throw new Error('Ollama: respuesta sin embedding');
  if (vec.length !== dim) {
    throw new Error(
      `Dimensión Ollama ${vec.length} != RAG_EMBEDDING_DIM=${dim}. Para nomic-embed-text use 768.`,
    );
  }
  return vec;
}

export function vectorLiteral(vec) {
  return `[${vec.map((n) => Number(n).toFixed(6)).join(',')}]`;
}

# RAG (Framework-SDD)

Índice **pgvector** sobre documentación del repo: `AGENTS.md`, `project.md`, `registry.md`, `openspec/**`, `docs/**`, etc.

## Postgres local (Docker + volumen)

Si la BD en la nube no es alcanzable (`ETIMEDOUT`), usa el contenedor incluido:

```bash
# Desde la raíz del framework
npm run rag:db:up
```

- Imagen: `pgvector/pgvector:pg16`
- Puerto host: **5433** → Postgres interno 5432 (evita choque con un Postgres local)
- Volumen Docker **`framework_sdd_rag_pgdata`**: los datos persisten al hacer `down` sin `-v`

En **`rag/.env`** apunta a `127.0.0.1:5433`, usuario `rag`, BD `framework_rag`, contraseña `rag_local_dev`, **`RAG_DB_SSL=false`** (ver `.env.example`).

```bash
npm run rag:migrate
npm run rag:index
```

Comandos útiles: `npm run rag:db:logs`, `npm run rag:db:down`, borrar volumen con `npm run rag:db:down:volume`.

## Requisitos

- PostgreSQL con extensión **vector** (managed, o Docker como arriba).
- **Embeddings** (uno de los dos):
  - **Ollama** (recomendado local): `ollama pull nomic-embed-text`, `RAG_EMBEDDING_DIM=768`.
  - **OpenAI**: `RAG_EMBEDDING_BACKEND=openai`, `OPENAI_API_KEY`, `RAG_EMBEDDING_DIM=1536`, modelo `text-embedding-3-small`.

## Configuración

1. `cp .env.example .env` y completar (o confiar en `../.env` del framework con `DB_*`).
2. Dimensión del vector **debe coincidir** con el modelo; si cambias modelo, puede hacer falta `DROP TABLE rag.document_chunks` y volver a migrar.

## Comandos

```bash
cd rag
npm install
npm run migrate    # CREATE EXTENSION vector + tabla rag.document_chunks
npm run index      # reindexa MD (borra por archivo y reinserta)
npm run query -- "pregunta sobre multi-tenant"
SKIP_RAG_EMBED=1 npm run test   # solo BD + esquema (sin Ollama/OpenAI)
npm run test       # conexión + embed + retrieval si hay chunks
```

Desde la raíz del monorepo: `npm run rag:migrate`, `npm run rag:index`, `npm run rag:query -- "pregunta"`.

## Actualización automática (lineamiento obligatorio)

En entornos de desarrollo el framework exige el **daemon de reindexado**: `../scripts/rag-index-daemon.sh` (intervalo `RAG_INDEX_INTERVAL`, default 3600 s). Configuración: `../config/rag-daemon.env.example` → `~/.config/framework-sdd/rag-daemon.env`.

Si PostgreSQL no está disponible, el indexador ahora conserva un **fallback local** en `rag/.rag-local-index.json` para que las consultas sigan devolviendo contexto útil mientras se recupera la BD.

```bash
# Desde la raíz del framework
./scripts/rag-index-daemon.sh start
./scripts/status-memory-daemons.sh
```

Documentación completa: [`docs/lineamiento-memoria-automatica.md`](../docs/lineamiento-memoria-automatica.md).

## Convención AGENTS.md

Consulta alineada con el contrato maestro:

```bash
# Desde la raíz del framework (recomendado)
npm run rag:query -- "tu pregunta"
# O, equivalente:
node rag/scripts/query.mjs "tu pregunta"
```

Índice general de documentación: [`docs/INDICE-DOCUMENTACION-FRAMEWORK.md`](../docs/INDICE-DOCUMENTACION-FRAMEWORK.md).

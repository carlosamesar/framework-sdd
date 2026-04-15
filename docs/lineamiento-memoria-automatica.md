# Lineamiento obligatorio: memoria automática (Engram + RAG)

Todo desarrollador que trabaje con **Framework-SDD** en un entorno donde use memoria persistente y RAG debe **dejar en ejecución** los procesos automáticos descritos abajo. Así se cumple el contrato de `AGENTS.md`: sync de Engram al repositorio de conocimiento y **reindexado periódico** de la documentación en pgvector.

## Qué debe correr automáticamente

| Componente | Script / unidad | Qué hace |
|------------|-----------------|----------|
| **Engram** | `scripts/engram-sync-daemon.sh` | Cada ~30 s detecta cambios en `engram.db`, `engram sync`, commit/push de `.engram/` al repo `engineering-knowledge-base`. |
| **RAG** | `scripts/rag-index-daemon.sh` | Cada `RAG_INDEX_INTERVAL` s (default **3600**) ejecuta `rag/scripts/index.mjs` para refrescar chunks en PostgreSQL. |

Sin estos daemons: la **SQLite** y **MCP `mem_*`** siguen funcionando al momento, pero **no** hay sync git automático ni RAG al día con los últimos `.md`.

## Requisitos previos (una vez por máquina)

1. Clonar `engineering-knowledge-base` bajo la raíz del framework.
2. **Postgres RAG:** recomendado local con Docker — `npm run rag:db:up` y `rag/.env` apuntando a `127.0.0.1` y el puerto del compose (p. ej. **5433**); alternativa: instancia remota con pgvector y `RAG_DB_*` / `RAG_DB_SSL`. Detalle: [`rag/README.md`](../rag/README.md).
3. `npm run rag:migrate` (esquema `rag.*` en Postgres con extensión `vector`).
4. **Embeddings:** Ollama (`ollama pull nomic-embed-text`) u OpenAI según `rag/.env.example`.
5. **Engram push:** `~/.config/framework-sdd/engram-daemon.env` con `ENGRAM_GIT_TOKEN` y `ENGRAM_DATA_DIR` (ver `config/engram-daemon.env.example`).

## Puesta en marcha rápida (desarrollo)

### Recomendado en Windows y Linux

```bash
cd /ruta/al/Framework-SDD
npm run memory:daemons:start
npm run memory:daemons:status
npm run memory:daemons:health
```

Detener:

```bash
npm run memory:daemons:stop
```

Los scripts Bash siguen disponibles como alternativa manual en Linux.

## Systemd (usuario) — recomendado

Ajusta las rutas `ExecStart`/`WorkingDirectory` en los `.service` si tu clon no está en `~/Documents/Good4D/Framework-SDD`.

```bash
mkdir -p ~/.config/systemd/user/
cp scripts/engram-sync-daemon.service ~/.config/systemd/user/
cp scripts/rag-index-daemon.service ~/.config/systemd/user/
# Editar ambos archivos si hace falta

cp config/engram-daemon.env.example ~/.config/framework-sdd/engram-daemon.env
cp config/rag-daemon.env.example ~/.config/framework-sdd/rag-daemon.env
chmod 600 ~/.config/framework-sdd/*.env
# Completar tokens, DB si systemd no ve el .env del proyecto

systemctl --user daemon-reload
systemctl --user enable --now engram-sync-daemon.service
systemctl --user enable --now rag-index-daemon.service
```

**RAG y variables de BD:** si el servicio no carga el `.env` de la raíz del framework, define `DB_*` o `RAG_DB_*` en `~/.config/framework-sdd/rag-daemon.env`.

## Variables útiles

| Variable | Dónde | Descripción |
|----------|--------|-------------|
| `RAG_INDEX_INTERVAL` | `rag-daemon.env` o entorno | Segundos entre índices (default 3600). |
| `ENGRAM_GIT_TOKEN` | `engram-daemon.env` | PAT para `git push` del knowledge base. |
| `ENGRAM_DATA_DIR` | `engram-daemon.env` | Ruta al clon `engineering-knowledge-base`. |

## Verificación

```bash
./scripts/status-memory-daemons.sh
tail -20 engineering-knowledge-base/.engram-sync.log   # si aplica
tail -20 rag/.rag-index-daemon.log
```

## Referencias

- [`README.md`](../README.md) — sección memoria persistente
- [`AGENTS.md`](../AGENTS.md) — protocolo Engram + RAG
- [`rag/README.md`](../rag/README.md)
- [`config/README.md`](../config/README.md)

# Configuración local (secretos)

| Plantilla | Uso |
|-----------|-----|
| `engram-daemon.env.example` | Copiar a `~/.config/framework-sdd/engram-daemon.env` para **daemon Engram con push** (`ENGRAM_GIT_TOKEN`, `ENGRAM_DATA_DIR`). En Windows usa la misma ruta bajo tu perfil de usuario. |
| `rag-daemon.env.example` | Copiar a `~/.config/framework-sdd/rag-daemon.env` para **daemon RAG** (`RAG_INDEX_INTERVAL`, opcional `DB_*` si systemd no carga el `.env` del repo). En Windows usa la misma ruta bajo tu perfil de usuario. |
| `mcp.local.env.example` | Copiar a `mcp.local.env` en este directorio (gitignored) para overrides de MCP si hiciera falta. |

Permisos recomendados en Linux: `chmod 600 ~/.config/framework-sdd/engram-daemon.env` y `chmod 600 ~/.config/framework-sdd/rag-daemon.env`. En Windows basta con mantenerlos fuera del repo.

**Lineamiento obligatorio:** ver [`docs/lineamiento-memoria-automatica.md`](../docs/lineamiento-memoria-automatica.md).

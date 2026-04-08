# MCP Engram — configuración transversal (varios IDEs)

Mapa de documentación del framework: [`INDICE-DOCUMENTACION-FRAMEWORK.md`](INDICE-DOCUMENTACION-FRAMEWORK.md).

Las herramientas **`mem_*`** las expone el binario **`engram mcp`**. El dato persistente vive en **`ENGRAM_DATA_DIR`** (tu clon `engineering-knowledge-base` con `engram.db`).

Este repo incluye **`scripts/engram-mcp.sh`**, que fija:

- `ENGRAM_DATA_DIR` → `…/engineering-knowledge-base` junto al framework  
- `ENGRAM_PROJECT` → `framework-sdd`  
- `PATH` incluye `$HOME/go/bin` (donde suele estar `engram`)

Overrides opcionales (sin commitear):

- `~/.config/framework-sdd/mcp.env`
- `Framework-SDD/config/mcp.local.env` (plantilla: `config/mcp.local.env.example`)

---

## Cursor

1. Instalar CLI: [Engram](https://github.com/Gentleman-Programming/engram) (`engram` en PATH).
2. Proyecto: ya existe **`.cursor/mcp.json`** apuntando a `./scripts/engram-mcp.sh` con `cwd: ${workspaceFolder}`.
3. Reiniciar Cursor / “Reload MCP”.
4. Si falla, copiar el mismo bloque a **`~/.cursor/mcp.json`** y ajustar `cwd` a la ruta absoluta del repo.

---

## Claude Code

`~/.claude/mcp.json` (o según doc oficial):

```json
{
  "engram": {
    "type": "local",
    "command": ["/RUTA/Framework-SDD/scripts/engram-mcp.sh"],
    "enabled": true
  }
}
```

O:

```json
"command": ["bash", "/RUTA/Framework-SDD/scripts/engram-mcp.sh"]
```

Instalador: `engram setup claude-code` (puede generar rutas automáticas).

---

## OpenCode

`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "engram": {
      "type": "stdio",
      "command": "bash",
      "args": ["/RUTA/Framework-SDD/scripts/engram-mcp.sh"]
    }
  }
}
```

`engram setup opencode` para plantilla actualizada.

---

## Gemini CLI

`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "engram": {
      "command": "bash",
      "args": ["/RUTA/Framework-SDD/scripts/engram-mcp.sh"]
    }
  }
}
```

---

## VS Code / otros con MCP stdio

Mismo patrón: **comando** = `bash`, **args** = ruta absoluta a `engram-mcp.sh`. Herramientas recomendadas: `engram mcp --tools=agent` (ya aplicado en el script).

---

## Comprobación rápida

```bash
ENGRAM_DATA_DIR=/ruta/engineering-knowledge-base engram stats
bash scripts/engram-mcp.sh </dev/null
# Debe arrancar stdio MCP (o quedar esperando); Ctrl+C para salir.
```

---

## Documentación upstream

- [Engram — configuración / MCP](https://www.mintlify.com/Gentleman-Programming/engram/cli/configuration)

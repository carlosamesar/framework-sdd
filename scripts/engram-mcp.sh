#!/usr/bin/env bash
# MCP Engram: mismo entrypoint para Cursor, Windsurf, etc. (stdio → mem_*).
# ENGRAM_DATA_DIR por defecto = engineering-knowledge-base junto al framework.

set -eo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export ENGRAM_DATA_DIR="${ENGRAM_DATA_DIR:-$FRAME_ROOT/engineering-knowledge-base}"
export ENGRAM_PROJECT="${ENGRAM_PROJECT:-framework-sdd}"
export PATH="${HOME}/go/bin:${PATH}"

# Overrides opcionales (gitignored en proyecto o solo en $HOME)
[[ -f "${HOME}/.config/framework-sdd/mcp.env" ]] && source "${HOME}/.config/framework-sdd/mcp.env"
[[ -f "$FRAME_ROOT/config/mcp.local.env" ]] && source "$FRAME_ROOT/config/mcp.local.env"

exec engram mcp --tools=agent "$@"

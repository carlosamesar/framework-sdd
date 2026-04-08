#!/usr/bin/env bash
# Arranca daemons de memoria automática (lineamiento Framework-SDD): Engram sync + RAG index.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== Engram sync daemon ==="
"$SCRIPT_DIR/engram-sync-daemon.sh" start
echo "=== RAG index daemon ==="
"$SCRIPT_DIR/rag-index-daemon.sh" start
echo "Listo. Estado:"
"$SCRIPT_DIR/engram-sync-daemon.sh" status || true
"$SCRIPT_DIR/rag-index-daemon.sh" status || true

#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "--- Engram ---"
"$SCRIPT_DIR/engram-sync-daemon.sh" status || true
echo "--- RAG ---"
"$SCRIPT_DIR/rag-index-daemon.sh" status || true

#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/rag-index-daemon.sh" stop || true
"$SCRIPT_DIR/engram-sync-daemon.sh" stop || true
echo "Daemons de memoria detenidos."

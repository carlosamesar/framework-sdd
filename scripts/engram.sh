#!/bin/bash
# Engram wrapper para Framework-SDD
# Datos: repo anidado engineering-knowledge-base (gitignored en el padre; ver docs/validacion-memoria-engram-rag.md)

FRAME_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ENGRAM_DATA_DIR="${ENGRAM_DATA_DIR:-$FRAME_ROOT/engineering-knowledge-base}"
export ENGRAM_PROJECT="${ENGRAM_PROJECT:-framework-sdd}"
export PATH="$HOME/go/bin:$PATH"

exec engram "$@"
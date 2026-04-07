#!/bin/bash
# Engram wrapper para Framework-SDD
# Usa el directorio de datos del repositorio engineering-knowledge-base

export ENGRAM_DATA_DIR="/home/cto-grupo4d/Documents/Good4D/Framework-SDD/engineering-knowledge-base"
export ENGRAM_PROJECT="framework-sdd"
export PATH="$HOME/go/bin:$PATH"

exec engram "$@"
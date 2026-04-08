#!/usr/bin/env bash
# Reindexado periódico RAG (pgvector). Lineamiento Framework-SDD: ejecutar en background en entornos de desarrollo.
# Uso: ./scripts/rag-index-daemon.sh {start|stop|status|run}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RAG_DIR="$FRAME_ROOT/rag"
PID_FILE="$RAG_DIR/.rag-index-daemon.pid"
LOG_FILE="$RAG_DIR/.rag-index-daemon.log"
CHECK_INTERVAL="${RAG_INDEX_INTERVAL:-3600}"

load_rag_daemon_env() {
  local f
  for f in "${HOME}/.config/framework-sdd/rag-daemon.env" \
           "$FRAME_ROOT/config/rag-daemon.local.env"; do
    [[ -f "$f" ]] || continue
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
  done
  if [[ -n "${RAG_DAEMON_ENV_FILE:-}" && -f "${RAG_DAEMON_ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${RAG_DAEMON_ENV_FILE}"
    set +a
  fi
}
load_rag_daemon_env

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${RED}✗${NC} $1" | tee -a "$LOG_FILE"
}

run_index() {
  cd "$RAG_DIR"
  if [[ ! -f package.json ]]; then
    log_error "No existe rag/package.json"
    return 1
  fi
  if [[ ! -d node_modules ]]; then
    log_warn "Instalando dependencias npm en rag/…"
    npm install --silent >>"$LOG_FILE" 2>&1 || true
  fi
  log "RAG index (intervalo ciclo: ${CHECK_INTERVAL}s)…"
  set +e
  node scripts/index.mjs >>"$LOG_FILE" 2>&1
  rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    log_success "RAG index completado"
  else
    log_error "RAG index falló (exit $rc). ¿Ollama/OpenAI y BD accesibles? Ver rag/README.md"
  fi
  return 0
}

daemon_loop() {
  log "Daemon RAG: intervalo ${CHECK_INTERVAL}s (RAG_INDEX_INTERVAL). Ctrl+C no aplica en nohup."
  while true; do
    run_index
    sleep "$CHECK_INTERVAL"
  done
}

start_daemon() {
  mkdir -p "$RAG_DIR"
  touch "$LOG_FILE" 2>/dev/null || true

  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      log_error "Daemon RAG ya corriendo (PID: $pid)"
      exit 1
    fi
    rm -f "$PID_FILE"
  fi

  nohup /bin/bash "$SCRIPT_DIR/rag-index-daemon.sh" run >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  sleep 2
  if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log_success "Daemon RAG iniciado (PID: $(cat "$PID_FILE"))"
    log "Log: $LOG_FILE"
  else
    log_error "Daemon RAG no arrancó. Ver: $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
  fi
}

stop_daemon() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      rm -f "$PID_FILE"
      log_success "Daemon RAG detenido"
    else
      log_warn "PID obsoleto, limpiando"
      rm -f "$PID_FILE"
    fi
  else
    log_error "Daemon RAG no está corriendo"
    exit 1
  fi
}

status_daemon() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo -e "${GREEN}●${NC} Daemon RAG corriendo (PID: $pid)"
      echo "Log: $LOG_FILE"
      tail -5 "$LOG_FILE" 2>/dev/null || true
    else
      echo -e "${YELLOW}○${NC} PID file sin proceso"
      rm -f "$PID_FILE"
    fi
  else
    echo -e "${RED}●${NC} Daemon RAG no está corriendo"
  fi
}

case "${1:-}" in
start) start_daemon ;;
stop) stop_daemon ;;
status) status_daemon ;;
run) daemon_loop ;;
*)
  echo "Usage: $0 {start|stop|status|run}"
  exit 1
  ;;
esac

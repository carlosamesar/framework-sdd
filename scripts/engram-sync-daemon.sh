#!/bin/bash
# Engram Auto-Sync Daemon
# Sincroniza automáticamente las memorias con el repositorio git
# Uso: ./scripts/engram-sync-daemon.sh [start|stop|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Raíz Framework-SDD = directorio padre de scripts/
FRAME_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Cargar secretos sin commitearlos: ~/.config/... luego proyecto config/engram-daemon.local.env;
# opcional ENGRAM_DAEMON_ENV_FILE (ruta extra, p. ej. systemd EnvironmentFile).
load_engram_daemon_env() {
    local f
    for f in "${HOME}/.config/framework-sdd/engram-daemon.env" \
             "$FRAME_ROOT/config/engram-daemon.local.env"; do
        [[ -f "$f" ]] || continue
        set -a
        # shellcheck disable=SC1090
        source "$f"
        set +a
    done
    if [[ -n "${ENGRAM_DAEMON_ENV_FILE:-}" && -f "${ENGRAM_DAEMON_ENV_FILE}" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "${ENGRAM_DAEMON_ENV_FILE}"
        set +a
    fi
}
load_engram_daemon_env

KB_DIR="${ENGRAM_DATA_DIR:-$FRAME_ROOT/engineering-knowledge-base}"
ENGRAM_BIN="${ENGRAM_BIN:-$HOME/go/bin/engram}"
PID_FILE="$KB_DIR/.engram-sync.pid"
LOG_FILE="$KB_DIR/.engram-sync.log"
CHECK_INTERVAL=30  # segundos entre verificaciones
LAST_SIZE_FILE="$KB_DIR/.engram-last-size"
# ENGRAM_GIT_TOKEN: definir en ~/.config/framework-sdd/engram-daemon.env (ver config/engram-daemon.env.example).
ENGRAM_GIT_REMOTE="${ENGRAM_GIT_REMOTE:-https://github.com/carlosamesar/engineering-knowledge-base.git}"

# Colores para logs
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

check_git_config() {
    cd "$KB_DIR"
    if [[ -n "${ENGRAM_GIT_TOKEN:-}" && "$ENGRAM_GIT_REMOTE" == https://* ]]; then
        git remote set-url origin "https://${ENGRAM_GIT_TOKEN}@${ENGRAM_GIT_REMOTE#https://}" 2>/dev/null || true
    fi
    return 0
}

sync_memories() {
    cd "$KB_DIR"
    
    # Obtener tamaño actual de la DB
    current_size=$(stat -c%s engram.db 2>/dev/null || echo "0")
    
    # Verificar si hay cambios - solo sincronizar si hay diferencia REAL
    if [[ -f "$LAST_SIZE_FILE" ]]; then
        last_size=$(cat "$LAST_SIZE_FILE")
        if [[ "$current_size" == "$last_size" ]]; then
            return 0  # Sin cambios
        fi
        
        # Verificar que el cambio sea significativo (> 1KB) para evitar falsos positivos
        size_diff=$((current_size - last_size))
        if [[ $size_diff -lt 1024 ]] && [[ $size_diff -gt -1024 ]]; then
            return 0  # Cambio insignificante
        fi
        
        log "Detectado cambio en base de datos (size: $current_size, diff: $size_diff)"
    else
        log "Primera ejecución - inicializando tamaño de DB: $current_size"
    fi
    
    # Exportar memorias como chunks
    $ENGRAM_BIN sync 2>/dev/null
    
    # Verificar si hay nuevos chunks ANTES de actualizar el tamaño
    if [[ -d ".engram/chunks" ]] && [[ -n "$(ls -A .engram/chunks 2>/dev/null)" ]]; then
        log "Chunks detectados, sincronizando con git..."
        
        # Agregar y commit - forzar agregar archivos no trackeados
        git add .engram/ 2>/dev/null || return 1
        
        # Verificar si hay cambios staged O archivos sin trackear
        has_changes=false
        if ! git diff --staged --quiet; then
            has_changes=true
        elif [[ -n "$(git ls-files --others --exclude-standard .engram/)" ]]; then
            has_changes=true
        fi
        
        if [[ "$has_changes" == "true" ]]; then
            git commit -m "sync: engram memories $(date '+%Y-%m-%d %H:%M')" 2>/dev/null
            
            # Push automático
            if git push origin "$(git rev-parse --abbrev-ref HEAD)" 2>/dev/null; then
                log_success "Memorias sincronizadas y enviadas a remoto"
            else
                log_warn "No se pudo hacer push (sin cambios remotos o error de conexión)"
            fi
        else
            log "Chunks ya están sincronizados"
        fi
    fi
    
    # Actualizar archivo de tamaño
    echo "$current_size" > "$LAST_SIZE_FILE"
}

daemon_loop() {
    log "Iniciando daemon de sincronización..."
    
    # Cambiar al directorio correcto
    cd "$KB_DIR"
    
    while true; do
        sync_memories
        sleep $CHECK_INTERVAL
    done
}

start_daemon() {
    if [[ -f "$PID_FILE" ]]; then
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_error "Daemon ya está corriendo (PID: $pid)"
            exit 1
        fi
        rm -f "$PID_FILE"
    fi
    
    check_git_config
    
    # Iniciar en background usando ruta ABSOLUTA
    nohup /bin/bash "$SCRIPT_DIR/engram-sync-daemon.sh" run >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2  # Dar tiempo al daemon para iniciar
    
    if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        log_success "Daemon iniciado (PID: $(cat $PID_FILE))"
        log "Log: $LOG_FILE"
    else
        log_error "El daemon no pudo iniciarse. Ver log: $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

stop_daemon() {
    if [[ -f "$PID_FILE" ]]; then
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$PID_FILE"
            log_success "Daemon detenido"
        else
            log_warn "Proceso no encontrado, limpiando..."
            rm -f "$PID_FILE"
        fi
    else
        log_error "Daemon no está corriendo"
        exit 1
    fi
}

status_daemon() {
    if [[ -f "$PID_FILE" ]]; then
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}●${NC} Daemon corriendo (PID: $pid)"
            echo "Log: $LOG_FILE"
            tail -5 "$LOG_FILE" 2>/dev/null || true
        else
            echo -e "${YELLOW}○${NC} PID file existe pero proceso no está corriendo"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "${RED}●${NC} Daemon no está corriendo"
    fi
}

case "${1:-}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        status_daemon
        ;;
    run)
        daemon_loop
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        exit 1
        ;;
esac
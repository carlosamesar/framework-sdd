#!/bin/bash
# GAF SDD Framework - Installation Script
# Installs GAF framework with full AGENTS.md alignment
# Version: 1.0.0 - Aligned with AGENTS.md 94+ commands

set -euo pipefail

VERSION="1.0.0"
REPO_URL="https://github.com/gaf/gaf-sdd.git"
CLEANUP_TMPDIR=""

# Determine Framework-SDD root (parent of this script's directory)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Framework-SDD location
FRAMEWORK_ROOT="$(dirname "$SCRIPT_DIR")"

# Initialize SOURCE_DIR
SOURCE_DIR=""

# Detect if running via pipe (curl | bash) or directly
if [ -t 0 ] && [ -f "$0" ]; then
    # Running directly - check for local gaf-source first
    if [ -d "$SCRIPT_DIR/../gaf-source" ]; then
        SOURCE_DIR="$SCRIPT_DIR/../gaf-source"
    else
        # Fallback: download from repo
        INSTALL_TMPDIR=$(mktemp -d)
        CLEANUP_TMPDIR="$INSTALL_TMPDIR"
        echo -e "  ⬇️  Downloading GAF v${VERSION}..."
        if ! git clone --depth 1 --quiet "$REPO_URL" "$INSTALL_TMPDIR/gaf-sdd" 2>/dev/null; then
            echo -e "\033[0;31m  ✗ Failed to clone repository. Check your internet connection.\033[0m"
            rm -rf "$INSTALL_TMPDIR"
            exit 1
        fi
        SOURCE_DIR="$INSTALL_TMPDIR/gaf-sdd"
        echo -e "  \033[0;32m✓\033[0m Downloaded successfully."
        echo ""
    fi
else
    # Running via pipe - download
    INSTALL_TMPDIR=$(mktemp -d)
    CLEANUP_TMPDIR="$INSTALL_TMPDIR"
    echo -e "  ⬇️  Downloading GAF v${VERSION}..."
    if ! git clone --depth 1 --quiet "$REPO_URL" "$INSTALL_TMPDIR/gaf-sdd" 2>/dev/null; then
        echo -e "\033[0;31m  ✗ Failed to clone repository. Check your internet connection.\033[0m"
        rm -rf "$INSTALL_TMPDIR"
        exit 1
    fi
    SOURCE_DIR="$INSTALL_TMPDIR/gaf-sdd"
    echo -e "  \033[0;32m✓\033[0m Downloaded successfully."
    echo ""
fi

cleanup() {
    if [ -n "$CLEANUP_TMPDIR" ] && [ -d "$CLEANUP_TMPDIR" ]; then
        rm -rf "$CLEANUP_TMPDIR"
    fi
}
trap cleanup EXIT

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════
# STEP 0 — Language Selection
# ═══════════════════════════════════════════════════════════════

LANG_FLAG=""
for arg in "$@"; do
    case "$arg" in
        --lang=*) LANG_FLAG="${arg#*=}" ;;
    esac
done
PREV=""
for arg in "$@"; do
    if [ "$PREV" = "--lang" ]; then
        LANG_FLAG="$arg"
    fi
    PREV="$arg"
done

# Parse flags
TOOLS_FLAG=""
PROFILE_FLAG=""
SKILLS_FLAG=""
COMMANDS_FLAG=""
DRY_RUN=false
INTERACTIVE_MODE=false

PREV=""
for arg in "$@"; do
    case "$arg" in
        --tools=*) TOOLS_FLAG="${arg#*=}"; INTERACTIVE_MODE=true ;;
        --profile=*) PROFILE_FLAG="${arg#*=}"; INTERACTIVE_MODE=true ;;
        --skills=*) SKILLS_FLAG="${arg#*=}"; INTERACTIVE_MODE=true ;;
        --comandos=*) COMMANDS_FLAG="${arg#*=}"; INTERACTIVE_MODE=true ;;
        --dry-run) DRY_RUN=true; INTERACTIVE_MODE=true ;;
    esac
    if [ "$PREV" = "--tools" ]; then TOOLS_FLAG="$arg"; INTERACTIVE_MODE=true; fi
    if [ "$PREV" = "--profile" ]; then PROFILE_FLAG="$arg"; INTERACTIVE_MODE=true; fi
    if [ "$PREV" = "--skills" ]; then SKILLS_FLAG="$arg"; INTERACTIVE_MODE=true; fi
    if [ "$PREV" = "--comandos" ]; then COMMANDS_FLAG="$arg"; INTERACTIVE_MODE=true; fi
    PREV="$arg"
done

if [ $# -eq 0 ]; then
    INTERACTIVE_MODE=true
fi

clear 2>/dev/null || true
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔═══════════════════════════════════════════════════════════╗"
echo "  ║                                                           ║"
echo "  ║           🏗️  GAF — SDD Framework                   ║"
echo "  ║           Specification-Driven Development              ║"
echo "  ╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

if [ -n "$LANG_FLAG" ]; then
    LANG_CHOICE="$LANG_FLAG"
else
    # Auto-select Spanish in non-interactive mode
    if [ ! -t 0 ] || [ ! -c /dev/tty ]; then
        LANG_CHOICE="es"
    else
        echo -e "${BOLD}  🌍 Selecciona tu idioma / Select your language${NC}"
        echo ""
        echo -e "     ${CYAN}1)${NC}  🇪🇸  Español"
        echo -e "     ${CYAN}2)${NC}  🇬🇧  English"
        echo -e "     ${CYAN}3)${NC}  🇧🇷  Português"
        echo ""
        echo -ne "  ${BOLD}▸ ${NC}"
        read -r LANG_CHOICE < /dev/tty 2>/dev/null || LANG_CHOICE="es"
    fi
fi

case "$LANG_CHOICE" in
    1|es|ES) LOCALE="es"; LANG_NAME="Español" ;;
    2|en|EN) LOCALE="en"; LANG_NAME="English" ;;
    3|pt|PT) LOCALE="pt"; LANG_NAME="Português" ;;
    *) LOCALE="es"; LANG_NAME="Español" ;;
esac

echo ""
echo -e "  ${GREEN}✓${NC} Idioma: ${LANG_NAME}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Banner
# ═══════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}"
echo "  ┌───────────────────────────────────────────────────────┐"
printf "  │  %-53s │\n" "GAF SDD Framework v${VERSION}"
printf "  │  %-53s │\n" "94+ Comandos alineados con AGENTS.md"
echo "  └───────────────────────────────────────────────────────┘"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════
# INTERACTIVE MODE
# ═══════════════════════════════════════════════════════════════

if [ "$INTERACTIVE_MODE" = true ]; then
    echo ""

    # Step 1: Tool Selection
    if [ -z "$TOOLS_FLAG" ]; then
        echo -e "  ${BOLD}¿Dónde quieres instalar GAF SDD?${NC}"
        echo ""
        echo -e "     ${CYAN}1)${NC}  Claude Code     (CLAUDE.md)"
        echo -e "     ${CYAN}2)${NC}  Codex           (AGENTS.md)"
        echo -e "     ${CYAN}3)${NC}  Cursor          (.cursorrules)"
        echo -e "     ${CYAN}4)${NC}  Gemini          (GEMINI.md)"
        echo -e "     ${CYAN}5)${NC}  OpenCode        (@gaf)"
        echo -e "     ${CYAN}9)${NC}  Todos"
        echo ""
        echo -ne "  ${BOLD}▸ ${NC}"
        read -r TOOLS_CHOICE < /dev/tty 2>/dev/null || TOOLS_CHOICE="9"

        TOOLS_FLAG=""
        for num in $(echo "$TOOLS_CHOICE" | tr ',' ' '); do
            case "$num" in
                1) TOOLS_FLAG="${TOOLS_FLAG:+$TOOLS_FLAG,}claude" ;;
                2) TOOLS_FLAG="${TOOLS_FLAG:+$TOOLS_FLAG,}codex" ;;
                3) TOOLS_FLAG="${TOOLS_FLAG:+$TOOLS_FLAG,}cursor" ;;
                4) TOOLS_FLAG="${TOOLS_FLAG:+$TOOLS_FLAG,}gemini" ;;
                5) TOOLS_FLAG="${TOOLS_FLAG:+$TOOLS_FLAG,}opencode" ;;
                9|all) TOOLS_FLAG="claude,codex,cursor,gemini,opencode" ;;
            esac
        done
        [ -z "$TOOLS_FLAG" ] && TOOLS_FLAG="claude"
    fi
    echo -e "  ${GREEN}✓${NC} Herramientas: ${TOOLS_FLAG}"

    # Step 2: Profile Selection
    if [ -z "$PROFILE_FLAG" ]; then
        echo ""
        echo -e "  ${BOLD}Elige tu perfil:${NC}"
        echo ""
        echo -e "     ${CYAN}1)${NC}  👻 Phantom Coder   Full-stack, TDD, quality gates"
        echo -e "     ${CYAN}2)${NC}  💀 Reaper Sec      Seguridad, OWASP, pentest"
        echo -e "     ${CYAN}3)${NC}  🏗  System Architect Arquitectura, SOLID, APIs"
        echo -e "     ${CYAN}4)${NC}  ⚡ Speedrunner     PoC, estimados, validación veloz"
        echo -e "     ${CYAN}5)${NC}  🔮 The Oracle      15 modelos mentales, análisis"
        echo -e "     ${CYAN}6)${NC}  🥷 Dev Dojo        Docs, ADRs, Obsidian"
        echo ""
        echo -ne "  ${BOLD}▸ ${NC}"
        read -r PROFILE_CHOICE < /dev/tty 2>/dev/null || PROFILE_CHOICE="1"

        case "$PROFILE_CHOICE" in
            1|phantom)   PROFILE_FLAG="phantom" ;;
            2|reaper)    PROFILE_FLAG="reaper" ;;
            3|architect) PROFILE_FLAG="architect" ;;
            4|speedrun)  PROFILE_FLAG="speedrun" ;;
            5|oracle)    PROFILE_FLAG="oracle" ;;
            6|dojo)      PROFILE_FLAG="dojo" ;;
            *)           PROFILE_FLAG="phantom" ;;
        esac
    fi
    echo -e "  ${GREEN}✓${NC} Perfil: ${PROFILE_FLAG}"

    # Default skills/commands from profile
    PROFILE_DIR="${SOURCE_DIR}/perfiles/${PROFILE_FLAG}"
    if [ -d "$PROFILE_DIR" ]; then
        PROFILE_SKILLS=$(cat "$PROFILE_DIR/skills.txt" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
        PROFILE_COMMANDS=$(cat "$PROFILE_DIR/comandos.txt" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    fi

    [ -n "$SKILLS_FLAG" ] && PROFILE_SKILLS="$SKILLS_FLAG"
    [ -n "$COMMANDS_FLAG" ] && PROFILE_COMMANDS="$COMMANDS_FLAG"

    # Summary
    echo ""
    echo -e "  ${CYAN}${BOLD}┌──────────────────────────────────────┐${NC}"
    echo -e "  ${CYAN}${BOLD}│  Resumen de instalación              │${NC}"
    echo -e "  ${CYAN}${BOLD}├──────────────────────────────────────┤${NC}"
    echo -e "  ${CYAN}${BOLD}│${NC}  Herramientas   ${TOOLS_FLAG}"
    echo -e "  ${CYAN}${BOLD}│${NC}  Perfil         ${PROFILE_FLAG}"
    echo -e "  ${CYAN}${BOLD}│${NC}  Idioma         ${LANG_NAME} (${LOCALE})"
    echo -e "  ${CYAN}${BOLD}└──────────────────────────────────────┘${NC}"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}--dry-run: No se instalará nada.${NC}"
        exit 0
    fi

    echo -ne "  ${BOLD}¿Confirmar instalación? [S/n] ${NC}"
    read -r CONFIRM < /dev/tty 2>/dev/null || CONFIRM="s"
    case "$CONFIRM" in
        n|N) echo -e "  ${RED}Instalación cancelada.${NC}"; exit 0 ;;
    esac
    echo ""

    SELECTED_TOOLS="$TOOLS_FLAG"
    SELECTED_PROFILE="$PROFILE_FLAG"
fi

# ═══════════════════════════════════════════════════════════════
# Detect installation mode
# ═══════════════════════════════════════════════════════════════

MODE="local"
for arg in "$@"; do
    if [ "$arg" = "--global" ]; then
        MODE="global"
    fi
done

if [ "$MODE" == "global" ]; then
    FRAMEWORK_HOME="$HOME/.claude/gaf"
    COMMANDS_DIR="$HOME/.claude/commands"
    echo -e "  ${YELLOW}🌐 Modo: Instalación global${NC}"
else
    FRAMEWORK_HOME="./.claude/gaf"
    COMMANDS_DIR="./.claude/commands"
    echo -e "  ${YELLOW}📁 Modo: Instalación local${NC}"
fi

echo -e "  ${DIM}Framework: ${FRAMEWORK_HOME}${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# Create structure
# ═══════════════════════════════════════════════════════════════

if [ -z "$FRAMEWORK_HOME" ]; then
    echo -e "  ${RED}✗ Error: FRAMEWORK_HOME is empty.${NC}"
    exit 1
fi

echo -e "  📁 Creating structure..."
mkdir -p "${FRAMEWORK_HOME}/skills"
mkdir -p "${FRAMEWORK_HOME}/rules"
mkdir -p "${FRAMEWORK_HOME}/templates"
mkdir -p "${FRAMEWORK_HOME}/hooks"
mkdir -p "${FRAMEWORK_HOME}/agents"
mkdir -p "${FRAMEWORK_HOME}/scripts"
mkdir -p "${FRAMEWORK_HOME}/locales"
mkdir -p "${COMMANDS_DIR}/especdev"
mkdir -p "${COMMANDS_DIR}/gd"
mkdir -p "${COMMANDS_DIR}/gd:razonar"

# Copy GD commands (94+ commands aligned with AGENTS.md)

echo -e "  📋 Installing GD commands (94+ aligned)..."
if [ -d "${SOURCE_DIR}/comandos/dc" ]; then
    cp -r "${SOURCE_DIR}/comandos/dc/"*.md "${COMMANDS_DIR}/gd/" 2>/dev/null || true
    cp -r "${SOURCE_DIR}/comandos/dc/"*.md "${COMMANDS_DIR}/especdev/" 2>/dev/null || true
    CMDS_DC=$(ls "${COMMANDS_DIR}/gd/"*.md 2>/dev/null | wc -l | tr -d ' ')
    echo -e "     ${GREEN}✓${NC} ${CMDS_DC} comandos /gd:*"
fi

# Rename for English locale
if [ "$LOCALE" = "en" ]; then
    cd "${COMMANDS_DIR}/gd/" 2>/dev/null && {
        for pair in \
            "comenzar:start" \
            "especificar:specify" \
            "clarificar:clarify" \
            "planificar-tecnico:tech-plan" \
            "desglosar:breakdown" \
            "implementar:implement" \
            "auditar:review" \
            "validar:verify" \
            "archivar:archive" \
            "explorar:explore" \
            "estimar:estimate" \
            "mesa-redonda:roundtable" \
            "mesa-tecnica:tech-panel" \
            "auditar-seguridad:security-audit" \
            "poc:proof-of-concept" \
            "minar-referencias:mine-refs" \
            "capturar:capture" \
            "memorizar:capture" \
            "cerrar-sesion:close" \
            "continuar:continue" \
            "estado:status" \
            "donde-estoy:status" \
            "doctor:diagnostic" \
            "diagnostico:diagnostic" \
            "migrar:migrate" \
            "avance-rapido:fast-forward" \
            "incorporar:incorporate" \
            "metricas:metrics" \
            "actualizar:update"; do
            src="${pair%%:*}.md"
            dst="${pair##*:}.md"
            [ -f "$src" ] && mv "$src" "$dst" 2>/dev/null || true
        done
        cd - >/dev/null
    }
    echo -e "     ${GREEN}✓${NC} Commands renamed to English"
fi

# ═══════════════════════════════════════════════════════════════
# Copy Razonar commands (15 models)
# ═══════════════════════════════════════════════════════════════

echo -e "  🧠 Installing Razonar commands (15 models)..."
if [ -d "${SOURCE_DIR}/comandos/razonar" ]; then
    cp -r "${SOURCE_DIR}/comandos/razonar/"*.md "${COMMANDS_DIR}/gd:razonar/" 2>/dev/null || true
    CMDS_RAZONAR=$(ls "${COMMANDS_DIR}/gd:razonar/"*.md 2>/dev/null | wc -l | tr -d ' ')
    echo -e "     ${GREEN}✓${NC} ${CMDS_RAZONAR} comandos /gd:razonar:*"
fi

# ═══════════════════════════════════════════════════════════════
# Copy skills, rules, templates, hooks, agents
# ═══════════════════════════════════════════════════════════════

echo -e "  🧠 Installing skills..."
[ -d "${SOURCE_DIR}/habilidades" ] && cp -r "${SOURCE_DIR}/habilidades/"* "${FRAMEWORK_HOME}/skills/" 2>/dev/null || true
SKILLS=$(ls -d "${FRAMEWORK_HOME}/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "     ${GREEN}✓${NC} ${SKILLS} skills"

echo -e "  ⚖️  Installing rules..."
[ -d "${SOURCE_DIR}/reglas" ] && cp "${SOURCE_DIR}/reglas/"*.md "${FRAMEWORK_HOME}/rules/" 2>/dev/null || true

echo -e "  📄 Installing templates..."
[ -d "${SOURCE_DIR}/plantillas" ] && cp -r "${SOURCE_DIR}/plantillas/"* "${FRAMEWORK_HOME}/templates/" 2>/dev/null || true

echo -e "  🪝 Installing hooks..."
[ -d "${SOURCE_DIR}/ganchos" ] && cp -r "${SOURCE_DIR}/ganchos/"* "${FRAMEWORK_HOME}/hooks/" 2>/dev/null || true

echo -e "  🤖 Installing agents..."
[ -d "${SOURCE_DIR}/agentes" ] && cp -r "${SOURCE_DIR}/agentes/"* "${FRAMEWORK_HOME}/agents/" 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════
# Copy locales
# ═══════════════════════════════════════════════════════════════

echo -e "  🌍 Installing locales..."
[ -d "${SOURCE_DIR}/locales" ] && cp -r "${SOURCE_DIR}/locales/"*.json "${FRAMEWORK_HOME}/locales/" 2>/dev/null || true

# ═══════════════════════════════════════════════════════════════
# Copy reference files
# ═══════════════════════════════════════════════════════════════

echo -e "  📝 Copying reference files..."
for ROOT_FILE in CLAUDE.md AGENTS.md GEMINI.md; do
    [ -f "${SOURCE_DIR}/${ROOT_FILE}" ] && cp "${SOURCE_DIR}/${ROOT_FILE}" "${FRAMEWORK_HOME}/" 2>/dev/null || true
done

# Copy AGENTS.md if exists in root
if [ -f "AGENTS.md" ]; then
    cp "AGENTS.md" "${FRAMEWORK_HOME}/" 2>/dev/null || true
fi

# ═══════════════════════════════════════════════════════════════
# Save version and locale
# ═══════════════════════════════════════════════════════════════

echo "${VERSION}" > "${FRAMEWORK_HOME}/VERSION"
echo "${LOCALE}" > "${FRAMEWORK_HOME}/locale"

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "  ${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}${BOLD}  ✅ GAF v${VERSION} instalado${NC}"
echo -e "  ${GREEN}${BOLD}  ✅ ${CMDS_DC} DC commands + ${CMDS_RAZONAR} Razonar commands${NC}"
echo -e "  ${GREEN}${BOLD}  ✅ Alineado con AGENTS.md (94+ comandos)${NC}"
echo -e "  ${GREEN}${BOLD}══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📂 ${FRAMEWORK_HOME}/"
echo -e "     ├── skills/    (${SKILLS})"
echo -e "     ├── rules/"
echo -e "     ├── templates/"
echo -e "     ├── hooks/"
echo -e "     ├── agents/"
echo -e "     ├── locales/"
echo -e "     └── CLAUDE.md"
echo ""
echo -e "  📂 ${COMMANDS_DIR}/"
echo -e "     ├── gd/        (${CMDS_DC} commands)"
echo -e "     ├── especdev/  (retrocompatible)"
echo -e "     └── gd:razonar/ (${CMDS_RAZONAR} models)"
echo ""
echo -e "  ${CYAN}Próximos pasos:${NC}"
echo -e "    1. Ejecuta /gd:start en tu IDE"
echo -e "    2. Revisa /gd:status para comandos disponibles"
echo ""
echo -e "  ${GREEN}¡GAF está listo! 🏗️${NC}"
echo ""
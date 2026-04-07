#!/bin/bash

# GAF Framework Initialization Script
# Version: 2.0.0
# Author: CTO Grupo 4D

echo "Initializing GAF (SDD) Framework v2.0..."

# Project Root
PROJECT_ROOT=$(pwd)

# 1. Ensure /develop directory exists (Iron Law IV)
DEVELOP_PATH="$PROJECT_ROOT/develop"
if [ ! -d "$DEVELOP_PATH" ]; then
    echo "Creating mandatory development directory: /develop..."
    mkdir -p "$DEVELOP_PATH"
    touch "$DEVELOP_PATH/.gitkeep"
fi

# 2. Setup EVIDENCE.md Template (Iron Law V)
EVIDENCE_TEMPLATE="$PROJECT_ROOT/scripts/templates/EVIDENCE.md"
if [ ! -f "$EVIDENCE_TEMPLATE" ]; then
    echo "Creating EVIDENCE.md template..."
    mkdir -p "$PROJECT_ROOT/scripts/templates"
    cat << 'EOF' > "$EVIDENCE_TEMPLATE"
# EVIDENCE.md — Certificación de Implementación

## 1. Información del Cambio
- **Tarea**: [ID/Nombre]
- **Fecha**: [YYYY-MM-DD]
- **Autor**: [Agente/Usuario]

## 2. Pruebas Unitarias e Integración
- [ ] Tests pasan (RED -> GREEN -> REFACTOR)
- [ ] Cobertura >= 85%

## 3. Pruebas E2E (Playwright / Newman)
### Playwright (UI)
- [ ] Escenario [A] exitoso
- [ ] Escenario [B] exitoso

### Newman (API)
- [ ] Contrato [X] validado
- [ ] Status codes correctos

## 4. Evidencia de Ejecución (Logs/Screenshots)
```text
[Pegar logs de consola o capturas de pantalla]
```

## 5. Certificación
- [ ] No hay stubs (TODOs) pendientes.
- [ ] El código reside en `/develop`.
- [ ] OWASP Scan limpio.
EOF
fi

# 3. Setup .env.example Template
ENV_TEMPLATE="$PROJECT_ROOT/scripts/templates/.env.example"
if [ ! -f "$ENV_TEMPLATE" ]; then
    echo "Creating .env.example template..."
    cat << 'EOF' > "$ENV_TEMPLATE"
# Environment Configuration Template
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gooderp
DB_SCHEMA=public

# Cognito
COGNITO_USER_POOL_ID=us-east-1_gmre5QtIx
COGNITO_REGION=us-east-1
EOF
fi

# 4. Verify GAF commands directory
GD_PATH="$PROJECT_ROOT/.claude/commands/gd"
if [ ! -d "$GD_PATH" ]; then
    echo "Warning: .claude/commands/gd not found. Check your framework structure."
fi

# Function to add alias if not present
add_alias() {
    local alias_name=$1
    local alias_cmd=$2
    # Escape single quotes for the echo command to ~/.bashrc
    local escaped_cmd=$(echo "$alias_cmd" | sed "s/'/'\\\\''/g")
    if ! grep -q "alias $alias_name=" ~/.bashrc; then
        echo "Adding alias $alias_name to ~/.bashrc..."
        echo "alias $alias_name='$escaped_cmd'" >> ~/.bashrc
    else
        echo "Alias $alias_name already exists in ~/.bashrc."
        # Update it if it exists to fix previous errors
        sed -i "/alias $alias_name=/c\alias $alias_name='$escaped_cmd'" ~/.bashrc
    fi
}

# Add main alias for gd:init
# Note: Using absolute path to ensure it works anywhere
add_alias "gd:init" "$(pwd)/scripts/gd-init.sh"

# Add aliases for core SDD commands (optional - for terminal use)
add_alias "gd:status" "ls -R \"$GD_PATH\""
add_alias "gd:doctor" "echo \"Checking framework health...\"; [ -d \"$GD_PATH\" ] && echo \"GAF commands: OK\" || echo \"GAF commands: MISSING\""

echo "GAF Framework Initialized Successfully!"
echo "Please run 'source ~/.bashrc' to activate aliases."

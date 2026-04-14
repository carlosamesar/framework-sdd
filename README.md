## Orquestación Multi-Agente SDD

El framework ahora cuenta con un orquestador central (ReAct + SDD) que coordina agentes técnicos (Dev, QA, DevOps) usando el pipeline gd:*. El enforcement automático garantiza que ningún agente puede ejecutar tareas sin un SDD válido y validado. Toda delegación, ticket y notificación queda registrada y es auditable.

### Ciclo típico:
1. El usuario ejecuta `/gd:start` o `npx sdd-agent pipeline`
2. El orquestador valida el SDD, crea tickets, delega tareas y notifica a los agentes y al usuario
3. El estado y trace quedan en `engineering-knowledge-base/AGENT-SESSIONS/`

#### Módulos clave:
- `packages/sdd-orchestrator/` (orquestador central)
- `packages/sdd-sdd-management/` (gestión y enforcement SDD)
- `packages/sdd-ticket-management/` (tickets GitHub/Jira/Trello)
- `packages/sdd-agent-delegation/` (delegación multi-agente)
- `packages/sdd-messaging-tool/` (mensajería omnicanal)

---
## Setup obligatorio: Memoria automática (Engram + RAG)

> **Obligatorio:** Antes de cualquier flujo multi-agente, CI o desarrollo, debes tener activos los daemons de memoria automática (Engram y RAG). Sin esto, el framework no cumple el estándar de paridad ni las búsquedas semánticas.

### Pasos rápidos

```bash
cd /ruta/a/framework-sdd
./scripts/start-memory-daemons.sh
./scripts/status-memory-daemons.sh
```

Esto asegura:
- Engram sincroniza memoria persistente y contexto multi-proyecto.
- RAG indexa toda la documentación y specs en Postgres (puerto configurable, default 55433).

Si usas Docker, asegúrate que el puerto no esté ocupado. Puedes cambiarlo en `rag/.env` y `rag/docker-compose.postgres.yml` (`RAG_DOCKER_PORT`).

**Verifica:**
- `engineering-knowledge-base/` debe existir y tener `.engram-sync.pid` y `.engram-sync.log` activos.
- `rag/.rag-index-daemon.pid` y `.rag-index-daemon.log` deben estar presentes y actualizados.

**Más detalles:**
- [docs/lineamiento-memoria-automatica.md](docs/lineamiento-memoria-automatica.md)
- [docs/framework-prerequisites.md](docs/framework-prerequisites.md)

---
for f in packages/engineering-knowledge-base/AGENT-SESSIONS/*.json; do 
    if cat $f | jq -e '[.[] | select(.event=="handoff") | .to] | index("Deployer")' > /dev/null; then 
        echo $f; 
    fi; 
done
```

##### Ejemplo avanzado 3: resumen de resultados finales de cada sesión (Node.js)

```js
// resumen-sesiones.js
const fs = require('fs');
const path = require('path');
const dir = 'packages/engineering-knowledge-base/AGENT-SESSIONS';
for (const file of fs.readdirSync(dir)) {
    const trace = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const final = trace.find(e => e.event === 'result' && e.from === 'Deployer');
    console.log(`${file}:`, final?.result?.result || JSON.stringify(final?.result));
}
```

Ejecuta con:

```bash
node resumen-sesiones.js
```

---
## Memoria persistente multi-agente (Engram)

Cada ejecución de orquestación multi-agente (YAML o código) persiste automáticamente el reasoning y trace en `engineering-knowledge-base/AGENT-SESSIONS/`.

### Ejemplo de uso

```bash
cd packages/sdd-agent-orchestrator/src/agent
node demo-agents-flow-engram.cjs
# Resultado: archivo de sesión en engineering-knowledge-base/AGENT-SESSIONS/<sessionId>.json
```

### Ventajas
- Auditoría y trazabilidad total de reasoning multi-agente.
- Recuperación y análisis de sesiones previas.
- Sincronización automática con el repositorio de memoria Engram.

---
## Orquestación multi-agente declarativa (YAML)

Framework-SDD soporta definición de flujos multi-agente (ReAct) en YAML, permitiendo reasoning, paso de contexto y ejecución de tools MCP reales de forma secuencial y trazable.

### Ejemplo agents-flow.yaml

```yaml
framework: sdd-agent
flow: "Validar y desplegar función multi-tenant"
agents:
    - name: DBValidator
        instructions: "Valida el esquema multi-tenant y produce un análisis."
        tool: gdDatabase
    - name: Deployer
        instructions: "Despliega la función Lambda usando el análisis del agente anterior."
        tool: gdDeploy
context:
    schema:
        tables:
            - name: users
                columns: [id, email]
            - name: tenant_orders
                columns: [id, tenant_id, amount]
    target: lambda
    function: myFunc
```

### Ejecución

```bash
cd packages/sdd-agent-orchestrator/src/agent
node demo-agents-flow.cjs
```

### Resultado
- Reasoning loop y trace de cada agente.
- Paso automático de contexto y resultados entre agentes.
- Ejecución de tools MCP reales (ej: /gd:database, /gd:deploy).

---

**Referencia:**
- `src/agent/agents-flow.yaml`
- `src/agent/demo-agents-flow.cjs`
- `src/agent/parseAgentsFlow.cjs`
# 🚀 Onboarding Rápido — Framework SDD: Nuevo CLI Global y Comandos Avanzados

¡Hola equipo!

Ya está disponible el **CLI global `sdd-agent`** para ejecutar y orquestar todos los comandos avanzados `/gd:*` (multi-tenant DB, despliegue AWS, pipelines YAML, etc.) de forma centralizada y automatizada.

**¿Cómo empezar?**

1. **Instala dependencias y da permisos:**
    ```bash
    npm run agent:install
    chmod +x bin/sdd-agent.cjs
    ```

2. **Consulta la ayuda y comandos disponibles:**
    ```bash
    node bin/sdd-agent.cjs --help
    ```

3. **Ejecuta comandos clave:**
    - Análisis multi-tenant de BD:
      ```bash
      node bin/sdd-agent.cjs database --schema schema.json
      ```
    - Simulación de despliegue AWS:
      ```bash
      node bin/sdd-agent.cjs deploy --target lambda --function myFunc
      ```
    - Pipelines YAML automatizados:
      ```bash
      node bin/sdd-agent.cjs flow ./pipelines/mi-pipeline.yaml
      ```

4. **Referencia y ejemplos:**
    - Documentación extendida: `docs/orquestador-agente-sdd.md`
    - Ejemplos de pipelines: `docs/EJEMPLO-USO-GAF-OPENCODE.md`
    - Contrato y reglas: `AGENTS.md`, `COMMANDS-INDEX.md`

**Recuerda:**  
El CLI es compatible con memoria persistente (Engram), automatización avanzada y puede integrarse en CI/CD.

¡Cualquier duda, revisa el README actualizado o pregunta en el canal de soporte!

## Uso del CLI Global: `sdd-agent`

El CLI `sdd-agent` permite ejecutar y orquestar todos los comandos avanzados `/gd:*` de forma global, integrando análisis multi-tenant, despliegue AWS y flujos YAML automatizados.

### Instalación

Asegúrate de tener las dependencias instaladas y los permisos de ejecución:

```bash
npm run agent:install
chmod +x bin/sdd-agent.cjs
```

### Ejecución básica

```bash
# Mostrar ayuda y comandos disponibles
node bin/sdd-agent.cjs --help
```

### Comandos disponibles

| Comando      | Descripción                                                      | Ejemplo de uso                                                        |
|--------------|------------------------------------------------------------------|-----------------------------------------------------------------------|
| `database`   | Ejecuta análisis y validación multi-tenant de BD                 | `node bin/sdd-agent.cjs database --schema schema.json`                |
| `deploy`     | Simula despliegue AWS (Lambda, ECS, etc.)                        | `node bin/sdd-agent.cjs deploy --target lambda --function myFunc`     |
| `flow`       | Ejecuta un pipeline YAML con pasos `/gd:*`                       | `node bin/sdd-agent.cjs flow pipeline.yaml`                           |

### Ejemplo de pipeline YAML (`flow`)

```yaml
steps:
    - command: database
        args:
            schema: ./schemas/mi-esquema.json
    - command: deploy
        args:
            target: lambda
            function: myFunc
            env:
                - AWS_ACCESS_KEY_ID
```

Ejecuta el pipeline:

```bash
node bin/sdd-agent.cjs flow ./pipelines/mi-pipeline.yaml
```

### Integración en el flujo de desarrollo

- Todos los comandos `/gd:*` pueden ser orquestados desde el CLI, pipelines YAML o integrados en CI/CD.
- El CLI es compatible con memoria persistente (Engram) y automatización avanzada.
- Consulta la ayuda integrada para ver argumentos y ejemplos:  
    `node bin/sdd-agent.cjs --help`

---

**Referencia rápida:**  
- Documentación extendida: `docs/orquestador-agente-sdd.md`
- Ejemplos de pipelines: `docs/EJEMPLO-USO-GAF-OPENCODE.md`
- Contrato y reglas: `AGENTS.md`, `COMMANDS-INDEX.md`
### 7. Comandos CLI globales
- `bin/gd-database.js --schema <archivo.json>` — Análisis multi-tenant de BD
- `bin/gd-deploy.js --target <lambda|ecs> [--function <name>] [--service <name>] [--env <VAR1,VAR2,...>]` — Simulación de despliegue AWS
# Framework SDD - Specification-Driven Development

> **Versión**: 2.1 | **Última actualización**: 2026-04-11

Framework de desarrollo basado en especificaciones para proyectos enterprise con arquitectura híbrida Lambda + NestJS.

---


## 🚀 Instalación y Onboarding Rápido

Sigue estos pasos para dejar Framework-SDD 100% funcional tras clonar el repo:

### 1. Clona el repositorio y dependencias
- Clona este repositorio y el de memorias (`engineering-knowledge-base`) en la raíz.

### 2. Inicializa comandos y entorno
- Ejecuta `./scripts/gd-init.sh` para crear alias y comandos.
- Activa los alias con `source ~/.bashrc` (o tu shell equivalente).
- Instala dependencias con `npm install`.
- Verifica la instalación con `gd:doctor` y `npm run spec:validate`.

### 3. Memoria Persistente (Engram) y RAG
- Copia y completa `config/engram-daemon.env.example` a `~/.config/framework-sdd/engram-daemon.env` (agrega tu ENGRAM_GIT_TOKEN).
- Inicia los daemons de memoria y RAG:
    ```bash
    ./scripts/start-memory-daemons.sh
    ./scripts/status-memory-daemons.sh
    ```
    O usa systemd para ejecución automática (ver `docs/lineamiento-memoria-automatica.md`).
- Para RAG, configura Postgres local con Docker (`npm run rag:db:up`), copia `rag/.env.example` a `rag/.env` y ajusta variables.

### 4. Orquestador y Agentes
- Instala dependencias del orquestador con `npm run agent:install`.
- Usa `npx sdd-agent` para pipelines, gd-cycle, auditorías, etc.
- Consulta la guía de orquestador en `docs/orquestador-agente-sdd.md` y producción en `docs/orquestador-produccion.md`.

### 5. Documentación y Ayuda
- Consulta el índice maestro en `docs/INDICE-DOCUMENTACION-FRAMEWORK.md`.
- Para memoria y contexto, revisa `docs/lineamiento-memoria-automatica.md` y `openspec/MEMORY.md`.
- Para ejemplos de uso y flujos, ver `docs/EJEMPLO-USO-GAF-OPENCODE.md`.


### 6. Comandos Clave
- `/gd:start`, `/gd:specify`, `/gd:plan`, `/gd:database`, `/gd:implement`, `/gd:deploy`, `/gd:review`, `/gd:verify`, `/gd:archive` (pipeline completo y especializado).
- `/gd:flow` para flujos YAML personalizados.
- `/gd:guardrail`, `/gd:checkpoint`, `/gd:eval`, `/gd:webhook`, `/gd:policy`, `/gd:route`, `/gd:research`, `/memory *` para automatización avanzada.

---


## Pipeline recomendado (alineado a gd:start)

1. `/gd:start` — Inicia la tarea y detecta nivel.
2. `/gd:specify` — Genera especificaciones.
3. `/gd:plan` — Blueprint técnico.
4. `/gd:database` — Diseño, migración y validación multi-tenant.
5. `/gd:implement` — Desarrollo y TDD.
6. `/gd:deploy` — Despliegue AWS (Lambda, ECS, ECR, ALB).
7. `/gd:review` — Auditoría técnica.
8. `/gd:verify` — Validación contra la especificación.
9. `/gd:archive` — Archiva y sincroniza cambios.

---

## Arquitectura General

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Backend** | Lambdas AWS (Node.js 20 ESM) + Microservicios NestJS |
| **Base de datos** | PostgreSQL con JSONB y pgVector |
| **Frontend** | Angular 17+ |
| **Infraestructura** | Terraform / AWS CDK |
| **IA** | AWS Bedrock + pgVector |

### Estructura del Proyecto

```
Framework-SDD/
├── openspec/             # Delta specs, config, tools-manifest, plantillas ReAct
├── rag/                  # RAG pgvector (scripts, Docker Postgres local opcional)
├── config/               # Plantillas daemon Engram / RAG (sin secretos)
├── .github/workflows/    # CI framework (OpenSpec + ReAct)
├── docs/                 # Guías (índice, memoria, MCP, prerrequisitos)
├── lib/lambda/           # Lambdas AWS por dominio
│   └── transacciones/    # Transacciones, bancos, productos, etc.
├── develop/
│   ├── backend/          # Código backend
│   │   └── gooderp-orchestation/   # Orquestación NestJS + Lambda
│   └── frontend/         # Cliente Angular
│       └── gooderp-client/         # Frontend Angular 17+
├── servicio-contabilidad/  # Microservicio NestJS Contabilidad
├── servicio-tesoreria/     # Microservicio NestJS Tesorería
├── terraform/            # Infraestructura como código
├── scripts/              # gd-init, daemons memoria, engram-mcp
└── engineering-knowledge-base/  # Memoria Engram (clon aparte; a menudo gitignored)
```

---

## Proyectos Integrados

### Frontend - gooderp-client

Aplicación Angular 17+ con:
- Módulos: Contabilidad, Tesorería, Parqueaderos, Recursos Humanos
- Autenticación Cognito
- Playwright E2E
- Despliegue AWS Amplify

**Ubicación**: `develop/frontend/gooderp-client/`

```bash
cd develop/frontend/gooderp-client

# Instalar dependencias
npm install

# Desarrollo
ng serve

# Build producción
npm run build

# Tests E2E
npx playwright test
```

### Backend - gooderp-orchestation

Backend NestJS con:
- Lambdas de orquestación
- Servicios: Contabilidad, Tesorería
- Docker Compose: PostgreSQL, RabbitMQ
- Despliegue a AWS

**Ubicación**: `develop/backend/gooderp-orchestation/`

```bash
cd develop/backend/gooderp-orchestation

# Instalar dependencias
npm install

# Docker Compose (PostgreSQL + RabbitMQ)
docker-compose -f docker-compose.postgres.yml up -d
docker-compose -f docker-compose.rabbitmq.yml up -d

# Desarrollo
npm run start:dev

# Despliegue
./deploy-tesoreria.sh
```

---

## Inicialización del Proyecto

### 1. Requisitos Previos

- Node.js 20+
- AWS CLI configurado
- PostgreSQL 14+
- Git

### 2. Clonar y Configurar

```bash
# Clonar repositorio
git clone <repo-url>
cd Framework-SDD

# Instalar dependencias globales
npm install -g @nestjs/cli typescript

# Instalar dependencias del proyecto
npm install

# Verificar estructura
ls -la
```

### 3. Configurar Variables de Entorno

Crear archivos `.env` en cada servicio:

```ini
# servicio-contabilidad/.env
NODE_ENV=development
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=gooderp
DB_SCHEMA=contabilidad
COGNITO_USER_POOL_ID=us-east-1_gmre5QtIx
COGNITO_REGION=us-east-1

# servicio-tesoreria/.env
NODE_ENV=development
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=gooderp
DB_SCHEMA=tesoreria
```

### 4. Inicializar Microservicios

```bash
# Servicio Contabilidad
cd servicio-contabilidad
npm install
npm run start:dev

# Servicio Tesorería (en otra terminal)
cd servicio-tesoreria
npm install
npm run start:dev
```

### 5. Configurar Memoria Persistente (Engram)

```bash
# Verificar que Engram esté configurado
cd engineering-knowledge-base
cat ENGRAM.md

# El daemon de sincronización corre en background
# Verifica cambios cada 30 segundos
```

---

## Convenciones de Nomenclatura

| Recurso | Patrón | Ejemplo |
|---------|--------|---------|
| Lambdas | `fn<Recurso>` | `fnBanco`, `fnTransaccion` |
| Microservicios | `servicio-<dominio>` | `servicio-contabilidad` |
| Entidades | `<Recurso>Entidad` | `CajaEntidad`, `BancoEntidad` |
| Servicios | `<Recurso>Service` | `CajaService`, `BancoService` |
| Controladores | `<Recurso>Controller` | `CajaController`, `BancoController` |
| DTOs | `Crear<Recurso>Dto`, `Actualizar<Recurso>Dto` | `CrearCajaDto` |

---

## Las 3 Leyes de Hierro

| Ley | Principio | Aplicación Práctica |
|-----|-----------|---------------------|
| **I. TDD** | Todo código requiere tests | `RED` → `GREEN` → `REFACTOR` |
| **II. Debugging** | Primero causa raíz | Reproducir → Aislar → Entender → Corregir → Verificar |
| **III. Verificación** | Evidencia antes que afirmaciones | ✅ "Tests pasan" > ❌ "Creo que funciona" |

---

## Flujo SDD (6 Fases)

| Fase | Comando | Qué hace |
|------|---------|----------|
| 1. Specify | `/gd:specify` | Especificación Gherkin con escenarios |
| 2. Clarify | `/gd:clarify` | Detectar ambigüedades |
| 3. Plan | `/gd:plan` | Blueprint técnico |
| 4. Break Down | `/gd:breakdown` | Dividir en tareas |
| 5. Implement | `/gd:implement` | TDD: test → código → refactor |
| 6. Review | `/gd:review` | Peer review automático |
| `/gd:verify` | `/gd:validar` | Validar implementación |

---

## Comandos SDD Principales

### Flujo de Trabajo

| Comando | Alias | Descripción |
|---------|-------|-------------|
| `/gd:start` | `/gd:iniciar` | Iniciar tarea con detección automática de complejidad |
| `/gd:specify` | `/gd:especificar` | Convertir idea en especificación Gherkin |
| `/gd:clarify` | `/gd:clarificar` | Detectar ambigüedades |
| `/gd:plan` | `/gd:tech-plan` | Generar blueprint técnico |
| `/gd:breakdown` | `/gd:desglosar` | Dividir en tareas concretas |
| `/gd:implement` | `/gd:aplicar` | Ejecutar con TDD |
| `/gd:review` | `/gd:auditar` | Peer review automático |
| `/gd:verify` | `/gd:validar` | Validar implementación |

### Análisis y Decisiones

| Comando | Descripción |
|---------|-------------|
| `/gd:explore` | Explorar codebase |
| `/gd:estimate` | Estimar con 4 modelos |
| `/gd:roundtable` | Discusión multi-perspectiva |
| `/gd:tech-panel` | Panel de expertos |
| `/gd:security-audit` | Auditoría OWASP |

### Sesión y Contexto

| Comando | Descripción |
|---------|-------------|
| `/gd:continue` | Recuperar sesión previa |
| `/gd:status` | Mostrar estado del proyecto |
| `/gd:doctor` | Diagnosticar problemas |
| `/gd:close` | Cerrar sesión correctamente |

### Modelos de Razonamiento (15)

| Comando | Cuándo usar |
|---------|-------------|
| `/gd:razonar:primeros-principios` | Descomponer a verdades fundamentales |
| `/gd:razonar:5-porques` | Causa raíz de bug |
| `/gd:razonar:pareto` | Focus 80/20 |
| `/gd:razonar:pre-mortem` | Anticipar fallos |
| `/gd:razonar:probabilistico` | Razonar en probabilidades |

---

## Seguridad y Multi-Tenant

### Extracción de Tenant (Lambdas)

```javascript
// Usar utils/sanitization.mjs - función extractTenantId()
const tenantId = extractTenantId(event);
```

Prioridades:
1. JWT claims (Cognito)
2. HTTP API estándar
3. Step Functions (body)
4. Invocación directa (body)

### Microservicios NestJS

- **Guard global**: `JwtTenantGuard` en `APP_GUARD`
- **Decorador**: `@TenantId()` para extraer tenant del token
- **User Pool**: `us-east-1_gmre5QtIx` (NestJS)

---

## Testing

### Lambdas (Jest)

```bash
# Ejecutar tests
cd lib/lambda/<modulo>
npm test

# Coverage
npm test -- --coverage --threshold=85
```

### NestJS

```bash
# Unit tests
npm run test

# Integration
npm run test:cov

# E2E
npm run test:e2e
```

---

## Pipeline de Calidad

```
Idea → Specify → Clarify → Plan → Break Down → Implement → Review → Deploy → Verify
```

| Gate | Qué verifica | Criterio |
|------|--------------|----------|
| Spec Gate | Especificación completa | Gherkin con escenarios |
| TDD Gate | Tests antes del código | RED → GREEN |
| Coverage Gate | Cobertura mínima | ≥ 85% |
| OWASP Gate | Seguridad | 0 vulnerabilidades |
| Architecture Gate | Principios SOLID | Patrones respetados |

---

## Autenticación

### Microservicios NestJS
- **User Pool**: `us-east-1_gmre5QtIx`
- **Issuer**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_gmre5QtIx`

### Lambdas AWS
- **User Pool**: `us-east-1_fQl9BKSxq`
- **Usuario prueba**: `admin@gooderp.com` / `Admin123!`

---

## Memoria Persistente (Engram + RAG)

### Lineamiento obligatorio (entornos de desarrollo)

Quien use **Engram** y **RAG** en este framework **debe** mantener la actualización automática:

1. **Daemon Engram** — sync periódica de la memoria SQLite hacia el repo `engineering-knowledge-base` (commit/push).
2. **Daemon RAG** — reindexado periódico de la documentación hacia PostgreSQL (`rag.document_chunks`).

**Guía única para el equipo:** [`docs/lineamiento-memoria-automatica.md`](docs/lineamiento-memoria-automatica.md).  
Arranque conjunto: `./scripts/start-memory-daemons.sh` · Estado: `./scripts/status-memory-daemons.sh`.

---

El framework utiliza **Engram** como sistema de memoria persistente que sobrevive entre sesiones y compactaciones de contexto. Los datos se almacenan en `engineering-knowledge-base/`. La sincronización **continua** con Git exige el **daemon** (no basta con usar solo MCP).

### Configuración Inicial de Memoria (Engram)

Para que el sistema de memoria persistente funcione correctamente y se sincronice con el repositorio central de conocimiento, los usuarios **DEBEN** clonar el repositorio de base de conocimiento dentro de la raíz del framework:

```bash
# 1. Navegar a la raíz del framework
cd Framework-SDD

# 2. Clonar el repositorio de base de conocimiento (Engram)
# IMPORTANTE: El directorio DEBE llamarse 'engineering-knowledge-base'
git clone https://github.com/carlosamesar/engineering-knowledge-base engineering-knowledge-base

# 3. Configurar push seguro (sin tokens en el repo)
mkdir -p ~/.config/framework-sdd
cp config/engram-daemon.env.example ~/.config/framework-sdd/engram-daemon.env
chmod 600 ~/.config/framework-sdd/engram-daemon.env
# Editar: ENGRAM_GIT_TOKEN, ENGRAM_DATA_DIR (ruta absoluta a engineering-knowledge-base)

# 4. Iniciar daemons de memoria automática (OBLIGATORIO según lineamiento)
./scripts/start-memory-daemons.sh
# O por separado: ./scripts/engram-sync-daemon.sh start && ./scripts/rag-index-daemon.sh start
```

Ver también: [`docs/lineamiento-memoria-automatica.md`](docs/lineamiento-memoria-automatica.md), [`docs/mcp-engram-multi-ide.md`](docs/mcp-engram-multi-ide.md).

### Proyectos Configurados

| Proyecto | ID | Ubicación |
|----------|----|-----------|
| **Core** | `framework-sdd` | Raíz del repositorio |
| **Frontend** | `gooderp-client` | `develop/frontend/gooderp-client/` |
| **Backend** | `gooderp-orchestation` | `develop/backend/gooderp-orchestation/` |

### Sincronización automática — Engram

**Obligatorio** para cumplir el lineamiento: el daemon Engram verifica cambios cada ~30 s, ejecuta `engram sync` y hace `commit` / `push` cuando corresponde.

```bash
./scripts/engram-sync-daemon.sh start|status|stop
```

### Sincronización automática — RAG

**Obligatorio** para índice al día: `scripts/rag-index-daemon.sh` ejecuta `npm run index` en `rag/` cada `RAG_INDEX_INTERVAL` segundos (default **3600**). Configuración: `config/rag-daemon.env.example` → `~/.config/framework-sdd/rag-daemon.env`.

```bash
./scripts/rag-index-daemon.sh start|status|stop
```

### Systemd — ambos daemons (recomendado)

Ver pasos completos en [`docs/lineamiento-memoria-automatica.md`](docs/lineamiento-memoria-automatica.md). Plantillas: `scripts/engram-sync-daemon.service`, `scripts/rag-index-daemon.service`.

### RAG (pgvector) — setup inicial

Búsqueda semántica: [`rag/README.md`](rag/README.md).

```bash
npm run rag:db:up     # Postgres + pgvector en Docker (puerto host típico 5433); ver rag/README.md
npm run rag:migrate   # una vez (extensión vector + tabla rag.*)
# Ollama: ollama pull nomic-embed-text  (o OpenAI en rag/.env)
npm run rag:index     # manual; el daemon lo repite en ciclo
npm run rag:query -- "multi-tenant JWT"
```

### Protocolo para Agentes (OBLIGATORIO)

#### 1. Guardar (`mem_save`)
Los agentes deben llamar a `mem_save` proactivamente después de:
- Tomar decisiones arquitectónicas o de diseño.
- Completar un bug fix (incluyendo causa raíz).
- Establecer nuevas convenciones o patrones.
- Descubrir comportamientos inesperados o "gotchas".

#### 2. Buscar (`mem_search`)
Antes de iniciar una tarea, el agente debe consultar la memoria:
1. `mem_context`: Recupera contexto de la sesión actual/reciente.
2. `mem_search`: Búsqueda semántica en el historial histórico de todos los proyectos.

#### 3. Cierre de Sesión (`mem_session_summary`)
Al finalizar una sesión de trabajo, es **obligatorio** generar un resumen estructurado con `Goal`, `Instructions`, `Discoveries`, `Accomplished` y `Next Steps`.

---

## Referencias Obligatorias

### Lambdas
- `lib/lambda/transacciones/fnTransaccionLineas/` - Patrón maduro
- `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md` - Orquestación SAGA

### Microservicios NestJS
- `servicio-tesoreria/src/app.module.ts` - Configuración completa
- `servicio-contabilidad/CERTIFICACION-FUNCIONAL.md` - Endpoints certificados

### Documentación
- `AGENTS.md` - Contrato maestro
- `docs/INDICE-DOCUMENTACION-FRAMEWORK.md` - Mapa de toda la documentación
- `openspec/MEMORY.md` - Memoria SDD y enlaces rápidos
- `project.md` - Estado actual
- `registry.md` - Índice de cambios
- `npm run rag:query -- "…"` / `rag/scripts/query.mjs` - RAG sobre specs y AGENTS

---

## Zero Errors Policy

**Anti-Patrones Prohibidos:**
- ❌ `"Asumiendo que..."` — Siempre verificar
- ❌ `"Probablemente..."` — Nunca guess
- ❌ `"Debería funcionar..."` — Tests primero
- ❌ `"Completaré después..."` — Código siempre completo

---

## Credenciales de Prueba

```
Usuario: admin@gooderp.com
Password: Admin123!
```

更多命令和详细信息，请参阅 [AGENTS.md](AGENTS.md)。

---

## Tools/Plugins custom: auto-registro y loader

Puedes agregar tus propias herramientas (tools/plugins) para agentes creando archivos JS en `develop/tools/`.

### Ejemplo de tool custom

```js
const { tool } = require('../../packages/sdd-agent-orchestrator/src/toolLoader');

const suma = tool({
  name: 'suma',
  description: 'Suma dos números',
  input_schema: { a: 'number', b: 'number' }
})(function suma({ a, b }) {
  return a + b;
});

module.exports = { registeredTools: [suma] };
```

### Loader automático

El orquestador detecta y registra automáticamente todas las tools exportadas en `develop/tools/*.js` usando el loader:

```js
const { loadCustomTools } = require('../packages/sdd-agent-orchestrator/src/toolLoader');
const tools = loadCustomTools();
```

Esto permite extender el framework sin modificar el core. Documenta tu tool con `name`, `description` e `input_schema` para máxima compatibilidad.
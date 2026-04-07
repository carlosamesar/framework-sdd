# Framework SDD - Specification-Driven Development

> **Versión**: 2.0 | **Última actualización**: 2026-04-07

Framework de desarrollo basado en especificaciones para proyectos enterprise con arquitectura híbrida Lambda + NestJS.

---

## Guía de Instalación y Uso

Para poner en marcha el Framework GAF (SDD) en tu entorno local y configurarlo para OpenCode, consulta la guía detallada:

👉 **[Guía de Instalación y Uso (GAF-OPENCODE.md)](docs/EJEMPLO-USO-GAF-OPENCODE.md)**

### Pasos Rápidos:
1.  **Instalar Comandos:** `./scripts/gd-init.sh`
2.  **Activar Entorno:** `source ~/.bashrc`
3.  **Verificar:** `gd:doctor`

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
├── lib/lambda/           # Lambdas AWS por dominio
│   └── transacciones/    # Transacciones, bancos, productos, etc.
├── develop/
│   ├── backend/         # Código backend
│   │   └── gooderp-orchestation/   # Orquestación NestJS + Lambda
│   └── frontend/        # Cliente Angular
│       └── gooderp-client/         # Frontend Angular 17+
├── servicio-contabilidad/  # Microservicio NestJS Contabilidad
├── servicio-tesoreria/     # Microservicio NestJS Tesorería
├── terraform/           # Infraestructura como código
├── scripts/             # Scripts de automatización
└── engineering-knowledge-base/  # Memoria persistente Engram
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
| 6. Review | `/gd:review` | Peer review 7 dimensiones |

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

## Memoria Persistente (Engram)

El framework usa **Engram** para memoria persistente que sobrevive entre sesiones. Configurado para 3 proyectos:

| Proyecto | Descripción |
|----------|-------------|
| `framework-sdd` | Framework raíz, lambdas, servicios NestJS |
| `gooderp-client` | Frontend Angular 17+ (develop/frontend/) |
| `gooderp-orchestation` | Backend NestJS + Lambda (develop/backend/) |

### Protocolo de Uso

```bash
# Guardar después de decisiones/completar trabajo
# Especificar el proyecto correcto:
mem_save title: "Fixed bug" type: bugfix project: "framework-sdd"
mem_save title: "Angular component" type: discovery project: "gooderp-client"
mem_save title: "Lambda orchestration" type: pattern project: "gooderp-orchestation"

# Buscar en todas las memorias
mem_search query: "Cognito"

# Buscar en proyecto específico
mem_search query: "autenticación" project: "gooderp-client"
```

### Después de Compactación

1. Llamar `mem_session_summary` inmediatamente
2. Luego `mem_context` para recuperar contexto adicional
3. Solo entonces continuar trabajando

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
- `project.md` - Estado actual
- `registry.md` - Índice de cambios
- `rag/scripts/query.mjs` - Consultar decisiones pasadas

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
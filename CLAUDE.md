# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Orquestador y Enforcement Central

Toda acción de agentes debe ser validada por el orquestador central (`sdd-orchestrator`), con enforcement SDD y trazabilidad. Ningún agente puede ejecutar tareas sin SDD válido.

Ejemplo:
```js
const { orchestrateSDD } = require('packages/sdd-orchestrator');
await orchestrateSDD({ sddPath: 'openspec/sdd.md', repo: 'framework-sdd', owner: 'carlosamesar', agentes: [...] });
```

---

## Ultra-Light Rules (para Claude Sonnet)

**Versión**: 3.1 | **Optimizado**: 2026-04-15

### 6 Reglas de Hierro (OBLIGATORIAS, sin excepciones)

1. **Multi-tenant**: `tenantId` SIEMPRE desde JWT (`custom:tenant_id`), **NUNCA** de body/params/query
2. **TDD obligatorio**: RED → GREEN → REFACTOR, coverage ≥ 85% en módulos de negocio
3. **Copiar patrones maduros**: `fnTransaccionLineas` (Lambda), `servicio-tesoreria` (NestJS) — **NO inventar**
4. **ResponseBuilder**: todas las lambdas usan `utils/responseBuilder.mjs` — **NO devolver respuestas crudas**
5. **Memory first**: consultar `project.md`/`registry.md` o `npm run rag:query` antes de responder
6. **Orquestación gd obligatoria**: seguir estrictamente `/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive`, sin saltos ni cierres parciales

---

## Comandos de Desarrollo

### Framework principal

```bash
# Validar OpenSpec y verificar implementaciones
npm run framework:ci          # spec:validate + spec:validate-react + spec:implements

# Suite completa (CI + e2e + orchestrator)
npm run framework:test

# Validaciones individuales
npm run spec:validate
npm run spec:validate-react
npm run spec:implements

# Tests de certificación (Jest)
npm test                      # node --experimental-vm-modules jest test-certification/

# Agente CLI
npm run agent:install
node bin/sdd-agent.mjs --help
npx sdd-agent pipeline
```

### Subproyectos

```bash
# Frontend (Angular 17+)
cd develop/frontend/gooderp-client && ng serve
cd develop/frontend/gooderp-client && npx playwright test

# Backend NestJS
cd develop/backend/gooderp-orchestation && npm run start:dev

# Microservicio Contabilidad
cd servicio-contabilidad && npm run start:dev

# Microservicio Tesorería
cd servicio-tesoreria && npm run start:dev

# Tests de un módulo Lambda
cd lib/lambda/<modulo> && npm test
cd lib/lambda/<modulo> && npm test -- --coverage --threshold=85

# Orchestrator tests
npm run orchestrator:test
npm run orchestrator:pipeline
```

### RAG y Memoria

```bash
# Consultar decisiones pasadas
npm run rag:query -- "cómo extraer tenantId"

# RAG DB (Docker pgvector)
npm run rag:db:up
npm run rag:migrate           # primera vez
npm run rag:index             # reindexar

# Daemons de memoria automática (obligatorio antes de flujos multi-agente)
npm run memory:daemons:start
npm run memory:daemons:status

# Estado del proyecto
cat engineering-knowledge-base/project.md
```

---

## Orquestación obligatoria del ciclo de vida

```
/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive
```

- `/gd:review` es el gate central de calidad — decide PASS o FAIL.
- `/gd:verify` no se ejecuta sin review PASS.
- `/gd:close` exige `CONSUMO.md` + `EVIDENCE.md` completos.
- `/gd:release`, `/gd:deploy` y `/gd:archive` requieren trazabilidad y cero BLOCKERs.
- Si el usuario pide "implementar" sin contexto, reconducir primero por `/gd:start`.

---

## Arquitectura

### Stack

| Componente | Tecnología |
|---|---|
| Backend | Lambdas AWS Node.js 20 ESM + Microservicios NestJS |
| Base de datos | PostgreSQL con JSONB y pgVector |
| Frontend | Angular 17+ (Amplify) |
| Infraestructura | Terraform / AWS CDK |
| IA | AWS Bedrock + pgVector |

### Estructura clave

```
Framework-SDD/
├── openspec/                   # Delta specs, tools-manifest, plantillas ReAct
├── packages/sdd-agent-orchestrator/  # Orquestador central multi-agente
├── rag/                        # RAG pgvector (Docker Postgres opcional)
├── scripts/                    # gd-init, daemons memoria, engram-mcp
├── lib/lambda/transacciones/   # Lambdas AWS por dominio
├── develop/
│   ├── backend/gooderp-orchestation/    # NestJS + Lambda
│   └── frontend/gooderp-client/         # Angular 17+
├── servicio-contabilidad/      # Microservicio NestJS (puerto 3003)
├── servicio-tesoreria/         # Microservicio NestJS (puerto 3004)
├── engineering-knowledge-base/ # Memoria Engram (repo separado)
├── project.md                  # Estado actual del proyecto
└── registry.md                 # Índice de cambios
```

---

## Patrones de Referencia (NO explicar, solo copiar)

**Lambda madura**: `lib/lambda/transacciones/fnTransaccionLineas/`
- Router: `index.mjs`
- Tenant: `utils/sanitization.mjs` → `extractTenantId()`
- Respuestas: `utils/responseBuilder.mjs`
- BD: `utils/database.mjs` (pool singleton)

**NestJS maduro**: `servicio-tesoreria/src/`
- Controller: `tesoreria/controllers/caja.controller.ts`
- Service: `tesoreria/services/caja.service.ts`
- Guard: `common/guards/jwt-tenant.guard.ts` (global en AppModule)
- Decoradores: `common/decorators/tenant-id.decorator.ts` → `@TenantId()`

---

## Lazy Loading (NO cargar AGENTS.md completo)

**Regla**: Leer solo la sección específica necesaria según la tarea:

| Tipo de tarea | Qué leer | Líneas aprox. |
|---|---|---|
| Lambda nueva | `AGENTS.md` § "Lambdas en lib/lambda" | 235-700 |
| NestJS nuevo | `AGENTS.md` § "Microservicios NestJS" | 800-2100 |
| Comando /gd:* | `.claude/commands/gd/[nombre].md` | archivo individual |
| Seguridad | `AGENTS.md` § "Seguridad y Multi-Tenant" | 120-230 |
| Testing | `AGENTS.md` § "Pruebas, TDD/BDD" | 700-1100 |

**Si no estás seguro qué sección**: consultar RAG primero (`npm run rag:query -- "pregunta"`)

---

## Convenciones de Nomenclatura

| Recurso | Patrón | Ejemplo |
|---|---|---|
| Lambdas | `fn<Recurso>` | `fnBanco`, `fnTransaccion` |
| Microservicios | `servicio-<dominio>` | `servicio-contabilidad` |
| Entidades | `<Recurso>Entidad` | `CajaEntidad` |
| Servicios | `<Recurso>Service` | `CajaService` |
| Controladores | `<Recurso>Controller` | `CajaController` |
| DTOs | `Crear<Recurso>Dto` / `Actualizar<Recurso>Dto` | `CrearCajaDto` |

---

## Memoria Persistente (Engram)

El protocolo completo está en **AGENTS.md** (sección "Memoria Persistente (Engram)").

**Resumen rápido**:
- **Guardar**: `mem_save` después de decisiones, completados, descubrimientos
- **Buscar**: `mem_search` cuando pregunten sobre cosas pasadas
- **Cerrar sesión**: `mem_session_summary` (obligatorio)
- **Datos**: `engineering-knowledge-base/` con sync automático via git

Setup inicial:
```bash
git clone https://github.com/carlosamesar/engineering-knowledge-base engineering-knowledge-base
cp config/engram-daemon.env.example ~/.config/framework-sdd/engram-daemon.env
./scripts/start-memory-daemons.sh
```

---

## Referencias Clave

- `AGENTS.md` — Contrato maestro (128 KB — cargar solo la sección relevante)
- `docs/INDICE-DOCUMENTACION-FRAMEWORK.md` — Mapa de toda la documentación
- `openspec/MEMORY.md` — Memoria SDD y enlaces rápidos
- `project.md` — Estado actual
- `registry.md` — Índice de cambios
- `docs/TOKEN-OPTIMIZATION-STRATEGY.md` — Optimización de tokens

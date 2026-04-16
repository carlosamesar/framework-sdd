# AGENTS.md — Ultra-Light

SDD estricto con contexto mínimo.

## Reglas
1. TDD.
2. `tenantId` solo desde JWT.
3. Copiar patrones maduros.
4. Lambdas con ResponseBuilder + métodos completos + CORS.
5. No cerrar sin evidencia.
6. Trabajar en `fix/*` + PR.

## Flujo
`/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive`

## Carga
- base: este archivo + archivo del agente
- un módulo de `.agents-core/`
- `COMMANDS-INDEX.md` solo si hay `gd:*`
- `PATTERNS-CACHE.md` para snippets
- RAG solo para dudas puntuales

## Stacks y Proyectos Soportados

### Command Format
```
/gd:start --stack=<stack> --project=<project> "descripción"
```

### Stacks Disponibles
| Stack | Descripción |
|------|------------|
| `frontend` | Proyectos Angular/React |
| `backend` | Proyectos NestJS/Lambda |

### Proyectos por Stack

#### Frontend
| Project | Ruta | Descripción |
|---------|------|------------|
| `sigat` | /develop/frontend/sigat-client | SIGAT Client (Angular 21) |
| `gooderp` | /develop/frontend/gooderp-client | GoodERP Client |

#### Backend
| Project | Ruta | Descripción |
|---------|------|------------|
| `sigat` | /develop/backend/sigat-orchestation | SIGAT Orchestration (NestJS) |
| `gooderp` | /develop/backend/gooderp-orchestation | GoodERP Orchestation |

### Ejemplos de Uso
```bash
# Frontend SIGAT
/gd:start --stack=frontend --project=sigat "integrar con backend"

/gd:start --stack=frontend --project=gooderp "agregar componente tabla"

/gd:start --stack=backend --project=sigat "crear endpoint auth"

/gd:start --stack=backend --project=gooderp "crear lambda fnCategoria"
```

### shortcuts
- `--stack=f` = `--stack=frontend`
- `--stack=b` = `--stack=backend`
- `-s <stack>` = `--stack=<stack>`
- `-p <project>` = `--project=<project>`
# Design: SIGAT Workspace Microservice

## Technical Approach

NestJS 10 + TypeORM + PostgreSQL. Tres agregados: `WorkspaceActivity`, `WorkspaceActivityAttachment`, `WorkspaceActivityReview`. Un controlador orquesta rutas; tres servicios encapsulan reglas. Sin FKs hacia el tenant-microservice: solo UUIDs lógicos en columnas.

## Architecture Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Ruta física del repo | `develop/backend/sigat-orchestation/workspace-microservice` | Cumple AGENTS.md (código bajo `develop/`) y respeta subruta del doc SIGAT |
| 2 | Auth / tenant | `JwtTenantGuard` global + `@TenantId()` / `@UserId()` | Canon AGENTS.md; el doc SIGAT usa `JwtAuthGuard`/`TenantUserGuard` — se sustituye por el patrón homogéneo del framework |
| 3 | Inyección de `tenant_id` / `user_id` | Solo desde token en servicios | Prohibido confiar en body para tenant (seguridad) |
| 4 | RLS vs app filter | Ambos | Repositorios filtran `tenant_id`; DDL incluye RLS para defensa en profundidad cuando el GUC esté configurado en la sesión |
| 5 | PDF async | `processing_status` + stub / log | Extracción real en change futuro |
| 6 | Trigger `updated_at` | SQL en migración | Coincide con doc; nombres en inglés en DDL del doc se mantienen |

## API Surface

| Method | Path | Handler |
|--------|------|---------|
| POST | `/api/v1/workspaces/activities` | create |
| GET | `/api/v1/workspaces/activities/:id` | findOne |
| PATCH | `/api/v1/workspaces/activities/:id` | update |
| POST | `/api/v1/workspaces/activities/:id/attachments` | addAttachment |
| GET | `/api/v1/workspaces/activities/:id/attachments` | list attachments |
| POST | `/api/v1/workspaces/activities/:id/reviews` | submitReview |
| GET | `/api/v1/workspaces/activities/:id/reviews` | getHistory |

**Nota de routing:** En Nest, rutas más específicas (`:id/attachments`) deben declararse en módulos separados o orden correcto; se usa un único controller con rutas estáticas primero si hiciera falta — aquí `GET :id` vs `GET :id/attachments` se resuelve con segmentos adicionales.

## Data Model

Ver migración `database/migrations/001-workspace-tables.sql` y entidades TypeORM con `SnakeNamingStrategy`.

## Error Handling

- `NotFoundException` si actividad no existe o no pertenece al tenant.
- `BadRequestException` / validación class-validator en body.

## Future: RLS + TypeORM

Para que las políticas apliquen con TypeORM y pool, ejecutar por request algo equivalente a `set_config('app.current_tenant_id', tenantId, true)` en la misma conexión/transacción que las consultas (interceptor transaccional o driver dedicado). Fuera de alcance del bootstrap inicial.

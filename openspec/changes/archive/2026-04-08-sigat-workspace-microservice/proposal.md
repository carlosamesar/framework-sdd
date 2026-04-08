# Proposal: SIGAT — Workspace Microservice

## Intent

Implementar el microservicio de espacio de trabajo operativo descrito en `docs/sigat-workspace.md`: actividades instanciadas desde plantillas maestras (referencias lógicas UUID sin FK al tenant-microservice), adjuntos PDF con estados de procesamiento, y bitácora de revisiones/aprobaciones.

## Scope

### In Scope

- Esquema PostgreSQL (3 tablas) + políticas RLS según documento maestro.
- API NestJS bajo prefijo alineado al doc: `api/v1/workspaces/activities` con CRUD de actividades, anexos y reviews.
- DTOs con `class-validator` equivalentes al doc.
- Multi-tenant y usuario desde JWT siguiendo **AGENTS.md** (`JwtTenantGuard`, `@TenantId()`, `@UserId()`), no `tenant_id` en body.
- Migración SQL versionada en el microservicio.
- Stub documentado para job asíncrono de extracción PDF (encuestas/asistencias).

### Out of Scope

- Integración real con cola/worker (SQS, Bull, etc.) y OCR/IA.
- tenant-microservice ni sincronización de maestros.
- Despliegue Terraform/ECS en este change.

## Approach

- Ubicación física: `develop/backend/sigat-orchestation/workspace-microservice` (convención **Ley IV** de AGENTS.md: código bajo `develop/`; se preserva la jerarquía `backend/sigat-orchestation/` del doc SIGAT).
- Patrón de seguridad y respuestas alineado a microservicios del monoreo documentados en AGENTS.md (guard global JWT + claims Cognito `custom:tenant_id`).
- Consultas siempre filtradas por `tenant_id`; RLS en BD queda habilitada para entornos que fijen `app.current_tenant_id` por sesión (documentado en design).

## Risks

- RLS + pool TypeORM: sin `set_config` por request, el aislamiento efectivo en runtime lo aporta la capa de aplicación; la política RLS actúa cuando la sesión DB establece el GUC.

## Success Criteria

- Endpoints del doc operativos con validación y filtro multi-tenant.
- Migración SQL aplicable (Node runner del proyecto cuando se integre al pipeline).
- Tests mínimos (servicio o controlador) en verde.

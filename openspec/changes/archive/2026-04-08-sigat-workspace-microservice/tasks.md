# Tasks: SIGAT Workspace Microservice

## Checklist

- [x] **T1** — Crear artefactos OpenSpec (proposal, design, spec, tasks)
- [x] **T2** — Scaffold `package.json`, `tsconfig`, `nest-cli`, `src/main.ts`, `AppModule`
- [x] **T3** — `JwtTenantGuard`, decoradores `@TenantId` / `@UserId`, `ValidationPipe` global
- [x] **T4** — Migración SQL: tablas + trigger + RLS
- [x] **T5** — Entidades TypeORM + módulo workspace + servicios + controlador
- [x] **T6** — DTOs (create/update activity, attachment, review)
- [x] **T7** — Tests mínimos (`workspace-activities.service.spec.ts`)
- [x] **T8** — `.env.example` + README del microservicio
- [x] **T9** — `EVIDENCE.md` en el microservicio con trazabilidad spec → pruebas, salidas de comandos y estado honesto vs DoD AGENTS.md
- [x] **T10** — Seeds de prueba con Node (`scripts/seed-dev.cjs`, `database/seeds/README.md`)
- [x] **T11** — Pruebas Jest de integración contra BD real (`test/integration/real-db.sigat.spec.ts`, `npm run test:integration`)

## Acceptance

- Crear actividad con `schema` JSONB y `activity_framework` válido.
- `action_project_id` requerido solo si framework es `Plan anual` (ValidateIf).
- Adjunto `survey_pdf` / `attendance_pdf` crea registro con `processing_status` pending y stub de job documentado.
- Review actualiza `status_id` de la actividad y persiste bitácora.

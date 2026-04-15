# Proposal: Workspace Commitments — Full Lifecycle + AI Validation

## Intent

The `workspace-microservice` has a `CommitmentsService` and DB schema fully implemented but **zero HTTP exposure**. No `CommitmentsController`, no DTOs, and no AI validation endpoint exist. Users cannot create, track, or close commitments via REST, and the existing `CommitmentValidatorAgent` canvas template is never invoked. This change delivers the complete REST surface, AI-driven validation, and cron-based notifications for the Commitments domain.

## Scope

### In Scope
- `CommitmentsController` — full CRUD + `POST .../validate` endpoint
- DTOs: `CreateCommitmentDto`, `UpdateCommitmentStatusDto`, `ValidateCommitmentDto`
- `AgentOrchestratorService.processCommitmentValidation()` — invokes `CommitmentValidatorAgent` template
- Kafka event emission on commitment validated/completed
- Cron job for overdue-commitment notifications (reuse `AlertService` pattern from activities)
- Registration of controller in `WorkspaceModule`
- Unit tests: `CommitmentsController.spec.ts` + additional `CommitmentsService` scenarios

### Out of Scope
- New DB migrations (tables `workspace_commitments` + `workspace_commitment_log` already exist via migration 004)
- Changing `WorkspaceActivitiesService` closure-blocking logic (already implemented)
- Frontend/Angular UI for commitments
- Multi-tenant scope changes or Kafka topic refactoring

## Approach

**Approach 2 — Full Lifecycle: REST + AI + Notifications**

1. **Controller layer**: Add `CommitmentsController` under `WorkspaceModule` with routes nested under `/api/v1/workspaces/activities/:activityId/commitments`. Use `@TenantId()` + `@UserId()` decorators (existing guards).
2. **DTOs**: Create with `class-validator` + `@nestjs/swagger` decorators; mirror patterns from `WorkspaceActivitiesController` DTOs.
3. **AI validation**: Extend `AgentOrchestratorService` with `processCommitmentValidation(commitmentId, tenantId)` — constructs canvas payload using `commitment_validation` template, calls `processCanvas()`, emits Kafka event `workspace.commitment.validated`.
4. **Cron notifications**: Add `@Cron('0 8 * * *')` in a `CommitmentsSchedulerService` that queries overdue commitments and delegates to `AlertService`.
5. **Testing**: TDD — write controller and service specs before wiring up final integration.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `workspace-microservice/src/workspace/commitments/` | New | `CommitmentsController`, `CommitmentsSchedulerService`, DTOs |
| `workspace-microservice/src/workspace/workspace.module.ts` | Modified | Register `CommitmentsController` + `CommitmentsSchedulerService` |
| `workspace-microservice/src/workspace/ai/agent-orchestrator.service.ts` | Modified | Add `processCommitmentValidation()` method |
| `workspace-microservice/src/workspace/ai/canvas-templates.ts` | Verified (no change) | `commitment_validation` template already exists |
| `workspace-microservice/src/workspace/commitments/commitments.service.ts` | Modified | Minor additions to support scheduler queries (overdue filter) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| OpenAI GPT-4o latency on `POST .../validate` | Med | Async processing — return `202 Accepted` + poll/webhook pattern |
| Kafka broker unavailable during tests | Med | Mock `KafkaProducerService` in unit tests |
| Cron fires with missing `AlertService` dependency | Low | Guard with `try/catch` + dead-letter log before throwing |
| Breaking existing `CommitmentsService` callers (activities blocking) | Low | Zero changes to existing service public API; only additive |

## Rollback Plan

1. Remove `CommitmentsController` from `WorkspaceModule` providers.
2. Revert `AgentOrchestratorService` to previous commit (additive-only change, git revert on single method).
3. Disable cron job via env flag `COMMITMENTS_CRON_ENABLED=false` (add guard in scheduler).
4. No DB migration to roll back — schema unchanged.

## Dependencies

- `WorkspaceModule` with `CommitmentsService`, `AgentOrchestratorService`, `AlertService` already registered
- Kafka topic `workspace.commitment.validated` must exist or be auto-created
- `@nestjs/schedule` already installed in the service (`ScheduleModule.forRoot()` in `AppModule`)

## Success Criteria

- [ ] `POST /api/v1/workspaces/activities/:activityId/commitments` creates a commitment and returns `201`
- [ ] `GET /api/v1/workspaces/activities/:activityId/commitments` returns list filtered by tenant
- [ ] `PATCH /api/v1/workspaces/activities/:activityId/commitments/:id/status` updates status
- [ ] `POST /api/v1/workspaces/activities/:activityId/commitments/:id/validate` returns `202` and emits Kafka event
- [ ] Overdue cron fires at 08:00 daily and calls `AlertService` for each expired commitment
- [ ] All controller and service unit tests pass (`npm test`)
- [ ] Closing an activity with open commitments still returns `409 Conflict` (regression guard)

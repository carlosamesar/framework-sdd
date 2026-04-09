# Design: Workspace Commitments — Full Lifecycle + AI Validation

## Technical Approach

Expose the existing `CommitmentsService` via a new `CommitmentsController` nested under `WorkspaceModule`, wired through `IAModule`'s `AgentOrchestratorService` for async AI validation (202 + Kafka) and a new `CommitmentsSchedulerService` for cron-based overdue alerts. All layers mirror the established `WorkspaceActivitiesController` + `AlertService` patterns — no new dependencies introduced.

---

## Architecture Decisions

| Decision | Choice | Alternatives Rejected | Rationale |
|---|---|---|---|
| Controller location | `src/workspace/commitments/commitments.controller.ts` | Flat in `src/workspace/` | Matches complexity — DTOs and scheduler co-located in sub-folder |
| AI validation fire-and-forget | `void processCommitmentValidation()` inside controller after 202 response | Dedicated queue/Bull | `KafkaService.emitAgentDispersal` already plays the queue role; no extra infra |
| Scheduler placement | Separate `CommitmentsSchedulerService` | Inline in `CommitmentsService` | `AlertService` already owns its own cron; scheduler responsibility is isolated |
| DTO validation enum | `IsIn([...Object.values(CommitmentStatus)])` | Custom pipe | Existing DTO pattern in repo uses `IsIn`; no pipes needed |
| AI repo injection | Inject `WorkspaceCommitment` repo into `AgentOrchestratorService` | Pass full entity from controller | Follows existing `activityRepository` pattern; keeps controller thin |

---

## Data Flow

### CRUD Flow

```
HTTP Request
    │
    ▼
CommitmentsController
  @TenantId() / @UserId()  ──→ extracted from JWT by JwtTenantGuard (APP_GUARD)
    │
    ▼
CommitmentsService
  .create(tenantId, userId, activityId, dto)
  .findByActivity(activityId, tenantId)
  .updateStatus(tenantId, userId, id, status)
    │
    ▼
TypeORM (WorkspaceCommitment, WorkspaceCommitmentLog)
    │
    ▼
HTTP Response
```

### AI Validation Flow (async)

```
POST .../commitments/:id/validate
    │
    ├─── CommitmentsService.findOne(id, tenantId)
    │        └── 404 if not found / wrong tenant
    │        └── 422 if status = COMPLETED
    │
    ├─── HTTP 202 → { message: "Validation enqueued" }
    │
    └─── void AgentOrchestratorService.processCommitmentValidation(id, tenantId)
              │
              ├── commitmentRepo.findOne(id, tenantId)
              │
              ├── openaiService.getChatCompletion(
              │     prompt: commitment_validation template,
              │     context: commitment.description
              │   )
              │       success ──→ kafkaService.emitAgentDispersal(
              │                     'workspace.commitment.validated',
              │                     { commitmentId, tenantId, validatedAt, result }
              │                   )
              │       failure ──→ kafkaService.emitAgentDispersal(
              │                     'workspace.commitment.validation_failed',
              │                     { commitmentId, tenantId, reason }
              │                   )
              │       AI error ──→ logger.error(commitmentId, err) — no Kafka emit
              └── (end async)
```

### Cron Notification Flow

```
@Cron('0 8 * * *') CommitmentsSchedulerService.handleOverdue()
    │
    ├── COMMITMENTS_CRON_ENABLED != 'true' ──→ logger.debug("skipping") → return
    │
    ├── CommitmentsService.findOverdue()
    │     WHERE due_date < NOW()
    │       AND status NOT IN ('COMPLETED','CANCELLED')
    │
    └── for each overdue commitment:
          try AlertService.sendOverdueAlert(commitment)
              └── kafkaService.emitAgentDispersal(
                    'commitment.overdue',
                    { commitmentId, tenantId, activityId, due_date, responsible_user_id }
                  )
          catch └── logger.error — continue loop
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/workspace/commitments/dto/create-commitment.dto.ts` | **Create** | `title` (IsString+IsNotEmpty), `description` (IsString), `due_date` (IsDateString+IsNotEmpty), `responsible_user_id` (IsUUID+optional). Maps to `description` / `dateEstimatedCompletion` / `responsibleId` on entity. |
| `src/workspace/commitments/dto/update-commitment-status.dto.ts` | **Create** | `status` (IsIn CommitmentStatus values), optional `notes` (IsString). |
| `src/workspace/commitments/dto/validate-commitment.dto.ts` | **Create** | `evidence` (IsString+IsNotEmpty) — user input passed to canvas template. |
| `src/workspace/commitments/commitments.controller.ts` | **Create** | `@Controller('api/v1/workspaces/activities/:activityId/commitments')`. Routes: POST (create), GET (list), PATCH `:id` (update status), POST `:id/validate` (async AI). Uses `@TenantId()`, `@UserId()`, `ParseUUIDPipe`. |
| `src/workspace/commitments/commitments.controller.spec.ts` | **Create** | Unit tests for all 4 routes: happy path + tenant isolation + validation errors. Mock `CommitmentsService` + `AgentOrchestratorService`. |
| `src/workspace/commitments/commitments-scheduler.service.ts` | **Create** | `@Injectable()` with `@Cron('0 8 * * *')`. Reads `COMMITMENTS_CRON_ENABLED` from `ConfigService`. Calls `CommitmentsService.findOverdue()` → `AlertService.sendOverdueAlert()` per item with per-item try/catch. |
| `src/workspace/commitments/commitments-scheduler.service.spec.ts` | **Create** | Unit tests: cron disabled skip, empty list no-call, per-item error continues. |
| `src/workspace/commitments.service.ts` | **Modify** | Add `findOverdue(): Promise<WorkspaceCommitment[]>` — query `LessThan(new Date())` + `In(['PENDING','IN_PROGRESS','IN_REVIEW'])`. Add `findOne(id, tenantId)` for controller use. |
| `src/workspace/alert.service.ts` | **Modify** | Add `sendOverdueAlert(commitment: WorkspaceCommitment): Promise<void>` — emits Kafka `commitment.overdue` via `KafkaService`. Inject `KafkaService`. |
| `src/ia/services/agent-orchestrator.service.ts` | **Modify** | Add `processCommitmentValidation(commitmentId, tenantId)`. Inject `WorkspaceCommitment` repo (already in `IAModule`'s feature imports after update). Uses `commitment_validation` canvas template → `processCanvas`-style call → `emitAgentDispersal`. |
| `src/ia/ia.module.ts` | **Modify** | Add `TypeOrmModule.forFeature([WorkspaceCommitment])` to support `AgentOrchestratorService` commitment repo. |
| `src/workspace/workspace.module.ts` | **Modify** | Add `CommitmentsController` to `controllers[]`. Add `CommitmentsSchedulerService` to `providers[]`. Import `ScheduleModule` not needed (already in `AppModule` root). |

---

## Interfaces / Contracts

```typescript
// CommitmentsController endpoints
POST   /api/v1/workspaces/activities/:activityId/commitments        → 201 WorkspaceCommitment
GET    /api/v1/workspaces/activities/:activityId/commitments        → 200 WorkspaceCommitment[]
PATCH  /api/v1/workspaces/activities/:activityId/commitments/:id    → 200 WorkspaceCommitment
POST   /api/v1/workspaces/activities/:activityId/commitments/:id/validate → 202 { message: string }

// AgentOrchestratorService — new method
async processCommitmentValidation(commitmentId: string, tenantId: string): Promise<void>

// CommitmentsService — new methods
async findOne(id: string, tenantId: string): Promise<WorkspaceCommitment>  // throws NotFoundException
async findOverdue(): Promise<WorkspaceCommitment[]>

// AlertService — new method
async sendOverdueAlert(commitment: WorkspaceCommitment): Promise<void>

// Kafka topics emitted
'workspace.commitment.validated'       → { commitmentId, tenantId, validatedAt, result }
'workspace.commitment.validation_failed' → { commitmentId, tenantId, reason }
'commitment.overdue'                   → { commitmentId, tenantId, activityId, due_date, responsible_user_id }
```

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Unit — Controller** | POST 201 creates; GET returns list; PATCH 200; POST /validate returns 202 and calls service void; 404 on wrong tenant; 400 on bad payload; 422 on completed | `TestingModule` + mock `CommitmentsService` + mock `AgentOrchestratorService` |
| **Unit — CommitmentsService** | `findOne` throws 404 on miss; `findOverdue` queries correct filter; existing `create`/`updateStatus` unchanged | Mock `Repository<WorkspaceCommitment>` via `getRepositoryToken` |
| **Unit — Scheduler** | Cron skips when env false; empty list skips `sendOverdueAlert`; per-item error continues loop; summary log count correct | Mock `CommitmentsService`, `AlertService`, `ConfigService` |
| **Unit — AgentOrchestrator** | `processCommitmentValidation` emits `validated` on pass; emits `validation_failed` on fail; logs + no-emit on AI error | Mock `commitmentRepo`, `openaiService`, `kafkaService` |
| **Integration — Controller+Service** | POST commit → DB row created with JWT tenant; PATCH status → log entry created | `TestingModule` with real TypeORM + test DB (pg) |
| **E2E** | POST commitment → 201; GET tenant isolation; POST /validate → 202 + Kafka spy; cron scenario via manual `handleOverdue()` call | Supertest + `INestApplication` + mock `KafkaService`; `JwtTenantGuard` overridden with test user |

---

## Migration / Rollout

No migration required. `workspace_commitments` and `workspace_commitment_log` tables exist from migration 004. Rollback: remove `CommitmentsController` from `WorkspaceModule`, set `COMMITMENTS_CRON_ENABLED=false`, revert `AgentOrchestratorService` (single additive method).

---

## Open Questions

- [ ] Should `sendOverdueAlert` in `AlertService` also persist a `PlanningAlert` row (like `createAlert` does today), or emit Kafka only? Decide before implementing to avoid duplicate alert storage.
- [ ] `WorkspaceCommitment.description` maps to DTO `title` + `description` (entity has a single `description` column). Confirm whether entity needs a `title` column or DTO should use `description` only.

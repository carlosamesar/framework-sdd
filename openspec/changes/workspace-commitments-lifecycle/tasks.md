# Tasks: Workspace Commitments — Full Lifecycle + AI Validation

## Phase 1: Foundation (DTOs & Types)

- [ ] 1.1 Create `src/workspace/commitments/dto/create-commitment.dto.ts` — `title` (IsString+IsNotEmpty), `description` (IsString optional), `due_date` (IsDateString+IsNotEmpty), `responsible_user_id` (IsUUID optional). Add `@ApiProperty` decorators.
- [ ] 1.2 Create `src/workspace/commitments/dto/update-commitment-status.dto.ts` — `status` (IsIn CommitmentStatus values+IsNotEmpty), optional `notes` (IsString).
- [ ] 1.3 Create `src/workspace/commitments/dto/validate-commitment.dto.ts` — `evidence` (IsString+IsNotEmpty).
- [ ] 1.4 Add `findOne(id: string, tenantId: string): Promise<WorkspaceCommitment>` to `src/workspace/commitments.service.ts` — throws `NotFoundException` on miss or tenant mismatch.
- [ ] 1.5 Add `findOverdue(): Promise<WorkspaceCommitment[]>` to `src/workspace/commitments.service.ts` — queries `due_date < NOW()` AND `status NOT IN ('COMPLETED','CANCELLED')`.

## Phase 2: Controller & Integration

- [ ] 2.1 Create `src/workspace/commitments/commitments.controller.ts` — `@Controller('api/v1/workspaces/activities/:activityId/commitments')`. Implement `POST` (create → 201), `GET` (list → 200), `PATCH :id` (update status → 200), `POST :id/validate` (fire-and-forget → 202). Use `@TenantId()`, `@UserId()`, `ParseUUIDPipe`, `@ApiBearerAuth()`, `@ApiTags()`.
- [ ] 2.2 Add `sendOverdueAlert(commitment: WorkspaceCommitment): Promise<void>` to `src/workspace/alert.service.ts` — emits `commitment.overdue` Kafka event via `KafkaService`. Inject `KafkaService` if not already present.
- [ ] 2.3 Register `CommitmentsController` in `controllers[]` in `src/workspace/workspace.module.ts`.

## Phase 3: AI Orchestration

- [ ] 3.1 Add `processCommitmentValidation(commitmentId: string, tenantId: string): Promise<void>` to `src/ia/services/agent-orchestrator.service.ts` — load commitment from injected repo, call `commitment_validation` canvas template via `openaiService`, emit `workspace.commitment.validated` on pass or `workspace.commitment.validation_failed` on fail; log + no-emit on AI error.
- [ ] 3.2 Add `TypeOrmModule.forFeature([WorkspaceCommitment])` to `src/ia/ia.module.ts` — enables commitment repo injection in `AgentOrchestratorService`.
- [ ] 3.3 Inject `AgentOrchestratorService` into `CommitmentsController` (update constructor) and call `void this.agentOrchestrator.processCommitmentValidation(id, tenantId)` after 202 response in validate endpoint.

## Phase 4: Notifications (Cron)

- [ ] 4.1 Create `src/workspace/commitments/commitments-scheduler.service.ts` — `@Injectable()` with `@Cron('0 8 * * *') handleOverdue()`. Read `COMMITMENTS_CRON_ENABLED` from `ConfigService`; skip with debug log if not `'true'`. Iterate `CommitmentsService.findOverdue()`, call `AlertService.sendOverdueAlert(c)` per item inside per-item `try/catch`. Log summary count on completion.
- [ ] 4.2 Register `CommitmentsSchedulerService` in `providers[]` in `src/workspace/workspace.module.ts`. (`ScheduleModule` already imported at `AppModule` root — no additional import needed.)

## Phase 5: Verification (TDD)

- [ ] 5.1 Create `src/workspace/commitments/commitments.controller.spec.ts` — unit tests: POST 201 happy path; GET tenant isolation; PATCH 200 + 400 invalid status; POST /validate 202 + void-call to orchestrator; 404 on wrong-tenant commitment; 422 on completed status.
- [ ] 5.2 Add unit tests to `commitments.service.spec.ts` — `findOne` throws 404 on miss; `findOverdue` returns correct filter; existing `create`/`updateStatus` unchanged.
- [ ] 5.3 Create `src/workspace/commitments/commitments-scheduler.service.spec.ts` — cron disabled → no DB call; empty `findOverdue` → `sendOverdueAlert` not called; per-item AlertService error → loop continues; summary log reflects count.
- [ ] 5.4 Add unit tests for `AgentOrchestratorService.processCommitmentValidation` — emits `validated` on passing AI result; emits `validation_failed` on failing result; logs error + no Kafka emit on AI exception.
- [ ] 5.5 Create E2E test `test/commitments.e2e-spec.ts` — override `JwtTenantGuard` with test user; `POST` → 201 + DB row; `GET` → tenant-filtered list; `PATCH` → 200 updated status; `POST /validate` → 202 + `KafkaService` spy called; manually invoke `handleOverdue()` with overdue seed data → `sendOverdueAlert` spy called.

# Tasks: AI Business Agents Integration in Workspace

## Phase 1: Foundation — Specification & Design Verification
- [x] 1.1 Create `openspec/changes/ai-business-agents/proposal.md`
- [x] 1.2 Create `openspec/changes/ai-business-agents/spec.md` with Gherkin scenarios
- [x] 1.3 Create `openspec/changes/ai-business-agents/design.md` with technical architecture

## Phase 2: Implementation — AI Module & Services
- [x] 2.1 Scaffold `src/ia/` module in `workspace-microservice`: `ia.module.ts`, `agent-orchestrator.service.ts`
- [x] 2.2 Implement `AgentOrchestratorService.processCanvas(activityId: string, userInput: string)`
- [x] 2.3 Integrate `OpenAIService` (GPT-4o) for Canvas processing
- [x] 2.4 Implement `KafkaDispersalService` for emitting events to `contabilidad` and `tesoreria`

## Phase 3: Workspace Integration — Controllers & Entities
- [x] 3.1 Update `WorkspaceActivityService.createActivity` to inject Canvas template into `schema` for AI activities
- [x] 3.2 Add `POST /api/workspace/activities/:id/canvas/complete` endpoint in `WorkspaceActivityController`
- [x] 3.3 Implement `WorkspaceActivityService.completeCanvas(activityId: string, dto: CompleteCanvasDto)`

## Phase 4: Verification & Certification
- [x] 4.1 Write integration tests for AI Canvas injection
- [x] 4.2 Write unit tests for `AgentOrchestratorService` LLM interaction
- [x] 4.3 Verify Kafka dispersal against `servicio-contabilidad` mocks
- [x] 4.4 Create `EVIDENCE.md` with functional test results

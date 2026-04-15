# Evidence: Workspace Commitments — Full Lifecycle + AI Validation

**Change**: `workspace-commitments-lifecycle`  
**Status**: ⚠️ **DISCARDED** — Target service does not exist

## Finding

The proposal and all 18 tasks reference `workspace-microservice/` as the target NestJS service. This directory **does not exist** anywhere in the repository. A search across the entire codebase found:

- `develop/backend/sigat-orchestation/sigat-workspace/` — different project (SIGAT), different domain
- `develop/multica-repo/packages/core/workspace` — different project (Multica), different domain
- **No `workspace-microservice/` directory** in the GoodERP monorepo

## Implication

- `CommitmentsController`, `CommitmentsSchedulerService`, DTOs, and all 18 tasks have **nothing to implement against**
- `CommitmentsService`, `WorkspaceCommitment` entity, `AgentOrchestratorService` and `commitment_validation` canvas template referenced in the design also do not exist
- The DB migration `004_workspace_commitments` mentioned in the proposal was never created

## Recommendation

If this feature is still needed in the future, it should be re-scoped as a **new change** with:
1. First create the `workspace-microservice` NestJS project (or reuse an existing service domain)
2. Then implement the commitments REST surface + AI validation as specified
3. This spec should be kept as reference material in the archive

## Action Taken

- Spec archived with this EVIDENCE.md for future reference
- No code changes made (no target service to modify)
- Tasks left unchecked (cannot be executed without the service)

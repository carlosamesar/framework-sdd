# Design: AI Business Agents Integration in Workspace

## Technical Architecture

The AI Business Agents integration follows the standard NestJS architecture of the Workspace microservice, with a new `ia` module.

### Components

#### 1. IA Module (`src/ia/`)
- `ia.module.ts`: Root of the AI integration.
- `agent-orchestrator.service.ts`: Core logic for LLM interaction and Kafka dispersal.
- `canvas-prompt.repository.ts`: New repository for managing pre-configured prompts.

#### 2. Workspace Integration (`src/workspace/`)
- `workspace-activity.service.ts`: Update to inject prompts into `schema` upon activity creation.
- `workspace-activity.controller.ts`: New endpoint `POST /api/workspace/activities/:id/canvas/complete`.

### LLM Interface (OpenAI GPT-4o)
- Use `OpenAIService` to interact with OpenAI API using the project's `OPENAI_API_KEY`.
- Model: `gpt-4o` for high-performance business reasoning.
- The service MUST use the `prompt_template` from `WorkspaceActivity.schema` as the foundation for the AI interaction.
- (Note: Shifted from Bedrock to OpenAI based on available infrastructure and performance requirements).

### Kafka Dispersal (SAGA Architecture)
- The `AgentOrchestratorService` MUST use the project's existing Kafka producers to emit events to other microservices (`contabilidad`, `tesoreria`).
- Each dispersal MUST include:
  - `tenantId` (extracted from the JWT).
  - `userId` (extracted from the JWT).
  - `activityId` for traceability.
  - `dispersalId` (new UUID for tracking).
  - `processedData` in the format expected by the target service.

---

## Technical Details

### Canvas Structure (JSONB in WorkspaceActivity.schema)
```typescript
interface CanvasSchema {
  canvas: {
    type: "guided_prompt";
    prompt_template: string;
    user_input: string | null;
    status: "pending" | "completed" | "dispersed";
    processed_result?: any;
  };
  agent_meta: {
    target_agent: string;
    dispersal_event: string;
    target_topic: string;
  };
}
```

### Flow Diagram (Simplified)
User -> Request Activity (GET) -> System Injects Canvas in Schema -> Activity (POST) -> User Input -> AgentOrchestrator (AI) -> Kafka (Dispersal) -> Target Service.

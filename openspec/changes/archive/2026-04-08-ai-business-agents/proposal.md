# Proposal: AI Business Agents Integration in Workspace

## Intent
Transform standard business forms in the Workspace module into **AI-driven canvases**. Instead of manually filling out rigid fields, users will interact with pre-configured prompts (canvases) that guide them through complex business processes. AI agents will then autonomously "disperse" the captured data across the system via the SAGA (Kafka) infrastructure.

## Scope
- **Domain**: `sigat-orchestation / workspace-microservice`
- **Feature**: AI-powered activity automation.
- **Components**:
  - `AgentOrchestratorService`: New service to handle LLM interactions.
  - `WorkspaceActivity`: Update handling of the `schema` field to support canvas-prompt structures.
  - `Kafka Integration`: Use existing SAGA infrastructure for data dispersal.

## Technical Approach
1. **Canvas Structure**: Define a JSON schema for `WorkspaceActivity.schema` that includes:
   - `prompt`: The guided instruction for the user.
   - `context`: Relevant business data injected into the prompt.
   - `agent_config`: Metadata defining which agent handles the dispersal.
   - `result`: Structured output from the AI after user completion.
2. **AI Module**: Scaffold `src/ia` within `workspace-microservice` following NestJS patterns.
3. **Dispersal Logic**: Implement Kafka producers in `AgentOrchestratorService` to trigger events based on AI results.

## Impact
- **User Experience**: Drastic reduction in manual data entry.
- **Data Quality**: Consistent, AI-validated business data.
- **Architecture**: Leverages existing SAGA/Multi-tenant patterns.

## SDD Phases
1. **Specify**: Define Gherkin scenarios for "Canvas Completion" and "Data Dispersal".
2. **Design**: Detail the `AgentOrchestratorService` architecture and Kafka event payloads.
3. **Implement**: TDD-based development of the AI module and integration with Workspace activities.

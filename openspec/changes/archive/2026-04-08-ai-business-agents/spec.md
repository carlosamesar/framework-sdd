# AI Business Agents — Specification

**Change**: `ai-business-agents`
**Domain**: Workspace Microservice
**Type**: New Feature / Evolution

---

## REQUIREMENT: Guided AI Canvas

The system MUST replace traditional forms with "Guided Canvases" for specific Workspace activities. 
A Canvas is a structured prompt stored in the `schema` field of `WorkspaceActivity`.

### Scenario: Initialize Guided Canvas
**Given** a user initiates a "Planning" activity in the Workspace
**When** the activity requires an "Agent Deep Action"
**Then** the `schema` field MUST be populated with the following Canvas structure:
```json
{
  "canvas": {
    "type": "guided_prompt",
    "prompt_template": "Plan the budget for the next quarter considering {context_data}",
    "user_input": null,
    "status": "pending_completion"
  },
  "agent_meta": {
    "target_agent": "BudgetOrchestrator",
    "dispersal_event": "workspace.activity.completed"
  }
}
```

### Scenario: AI Dispersal after Canvas Completion
**Given** a Workspace activity has a completed AI Canvas (`status: "completed"`)
**When** the user submits the activity
**Then** the `AgentOrchestratorService` MUST:
1. Process the `user_input` using the LLM (Bedrock).
2. Generate a structured business result.
3. Emit a Kafka event (SAGA) to the target module (e.g., Contabilidad) with the processed data.

---

## API CONTRACTS

### POST `/api/workspace/activities/:id/canvas/complete`
**Input**:
```json
{
  "user_input": "Increase marketing budget by 15% due to new product launch."
}
```
**Output**:
```json
{
  "status": "success",
  "message": "AI Agent has processed the canvas and triggered dispersal.",
  "data": {
    "dispersal_id": "uuid-v4",
    "processed_result": { "adjustment": 0.15, "reason": "marketing_launch" }
  }
}
```

## DATA DISPERSAL MAPPING (Kafka Topics)
| Action Type | Kafka Topic | Target Service |
|-------------|-------------|----------------|
| Budget Adjust | `contabilidad.asiento.generar` | `servicio-contabilidad` |
| Asset Allocation | `tesoreria.caja.operacion` | `servicio-tesoreria` |

# ia/commitments Specification

## Purpose

Async AI validation flow for commitments. The system invokes the `CommitmentValidatorAgent` canvas template, evaluates the result, and emits a Kafka event. The endpoint returns 202 immediately; processing is asynchronous.

---

## Requirements

### Requirement: Trigger AI Validation

The system MUST expose a `POST .../validate` endpoint that accepts a commitment and enqueues async AI validation. The HTTP response MUST be 202 Accepted — it MUST NOT block on AI processing.

#### Scenario: Validation triggered successfully

- GIVEN a valid JWT and an existing commitment in `pending` or `in_progress` status
- WHEN `POST /api/v1/workspaces/activities/:activityId/commitments/:id/validate`
- THEN the system responds 202 with `{ "message": "Validation enqueued" }`
- AND `AgentOrchestratorService.processCommitmentValidation()` is called asynchronously

#### Scenario: Validate commitment belonging to another tenant

- GIVEN a valid JWT
- WHEN `POST .../validate` targeting a `commitmentId` from a different tenant
- THEN the system responds 404
- AND no AI processing is triggered

#### Scenario: Validate already-completed commitment

- GIVEN a commitment with `status = completed`
- WHEN `POST .../validate`
- THEN the system responds 422 with `{ "error": "Commitment already completed — validation not applicable" }`

---

### Requirement: Handle AI Validation Result

The system MUST emit a Kafka event after AI processing completes, encoding the validation outcome.

`processCommitmentValidation()` MUST call the `commitment_validation` canvas template and emit one of the following Kafka events: `commitment.validated` (pass) or `commitment.validation_failed` (fail).

#### Scenario: AI returns a passing result

- GIVEN a commitment queued for validation
- WHEN the `CommitmentValidatorAgent` template returns a passing assessment
- THEN the system emits a `commitment.validated` Kafka event
- AND the event payload includes `commitmentId`, `tenantId`, `validatedAt`, and `result`

#### Scenario: AI returns a failing result

- GIVEN a commitment queued for validation
- WHEN the `CommitmentValidatorAgent` template returns a failing assessment
- THEN the system emits a `commitment.validation_failed` Kafka event
- AND the event payload includes `commitmentId`, `tenantId`, `reason`

#### Scenario: AI service is unavailable

- GIVEN a commitment queued for validation
- WHEN the AI service call throws a timeout or connection error
- THEN no Kafka event is emitted
- AND the error is logged with `commitmentId` and error message
- AND the commitment `status` is NOT changed

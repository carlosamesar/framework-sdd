# notifications/commitments Specification

## Purpose

Cron-driven overdue commitment detection and alert emission. Runs daily at 08:00 server time, identifies commitments past their `due_date` that are not `completed` or `cancelled`, and emits an alert via `AlertService`.

---

## Requirements

### Requirement: Identify Overdue Commitments

The system MUST query all commitments where `due_date < NOW()` AND `status NOT IN ('completed', 'cancelled')`.

The query MUST be tenant-agnostic at the scheduler level — it covers all tenants in one pass.

#### Scenario: Overdue commitments found

- GIVEN one or more commitments where `due_date < NOW()` and `status = 'pending'` or `in_progress`
- WHEN the cron job fires at 08:00
- THEN `CommitmentsService.findOverdue()` returns the matching commitments
- AND each commitment is passed to `AlertService.sendOverdueAlert()`

#### Scenario: No overdue commitments

- GIVEN no commitments with `due_date < NOW()` in non-terminal status
- WHEN the cron job fires
- THEN `CommitmentsService.findOverdue()` returns an empty array
- AND `AlertService.sendOverdueAlert()` is NOT called

---

### Requirement: Emit Kafka Overdue Alert

The system MUST emit a Kafka alert for each overdue commitment via `AlertService`. Each alert MUST include `commitmentId`, `tenantId`, `activityId`, `due_date`, and `responsible_user_id`.

#### Scenario: Alert emitted successfully

- GIVEN an overdue commitment
- WHEN the scheduler calls `AlertService.sendOverdueAlert(commitment)`
- THEN a Kafka event `commitment.overdue` is published
- AND the event payload includes `commitmentId`, `tenantId`, `activityId`, `due_date`, `responsible_user_id`

#### Scenario: AlertService throws during emission

- GIVEN an overdue commitment
- WHEN `AlertService.sendOverdueAlert()` throws an error
- THEN the error is caught and logged
- AND processing continues for remaining overdue commitments (no full-batch abort)

---

### Requirement: Cron Schedule and Guard

The scheduler MUST run at `0 8 * * *`. It MUST be enabled only when the env flag `COMMITMENTS_CRON_ENABLED=true`. When disabled, the cron MUST register but skip execution with a debug log.

#### Scenario: Cron disabled via env flag

- GIVEN `COMMITMENTS_CRON_ENABLED=false`
- WHEN the cron fires at 08:00
- THEN no DB query is executed
- AND a debug log `"Commitments cron disabled — skipping"` is emitted

#### Scenario: Cron enabled — fires and completes

- GIVEN `COMMITMENTS_CRON_ENABLED=true`
- WHEN the cron fires at 08:00
- THEN `findOverdue()` is called
- AND all returned commitments are processed
- AND a summary log is emitted with the count of alerts sent

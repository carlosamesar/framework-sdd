# workspace/commitments Specification

## Purpose

REST API for creating, listing, and updating commitments nested under a workspace activity. All operations are tenant-scoped via JWT claims.

---

## Requirements

### Requirement: Create Commitment

The system MUST allow authenticated users to create a commitment under an existing activity that belongs to their tenant.

`tenant_id` and `created_by` MUST be sourced from the JWT (`custom:tenant_id`, `sub`), never from the request body.

#### Scenario: Successful creation

- GIVEN a valid JWT with `custom:tenant_id` and `sub`
- AND an existing activity with matching `tenant_id`
- WHEN `POST /api/v1/workspaces/activities/:activityId/commitments` with a valid body
- THEN the system responds 201 with the created commitment
- AND `tenant_id` and `created_by` match the JWT claims

#### Scenario: Activity not found or belongs to another tenant

- GIVEN a valid JWT
- WHEN `POST` with an `activityId` not belonging to the JWT tenant
- THEN the system responds 404

#### Scenario: Invalid payload — missing required fields

- GIVEN a valid JWT and valid activity
- WHEN `POST` with a body missing `title` or `due_date`
- THEN the system responds 400 with field-level validation errors

---

### Requirement: List Commitments

The system MUST return only commitments belonging to the authenticated user's tenant for the given activity.

#### Scenario: List commitments — tenant isolation

- GIVEN a valid JWT with `custom:tenant_id`
- AND an activity with commitments from multiple tenants in DB
- WHEN `GET /api/v1/workspaces/activities/:activityId/commitments`
- THEN the system responds 200 with only commitments where `tenant_id` matches the JWT
- AND commitments from other tenants are NOT included

#### Scenario: Empty list

- GIVEN a valid JWT and an activity with no commitments
- WHEN `GET /api/v1/workspaces/activities/:activityId/commitments`
- THEN the system responds 200 with an empty array

---

### Requirement: Update Commitment Status

The system MUST allow updating the `status` of an existing commitment to `in_progress`, `completed`, or `cancelled`.

#### Scenario: Successful status update

- GIVEN a valid JWT and an existing commitment belonging to that tenant
- WHEN `PATCH /api/v1/workspaces/activities/:activityId/commitments/:id` with `{ "status": "completed" }`
- THEN the system responds 200 with the updated commitment

#### Scenario: Invalid status value

- GIVEN a valid JWT and a valid commitment
- WHEN `PATCH` with `{ "status": "invalid_value" }`
- THEN the system responds 400 with a validation error

#### Scenario: Commitment belongs to another tenant

- GIVEN a valid JWT
- WHEN `PATCH` targeting a `commitmentId` owned by a different tenant
- THEN the system responds 404

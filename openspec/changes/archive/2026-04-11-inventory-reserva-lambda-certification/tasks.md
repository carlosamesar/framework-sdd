# Tasks: fnReservaInventario Lambda Certification

## Phase 1: Verification

- [x] 1.1 Run unit tests (`node --test tests/*.test.mjs`) — 33 tests, all passing
- [x] 1.2 Review CONSUMO.md certification report — 13 integration tests documented
- [x] 1.3 Verify multi-tenant security: extractTenantId P1→P4 chain, no header bypass
- [x] 1.4 Verify routing security: exact lastSegment matching, no substring vulnerability
- [x] 1.5 Verify stock validation: real-time check before reservation creation
- [x] 1.6 Verify confirm/cancel workflows: state transitions correct

## Phase 2: Documentation

- [x] 2.1 Review existing CONSUMO.md — complete certification report with payloads and responses
- [x] 2.2 Create proposal.md — intent, scope, risks, success criteria
- [x] 2.3 Create design.md — architecture, decisions, data flow, security considerations
- [x] 2.4 Create tasks.md — this file with all certification tasks
- [x] 2.5 Create spec.md — Gherkin scenarios for all endpoints
- [x] 2.6 Create EVIDENCE.md — test results, coverage, certification evidence

## Phase 3: Archive

- [x] 3.1 Create archive directory: `openspec/changes/archive/2026-04-11-inventory-reserva-lambda-certification/`
- [x] 3.2 Move all SPEC files to archive
- [x] 3.3 Update registry.md — add entry 5.1
- [x] 3.4 Update project.md — mark Módulo 5 as "Lambda certificada"
- [x] 3.5 Final review — all tasks marked [x], all files present

## Phase 4: Certification Evidence

- [x] 4.1 Unit tests: 33/33 passing (routing + sanitization)
- [x] 4.2 Integration tests: 13/13 passing (direct Lambda invocation)
- [x] 4.3 Security audit: multi-tenant verified, no header bypass
- [x] 4.4 Routing audit: exact matching, no substring vulnerability
- [x] 4.5 Functional audit: all 10 endpoints working correctly
- [x] 4.6 Error handling: PostgreSQL error mapping verified

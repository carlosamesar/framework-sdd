# Tasks: fnLiberarReservasExpiradas Lambda Certification

## Phase 1: Bug Discovery (TDD)

- [x] 1.1 Write database tests for `liberarReservasExpiradas()` — discovered `t.estado` column doesn't exist
- [x] 1.2 Fix `liberarReservasExpiradas()` query: `t.estado` → `id_estado` FK subquery
- [x] 1.3 Fix `getEstadisticasReservas()` query: `t.estado` → `te.nombre` via JOIN
- [x] 1.4 Update test fixtures: `estado` text → `id_estado` FK in test data

## Phase 2: Handler Tests (Mocked)

- [x] 2.1 Test EventBridge scheduled event processing
- [x] 2.2 Test no expired reservations scenario
- [x] 2.3 Test multiple reservations expired (multi-tenant)
- [x] 2.4 Test DB connection failure → 500 response
- [x] 2.5 Test statistics query failure → 500 response
- [x] 2.6 Test unexpected error → 500 response
- [x] 2.7 Test success response shape
- [x] 2.8 Test error response shape
- [x] 2.9 Fix `duracion_ms` assertion (0 is valid for mocked tests)

## Phase 3: Database Integration Tests

- [x] 3.1 Write tests for expired reservation updates (REQ-DB-01)
- [x] 3.2 Write tests for non-expired reservations (not affected)
- [x] 3.3 Write tests for already-expired reservations (idempotent)
- [x] 3.4 Write tests for COMPLETADO/CANCELADO states (not affected)
- [x] 3.5 Write multi-tenant test (REQ-DB-02)
- [x] 3.6 Write empty result test (REQ-DB-03)
- [x] 3.7 Write statistics test (REQ-DB-04)
- [x] 3.8 Write transaction handling test (REQ-DB-05)
- [x] 3.9 Write return shape test (REQ-DB-06)
- [x] 3.10 Fix all tests for correct `id_estado` FK usage

## Phase 4: Sanitization Tests

- [x] 4.1 Verify 14 existing sanitization tests passing
- [x] 4.2 Confirm P1→P4 priority chain
- [x] 4.3 Confirm no header bypass

## Phase 5: Documentation

- [x] 5.1 Create `CONSUMO.md` — complete certification report
- [x] 5.2 Document bugs found and fixed
- [x] 5.3 Document all test results
- [x] 5.4 Update `package.json` with test script
- [x] 5.5 Create proposal.md
- [x] 5.6 Create design.md
- [x] 5.7 Create tasks.md (this file)
- [x] 5.8 Create spec.md
- [x] 5.9 Create EVIDENCE.md

## Phase 6: Archive

- [x] 6.1 Create archive directory
- [x] 6.2 Move all SPEC files to archive
- [x] 6.3 Update registry.md — add entry 5.2
- [x] 6.4 Update project.md — mark Módulo 5.2 as DONE
- [x] 6.5 Final review — all tasks marked [x]

## Test Summary

| Category | Tests | Status |
|----------|-------|--------|
| Sanitization | 14 | ✅ PASS |
| Handler (mocked) | 9 | ✅ PASS |
| Database (integration) | 10 | ⏳ Written, requires live DB |
| **Total** | **33** | **23/23 mocked + 10 pending live DB** |

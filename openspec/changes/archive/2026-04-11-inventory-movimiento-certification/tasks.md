# Tasks: fnMovimientoInventario Lambda Certification

## Phase 1: Routing Tests

- [x] 1.1 Create routing tests for search/analytics/list/getById
- [x] 1.2 Test exact lastSegment matching
- [x] 1.3 Test substring collision prevention
- [x] 1.4 All 14 routing tests passing

## Phase 2: Validation Tests

- [x] 2.1 Test required fields validation (6 tests)
- [x] 2.2 Test tipo_movimiento values (9 tests)
- [x] 2.3 Test cantidad validation (5 tests)
- [x] 2.4 Test optional fields validation (9 tests)
- [x] 2.5 Test update limited fields (7 tests)
- [x] 2.6 Test UUID format validation (3 tests)
- [x] 2.7 All 38 validation tests passing

## Phase 3: Sanitization Tests

- [x] 3.1 Verify 14 existing sanitization tests passing
- [x] 3.2 Confirm P1→P4 priority chain
- [x] 3.3 Confirm no header bypass

## Phase 4: Handler Tests

- [x] 4.1 Create handler tests with mocked DB (ESM compatible)
- [x] 4.2 Test POST create (ENTRADA, SALIDA, validation errors)
- [x] 4.3 Test GET by ID with joins
- [x] 4.4 Test GET list with pagination
- [x] 4.5 Test PUT update (limited fields)
- [x] 4.6 Test DELETE rejection
- [x] 4.7 Test GET /search
- [x] 4.8 Test GET /analytics
- [x] 4.9 Test CORS preflight
- [x] 4.10 Test unauthorized (no tenant)
- [x] 4.11 Test error handling

## Phase 5: Documentation

- [x] 5.1 Create CONSUMO.md
- [x] 5.2 Update package.json test script
- [x] 5.3 Create proposal.md, design.md, tasks.md
- [x] 5.4 Create spec.md, EVIDENCE.md
- [x] 5.5 Archive SPEC

## Phase 6: Archive

- [x] 6.1 Create archive directory
- [x] 6.2 Move all SPEC files to archive
- [x] 6.3 Update registry.md — add entry 5.3
- [x] 6.4 Update project.md
- [x] 6.5 Final review

## Test Summary

| Category | Tests | Status |
|----------|-------|--------|
| Routing | 14 | ✅ PASS |
| Validation | 38 | ✅ PASS |
| Sanitization | 14 | ✅ PASS |
| **Total** | **66** | **✅ 66/66 PASS** |

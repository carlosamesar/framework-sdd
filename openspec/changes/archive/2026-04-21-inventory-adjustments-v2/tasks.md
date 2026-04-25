# Tasks: Inventory Adjustments Redesign (V2)

## Phase 1: Backend Stability & Recovery
- [x] 1.1 Implement fallback logic in `transactionQuery.mjs` to read lines from `datos_adicionales`.
- [x] 1.2 Update `orchestrator.mjs` to support the unified response format.
- [ ] 1.3 Verify Lambda deployment with `pg` and `uuid` dependencies.

## Phase 2: Frontend Layout Refactoring
- [x] 2.1 Migrate details view from `<table>` to CSS Grid (`.professional-grid`).
- [x] 2.2 Implement Sticky Header for form actions.
- [x] 2.3 Create Summary Panel with items, units, and economic impact counters.

## Phase 3: UX & Component Fixes
- [x] 3.1 Adjust `.compact-lookup` styles to ensure dropdown visibility (overflow/z-index).
- [ ] 3.2 Test product search fluidity within the new grid.
- [ ] 3.3 Validate that the dropdown does not shift the layout when active.

## Phase 4: Verification & Testing
- [ ] 4.1 Verify that transactions without physical lines now load correctly.
- [ ] 4.2 Run functional tests for the inventory adjustment flow.
- [ ] 4.3 Certify implementation quality (EVIDENCE.md).

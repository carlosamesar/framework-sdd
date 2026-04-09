# Tasks: fnAjusteInventario — Functional Test Suite

## Phase 1: Foundation

- [ ] 1.1 Add Jest + `--experimental-vm-modules` to `package.json` (`jest`, `@jest/globals`); add script `"test:functional": "node --experimental-vm-modules node_modules/.bin/jest tests/functional.test.mjs"`
- [ ] 1.2 Add Jest config block to `package.json`: `transform: {}`, `testEnvironment: node`, `extensionsToTreatAsEsm: ['.mjs']`
- [ ] 1.3 Create `tests/functional.test.mjs` with: JWT constant, `buildEvent(overrides)` mock-event factory, `createdId` shared variable, and empty `describe('fnAjusteInventario functional')` shell

## Phase 2: Core Execution — Scenarios

- [ ] 2.1 Implement **SC-01** (POST happy path): build POST event with all required fields + `observacion: '[TEST] ajuste funcional'`; assert status 201, `body.success === true`, `body.data.id_transaccion` is UUID; store `createdId`
- [ ] 2.2 Implement **SC-01b** (POST missing observacion): build POST event without `observacion`; assert status 400, `body.success === false`, `body.errors` is array
- [ ] 2.3 Implement **SC-02** (GET by valid ID): use `createdId` from SC-01; build GET event with `pathParameters.id`; assert status 200, `body.data.id` equals `createdId`
- [ ] 2.4 Implement **SC-07** (GET non-existent ID → 404): build GET event with random UUID; assert status 404, `body.success === false`
- [ ] 2.5 Implement **SC-03** (GET list): build GET event with no `pathParameters`; assert status 200, `body.data` is array
- [ ] 2.6 Implement **SC-06** (OPTIONS CORS — no JWT): build OPTIONS event without auth claims; assert status 200, `headers['Access-Control-Allow-Origin'] === '*'`, `headers['Access-Control-Allow-Methods']` contains `'GET'` and `'POST'`
- [ ] 2.7 Implement **SC-04** (PUT → 501): build PUT event; assert status 501, `body.error.code === 'NOT_IMPLEMENTED'`
- [ ] 2.8 Implement **SC-05** (DELETE → 501): build DELETE event; assert status 501, `body.error.code === 'NOT_IMPLEMENTED'`
- [ ] 2.9 Implement **SC-08** (PATCH → 405): build PATCH event; assert status 405, `body.error.code === 'METHOD_NOT_ALLOWED'`
- [ ] 2.10 Implement **SC-09** (no JWT → 401): build GET event without `requestContext.authorizer`; assert status 401, `body.success === false`

## Phase 3: Evidence Generation

- [ ] 3.1 Add `results[]` array collector: each test pushes `{ scenario, method, status, success, id, errorCode, elapsed }` after assertion
- [ ] 3.2 Implement `afterAll` writer: build Markdown table with columns `Scenario | Method/Path | Status | body.success | id / error.code | Elapsed (ms)`; prepend `## Run: {ISO timestamp}` header; append to `CONSUMO.md` (create if absent)
- [ ] 3.3 Implement **SC-10** assertion inside `afterAll`: after writing file, assert `CONSUMO.md` exists and contains at least 9 data rows

## Phase 4: Full Run

- [ ] 4.1 Run `npm run test:functional` from the lambda directory; capture stdout/stderr
- [ ] 4.2 Verify all 10 scenarios pass (SC-01 through SC-10); fix any failing assertions
- [ ] 4.3 Open `CONSUMO.md` and verify the table is well-formed with one row per scenario
- [ ] 4.4 Commit `tasks.md`, `tests/functional.test.mjs`, `CONSUMO.md`, and updated `package.json`

# Tasks: Validate Execution of All gd:* Commands

## Phase 1: Foundation

- [x] 1.1 Audit `scripts/validate-spec.mjs` to extract reusable regex patterns (heading, trigger, steps) for schema validation
- [x] 1.2 Create `scripts/validate-gd-commands.mjs` — skeleton: imports, constants, empty phase stubs, `main()` entry point
- [x] 1.3 Implement `inventoryCommands()`: read `.claude/commands/gd/*.md`, cross-reference with `COMMANDS-INDEX.md`, return `CommandList[]`

## Phase 2: Core Implementation

- [x] 2.1 Implement `validateSchema(command)`: check required heading/description, `trigger` keyword, and `steps`/numbered-list body using regex from Phase 1.1
- [x] 2.2 Implement `runSmoke(command)`: attempt CLI invocation if OpenCode binary present; always return `{ smoke: "skipped" }` if CLI absent (no hard dependency)
- [x] 2.3 Implement `buildReport(results)`: assemble `reports/gd-commands-report.json` with `generated`, `summary`, and `commands[]` shape per design contract
- [x] 2.4 Wire `main()`: call inventory → schema → smoke → buildReport → write JSON to `reports/gd-commands-report.json`; exit 0 on success, exit 1 on any `fail`

## Phase 3: CI Shell Wrapper

- [x] 3.1 Create `scripts/validate-gd-commands.sh`: invoke `node scripts/validate-gd-commands.mjs`, read `reports/gd-commands-report.json`, exit 1 if `summary.fail > 0`
- [x] 3.2 Make wrapper executable: `chmod +x scripts/validate-gd-commands.sh`; verify `reports/` directory exists (`.gitkeep` present)

## Phase 4: Testing (TDD — RED → GREEN → REFACTOR)

- [x] 4.1 RED — Write `scripts/validate-gd-commands.test.mjs`: failing tests for `inventoryCommands()` (cross-reference logic, missing/extra files)
- [x] 4.2 GREEN — Make inventory tests pass; refactor
- [x] 4.3 RED — Write failing tests for `validateSchema()` covering: valid command, missing trigger, missing steps body
- [x] 4.4 GREEN — Make schema tests pass; refactor
- [x] 4.5 RED — Write failing test for `buildReport()`: assert JSON shape matches design contract (`generated`, `summary`, `commands[]`)
- [x] 4.6 GREEN — Make report builder test pass; refactor
- [x] 4.7 Integration — Run `node scripts/validate-gd-commands.mjs` against real `.claude/commands/gd/`; assert `reports/gd-commands-report.json` is valid JSON with expected shape

## Phase 5: Cleanup

- [x] 5.1 Resolve open questions in `design.md`: document decision on smoke stub vs defer, and gitignore policy for `reports/gd-commands-report.json`
- [x] 5.2 Add `gd-commands-report.json` to `.gitignore` (if decided as build artifact) or remove the entry if it should be committed
- [x] 5.3 Update `COMMANDS-INDEX.md` if any commands are found missing during Phase 4.7 integration run


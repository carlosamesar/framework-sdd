# Proposal: Validate Execution of All gd:* Commands in OpenCode

## Intent

The `gd:*` command suite drives the entire SDD pipeline in OpenCode. There is currently no systematic validation that all commands actually execute correctly end-to-end. Broken commands go undetected until a developer hits them mid-workflow, causing pipeline stalls. This change adds a validation harness that verifies every `gd:*` command is executable, well-formed, and returns coherent output in OpenCode.

## Scope

### In Scope
- Inventory all `gd:*` commands from `.claude/commands/gd/` and `COMMANDS-INDEX.md`
- Define a validation contract per command (expected inputs, expected output shape)
- Implement a validation runner that exercises each command in a controlled test context
- Produce a machine-readable validation report (`gd-commands-report.json`)
- Add a CI-friendly script (`validate-gd-commands.sh`) that fails on any broken command

### Out of Scope
- Full E2E integration against live AWS/Cognito resources
- Refactoring or fixing command logic discovered during validation
- Validation of non-`gd:*` commands (e.g. `mem_*`, custom agent flows)

## Approach

Static + dry-run validation in two layers:
1. **Schema layer**: parse each `.md` command file, verify required frontmatter fields and sections (trigger, description, steps).
2. **Smoke layer**: invoke each command via OpenCode's CLI in `--dry-run` mode (or equivalent) with minimal stub inputs; assert exit code 0 and presence of required output markers.

A Node.js 20 ESM runner script coordinates both layers and writes the report.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.claude/commands/gd/` | Read | All `gd:*.md` files are the validation targets |
| `COMMANDS-INDEX.md` | Read | Ground truth for expected command list |
| `scripts/validate-gd-commands.mjs` | New | Validation runner (Node.js 20 ESM) |
| `scripts/validate-gd-commands.sh` | New | CI wrapper — exits 1 on any failure |
| `reports/gd-commands-report.json` | New | Machine-readable output |
| `openspec/changes/validate-gd-commands/` | New | SDD change artifacts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Commands have no dry-run mode | Med | Fall back to schema-only validation for those commands; flag in report |
| OpenCode CLI not available in CI | Low | Runner detects missing CLI and downgrades to schema-only gracefully |
| Command count mismatch between index and filesystem | Med | Runner cross-checks both sources and reports orphans/missing entries |

## Rollback Plan

All new files are additive (`scripts/`, `reports/`). No existing command files are modified. Rollback = delete the three new files. No migration or state change required.

## Dependencies

- Node.js 20 ESM available in the execution environment
- `.claude/commands/gd/` directory populated with current command `.md` files
- `COMMANDS-INDEX.md` up to date

## Success Criteria

- [ ] `validate-gd-commands.sh` exits 0 when all commands pass schema validation
- [ ] `gd-commands-report.json` lists every command with status `pass | warn | fail`
- [ ] Zero commands with status `fail` for schema-layer checks in the baseline run
- [ ] Script is runnable in CI without AWS credentials
- [ ] Validation covers 100% of commands listed in `COMMANDS-INDEX.md`

## Complexity

**1 — Micro** (new tooling, no production code change, no migration)

---
id: T.VGC.1
module: tooling
change: validate-gd-commands
title: Validate Execution of All gd:* Commands
status: DONE
implements: openspec/changes/validate-gd-commands/proposal.md
---

# Tooling — gd:* Command Validation

## Purpose

Ensure every `gd:*` command is well-formed and executable via a two-layer static + smoke validation harness runnable in CI without live AWS resources.

---

## Requirements

### Requirement: Command Inventory

The runner MUST inventory all `gd:*` commands by cross-referencing `.claude/commands/gd/*.md` filesystem files against `COMMANDS-INDEX.md`.

#### Scenario: All commands match index

- GIVEN `COMMANDS-INDEX.md` lists N commands and `.claude/commands/gd/` contains N matching `.md` files
- WHEN the runner performs inventory
- THEN the report lists N commands with no orphan or missing entries

#### Scenario: Orphan file detected

- GIVEN a `.md` file exists in `.claude/commands/gd/` that is absent from `COMMANDS-INDEX.md`
- WHEN the runner performs inventory
- THEN the report records the command with status `warn` and reason `orphan_not_in_index`

#### Scenario: Missing file detected

- GIVEN `COMMANDS-INDEX.md` references a command whose `.md` file is absent
- WHEN the runner performs inventory
- THEN the report records the command with status `fail` and reason `file_not_found`

---

### Requirement: Schema Validation

The runner MUST parse each command `.md` file and verify required frontmatter fields and sections.

Required fields: `description` (or title-level heading), `trigger`, and a `steps` or numbered list body.

#### Scenario: Well-formed command passes schema

- GIVEN a command `.md` file has all required fields and sections
- WHEN schema validation runs
- THEN the command entry in the report has `schema: pass`

#### Scenario: Missing required field fails schema

- GIVEN a command `.md` file is missing the `trigger` field
- WHEN schema validation runs
- THEN the command entry has `schema: fail` and `errors` lists `missing_field: trigger`

---

### Requirement: Smoke Validation

The runner SHOULD invoke each command via OpenCode CLI in dry-run mode with minimal stub inputs and assert exit code 0 and presence of required output markers.

If the CLI is unavailable, the runner MUST downgrade to schema-only and flag commands as `smoke: skipped` with reason `cli_unavailable`.

If a command has no dry-run mode, the runner MUST flag it as `smoke: skipped` with reason `no_dry_run_mode` and continue.

#### Scenario: Smoke passes for a runnable command

- GIVEN the CLI is available and the command supports dry-run
- WHEN the runner invokes the command with stub inputs
- THEN exit code is 0 AND required output markers are present
- AND the report entry has `smoke: pass`

#### Scenario: Smoke skipped — CLI unavailable

- GIVEN the OpenCode CLI is not found in PATH
- WHEN the runner starts
- THEN all command entries have `smoke: skipped` with `reason: cli_unavailable`
- AND the runner exits 0 (schema-only mode)

#### Scenario: Smoke skipped — no dry-run support

- GIVEN the CLI is available but the command has no dry-run mode
- WHEN the runner attempts smoke
- THEN that entry has `smoke: skipped` with `reason: no_dry_run_mode`

---

### Requirement: Validation Report

The runner MUST write `reports/gd-commands-report.json` with per-command entries.

Each entry MUST contain: `name`, `file`, `status` (`pass | warn | fail`), `schema`, `smoke`, and `errors[]`.

#### Scenario: Report written on success

- GIVEN all commands pass schema validation
- WHEN the runner completes
- THEN `reports/gd-commands-report.json` exists
- AND every entry has `status: pass`
- AND the overall report has `summary.total`, `summary.pass`, `summary.warn`, `summary.fail`

#### Scenario: Report written on partial failure

- GIVEN one command fails schema validation
- WHEN the runner completes
- THEN that command entry has `status: fail`
- AND the report `summary.fail` count is ≥ 1

---

### Requirement: CI Script

The shell script `scripts/validate-gd-commands.sh` MUST exit 1 if any command has `status: fail` in the report, and exit 0 otherwise.

The script MUST be executable without AWS credentials.

#### Scenario: All commands pass — CI exits 0

- GIVEN the runner produces a report with zero `fail` entries
- WHEN `validate-gd-commands.sh` runs
- THEN the script exits with code 0

#### Scenario: Any command fails — CI exits 1

- GIVEN the runner produces a report with at least one `fail` entry
- WHEN `validate-gd-commands.sh` runs
- THEN the script exits with code 1

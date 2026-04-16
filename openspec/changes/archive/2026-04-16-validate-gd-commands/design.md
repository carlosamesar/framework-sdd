# Design: Validate Execution of All gd:* Commands

## Technical Approach

Static two-layer validation runner in Node.js 20 ESM, following the existing `scripts/*.mjs` pattern. The runner inventories `.claude/commands/gd/*.md` against `COMMANDS-INDEX.md`, runs schema checks on each file, optionally exercises CLI smoke, and writes `reports/gd-commands-report.json`. A thin shell wrapper (`validate-gd-commands.sh`) provides CI integration with a simple exit-code contract.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Node.js 20 ESM `.mjs` runner | Consistent with existing `scripts/validate-spec.mjs`, `scripts/check-spec-implements.mjs`; no extra deps | ✅ Chosen |
| Python script | Already used for AWS ops; no shared infra with spec tooling | ❌ Rejected |
| Jest/Vitest test suite | Overkill; would add a dev dependency and require test runner setup | ❌ Rejected |
| Separate report file vs stdout | File enables CI artifact retention and diff over time | ✅ File (`reports/gd-commands-report.json`) |
| Smoke via real OpenCode CLI | CLI likely absent in most CI contexts; spec says downgrade gracefully | ✅ Optional, skipped if CLI absent |

## Data Flow

```
COMMANDS-INDEX.md ──┐
                    ├──→ Inventory ──→ CommandList[]
.claude/commands/gd/┘
                           │
                           ▼
                    Schema Validator ──→ per-command { schema: pass|fail, errors[] }
                           │
                           ▼
                    Smoke Runner ──→ per-command { smoke: pass|skipped|fail }
  (if CLI present)         │
                           ▼
                    ReportBuilder ──→ reports/gd-commands-report.json
                                              │
                                              ▼
                                   validate-gd-commands.sh ──→ exit 0 / 1
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `scripts/validate-gd-commands.mjs` | Create | Main runner: inventory + schema + smoke + report writer |
| `scripts/validate-gd-commands.sh` | Create | CI shell wrapper; reads report JSON, exits 1 if any `fail` |
| `reports/gd-commands-report.json` | Create (runtime) | Machine-readable per-command validation results |
| `openspec/changes/validate-gd-commands/design.md` | Create | This file |

No existing files are modified.

## Interfaces / Contracts

```js
// Report shape (reports/gd-commands-report.json)
{
  "generated": "ISO-8601",
  "summary": { "total": N, "pass": N, "warn": N, "fail": N },
  "commands": [
    {
      "name": "gd:start",
      "file": ".claude/commands/gd/start.md",
      "status": "pass | warn | fail",
      "schema": "pass | fail",
      "smoke":  "pass | skipped | fail",
      "errors": []            // e.g. ["missing_field: trigger"]
    }
  ]
}
```

**Schema rules** (derived from spec T.VGC.1):
- Required: a heading or `description` field, `trigger` keyword, and a `steps`/numbered-list body.
- Implementation reuses regex patterns already established in `scripts/validate-spec.mjs`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Inventory cross-reference, schema parser, report builder | Node `assert` inline tests or a companion `validate-gd-commands.test.mjs` with no external deps |
| Integration | Full runner against `.claude/commands/gd/` on the real filesystem | Run `node scripts/validate-gd-commands.mjs` and assert JSON report shape |
| CI | `validate-gd-commands.sh` exit code | Covered by the shell script itself in the CI pipeline |

## Migration / Rollout

No migration required. All new files are purely additive. The `reports/` directory already exists with a `.gitkeep`. The shell script should be added to `.gitignore`-exempt and made executable (`chmod +x`).

## Open Questions — Resolved

- [x] **Smoke validation**: Deferred entirely — `runSmoke()` always returns `{ smoke: 'skipped' }`. No dry-run mode exists for OpenCode commands today. A future change can implement real smoke when a headless mode is available. Decision recorded in `validate-gd-commands.mjs` code comment.

- [x] **`reports/gd-commands-report.json` gitignore policy**: Treated as a build artifact — added to `.gitignore`. The file is regenerated on every CI run and should not be committed to the repo. A `.gitkeep` ensures the `reports/` directory is tracked.

#!/usr/bin/env bash
# validate-gd-commands.sh
# CI wrapper: runs the Node.js validator and exits 1 if any command fails.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT="$REPO_ROOT/reports/gd-commands-report.json"

echo "=== Validating gd:* commands ==="
node "$SCRIPT_DIR/validate-gd-commands.mjs"

if [ ! -f "$REPORT" ]; then
  echo "ERROR: Report not generated at $REPORT"
  exit 1
fi

FAIL_COUNT=$(node -e "const r = JSON.parse(require('fs').readFileSync('$REPORT','utf8')); process.stdout.write(String(r.summary.fail));")

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "FAIL: $FAIL_COUNT command(s) failed validation. See $REPORT for details."
  exit 1
fi

echo "OK: All gd:* commands passed validation."
exit 0

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const evidence = require('../packages/sdd-ticket-management/evidence.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-evidence-'));
const reportPath = evidence.writeIssueExecutionReport({
  outputDir: tmpDir,
  payload: {
    issueNumber: 7001,
    owner: 'carlosamesar',
    repo: 'framework-sdd',
    dryRun: true,
    status: 'completed',
  },
});

assert.equal(fs.existsSync(reportPath), true, 'el reporte debe existir');
const content = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
assert.equal(content.issueNumber, 7001, 'debe persistir el número de issue');
assert.equal(content.status, 'completed', 'debe persistir el estado');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('OK: issue evidence smoke test passed');

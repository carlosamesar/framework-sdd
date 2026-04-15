import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const state = require('../packages/sdd-ticket-management/state.cjs');

const tmpFile = path.join(os.tmpdir(), `sdd-issue-state-${Date.now()}.json`);

const initial = state.readProcessedIssues(tmpFile);
assert.deepEqual(initial, {}, 'el estado inicial debe estar vacío');

assert.equal(state.shouldSkipIssue(tmpFile, 101), false, 'un issue nuevo no debe saltarse');
state.markIssueProcessed(tmpFile, 101, { status: 'done' });
assert.equal(state.shouldSkipIssue(tmpFile, 101), true, 'un issue ya procesado debe saltarse');

const after = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
assert.equal(after['101'].status, 'done', 'debe persistir el estado del issue');

fs.unlinkSync(tmpFile);
console.log('OK: issue state persistence smoke test passed');

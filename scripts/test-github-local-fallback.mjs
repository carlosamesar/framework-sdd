import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ticketing = require('../packages/sdd-ticket-management/index.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-local-issues-'));
const storePath = path.join(tmpDir, 'issues.json');

process.env.SDD_LOCAL_ISSUES = '1';
process.env.SDD_LOCAL_ISSUES_PATH = storePath;

const created = await ticketing.createIssue({
  owner: 'carlosamesar',
  repo: 'framework-sdd',
  title: 'Local fallback issue',
  body: 'Este issue debe persistirse localmente.',
});

assert.equal(created.local, true, 'debe usar fallback local');
assert.equal(created.title, 'Local fallback issue');

const issues = await ticketing.listIssues({
  owner: 'carlosamesar',
  repo: 'framework-sdd',
});

assert.equal(Array.isArray(issues), true, 'debe listar issues locales');
assert.equal(issues.length >= 1, true, 'debe existir al menos un issue local');
assert.equal(issues[0].title, 'Local fallback issue');

const comment = await ticketing.createComment({
  owner: 'carlosamesar',
  repo: 'framework-sdd',
  issue_number: 9999,
  body: 'Comentario local automático',
});

assert.equal(comment.local, true, 'el comentario debe persistirse localmente');

fs.rmSync(tmpDir, { recursive: true, force: true });
delete process.env.SDD_LOCAL_ISSUES;
delete process.env.SDD_LOCAL_ISSUES_PATH;

console.log('OK: github local fallback smoke test passed');

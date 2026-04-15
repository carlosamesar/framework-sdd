import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadIssueAutomationConfig } = require('../packages/sdd-ticket-management/config.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-issue-config-'));
const cfgPath = path.join(tmpDir, 'sdd-issue-config.yaml');

fs.writeFileSync(cfgPath, [
  'allowed_authors:',
  '  - carlosamesar',
  'trigger_labels:',
  '  - sdd-auto',
  'trigger_commands:',
  '  - /gd:start',
].join('\n'), 'utf8');

const config = loadIssueAutomationConfig(cfgPath);

assert.deepEqual(config.allowed_authors, ['carlosamesar']);
assert.deepEqual(config.trigger_labels, ['sdd-auto']);
assert.deepEqual(config.trigger_commands, ['/gd:start']);
assert.equal(Array.isArray(config.required_sections), true, 'debe devolver secciones requeridas');

console.log('OK: issue automation config smoke test passed');

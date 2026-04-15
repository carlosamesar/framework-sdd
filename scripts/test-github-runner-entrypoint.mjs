import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const cjsPath = path.resolve('scripts/auto-issue-runner.cjs');
const jsPath = path.resolve('scripts/auto-issue-runner.js');

const cjsContent = fs.readFileSync(cjsPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

assert.match(cjsContent, /sdd-issue-runner\.cjs/, 'el wrapper CJS debe redirigir al runner oficial');
assert.match(jsContent, /sdd-issue-runner\.cjs/, 'el wrapper JS debe redirigir al runner oficial');

console.log('OK: runner entrypoint unification smoke test passed');

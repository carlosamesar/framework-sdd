#!/usr/bin/env node
/**
 * E2E: path sandbox para spec:verify, validate-react-schemas (adhoc) y react-runner (preflight).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const node = process.execPath;

function runVerify(args) {
  return spawnSync(node, [path.join(root, 'scripts', 'verify-change.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const badSlugs = ['../..', 'foo/../..', '..\\foo', 'a/./b', '/etc/passwd'];
for (const bad of badSlugs) {
  const r = runVerify([bad]);
  assert(r.status !== 0, `verify-change debe fallar para slug "${bad}" (status ${r.status})`);
  assert(
    /Change no válido|no válido/i.test(r.stderr + r.stdout),
    `mensaje esperado para "${bad}"`,
  );
}

const ok = runVerify(['id-estado-uuid-migration']);
assert(ok.status === 0, `slug válido debe exit 0, got ${ok.status}`);

const vr = spawnSync(
  node,
  ['scripts/validate-react-schemas.mjs', '--data', '../../package.json', '--schema', 'specify'],
  { cwd: root, encoding: 'utf8' },
);
assert(vr.status !== 0, 'validate-react debe rechazar --data fuera del repo');

const rr = spawnSync(
  node,
  ['scripts/react-runner.mjs', '--dry-run', '--plan', 'scripts/fixtures/react-plan-bad-slug.json'],
  { cwd: root, encoding: 'utf8' },
);
assert(rr.status !== 0, 'react-runner dry-run debe fallar con change_slug traversal');

console.log('e2e-path-sandbox: OK');

#!/usr/bin/env node
/**
 * Prueba real (E2E) del gate spec:implements sobre sandboxes temporales.
 * No requiere Postgres ni git en el sandbox (solo fs + opcional git en raíz vacía).
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHECKER = path.join(__dirname, 'check-spec-implements.mjs');

function runChecker(root) {
  return spawnSync(process.execPath, [CHECKER, '--root', root], {
    encoding: 'utf8',
    cwd: __dirname,
  });
}

function mkFixture(name, body) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `fw-sdd-impl-${name}-`));
  fs.mkdirSync(path.join(tmp, 'openspec', 'specs'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'openspec', 'specs', 'fixture.md'), body);
  return tmp;
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

// 1) Happy path: implements interno existe
const goodRoot = mkFixture(
  'good',
  `---
id: "e2e.1"
implements:
  - "docs/exists.md"
---

# E2E

**GIVEN** un archivo bajo docs  
**WHEN** se valida implements  
**THEN** debe pasar
`,
);
fs.mkdirSync(path.join(goodRoot, 'docs'), { recursive: true });
fs.writeFileSync(path.join(goodRoot, 'docs', 'exists.md'), '# exists\n');

let r = runChecker(goodRoot);
assert(r.status === 0, 'caso 1: docs/exists.md declarado y presente → exit 0');
if (r.status !== 0) console.error(r.stdout || r.stderr);

// 2) Error: interno ausente
const badRoot = mkFixture(
  'bad',
  `---
id: "e2e.2"
implements:
  - "docs/no-existe.md"
---

# E2E bad

**GIVEN** ruta interna inexistente  
**WHEN** se valida  
**THEN** escenario de error
`,
);
r = runChecker(badRoot);
assert(r.status !== 0, 'caso 2: docs/no-existe.md ausente → exit != 0');
if (r.status === 0) console.error(r.stdout || r.stderr);

// 3) Path traversal rechazado
const uglyRoot = mkFixture(
  'ugly',
  `---
id: "e2e.3"
implements:
  - "../../../etc/passwd"
---

# E2E ugly

**GIVEN** path traversal  
**WHEN** se valida  
**THEN** error de seguridad
`,
);
r = runChecker(uglyRoot);
assert(r.status !== 0, 'caso 3: implements con .. → exit != 0');
if (r.status === 0) console.error(r.stdout || r.stderr);

// 4) Referencia externa lib/ sin archivo: no debe fallar el gate
const extRoot = mkFixture(
  'ext',
  `---
id: "e2e.4"
implements:
  - "lib/lambda/fantasma/index.mjs"
---

# E2E ext

**GIVEN** ref a otro repo  
**WHEN** no está en sandbox  
**THEN** no error (externo)
`,
);
r = runChecker(extRoot);
assert(r.status === 0, 'caso 4: lib/... ausente en sandbox → exit 0 (referencia cruzada)');
if (r.status !== 0) console.error(r.stdout || r.stderr);

for (const d of [goodRoot, badRoot, uglyRoot, extRoot]) {
  try {
    fs.rmSync(d, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

console.log(`\ne2e-spec-implements: ${failed ? 'FAILED' : 'OK'} (${4 - failed}/4)`);
process.exit(failed ? 1 : 0);

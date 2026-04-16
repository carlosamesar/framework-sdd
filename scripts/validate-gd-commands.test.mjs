#!/usr/bin/env node
/**
 * Unit tests for validate-gd-commands.mjs
 * Uses Node.js built-in assert — no external test runner required.
 * Run: node scripts/validate-gd-commands.test.mjs
 */
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// We import from the same module — need to patch FS for inventory tests
// Strategy: use temp directories for inventory and schema tests.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTempRepo(structure) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-test-'));
  for (const [relPath, content] of Object.entries(structure)) {
    const abs = path.join(tmp, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  return tmp;
}

function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ─── Import functions under test ─────────────────────────────────────────────

// We need to import but pass custom repoRoot — the functions accept options.repoRoot
const { inventoryCommands, validateSchemaContent, buildReport, runSmoke } =
  await import('./validate-gd-commands.mjs');

// ─── Test Suite: inventoryCommands() ─────────────────────────────────────────

console.log('\n=== Tests: inventoryCommands() ===');

{
  // T-INV-1: Happy path — files match index
  const tmp = makeTempRepo({
    'COMMANDS-INDEX.md': '- /gd:start\n- /gd:implement\n',
    '.claude/commands/gd/start.md': '# /gd:start\ntrigger\n1. step one\n',
    '.claude/commands/gd/implement.md': '# /gd:implement\ntrigger\n1. step one\n',
  });
  try {
    const result = inventoryCommands({ repoRoot: tmp });
    assert.strictEqual(result.commands.length, 2, 'T-INV-1: should find 2 commands');
    assert.strictEqual(result.missing.length, 0, 'T-INV-1: no missing commands');
    assert.strictEqual(result.extra.length, 0, 'T-INV-1: no extra commands');
    assert.strictEqual(result.commands[0].indexed, true, 'T-INV-1: start.md should be indexed');
    console.log('  ✅ T-INV-1: happy path — files match index');
  } finally {
    cleanup(tmp);
  }
}

{
  // T-INV-2: File exists on disk but not in index → extra
  const tmp = makeTempRepo({
    'COMMANDS-INDEX.md': '- /gd:start\n',
    '.claude/commands/gd/start.md': '# /gd:start\ntrigger\n1. step\n',
    '.claude/commands/gd/secret.md': '# /gd:secret\ntrigger\n1. step\n',
  });
  try {
    const result = inventoryCommands({ repoRoot: tmp });
    assert.strictEqual(result.extra.length, 1, 'T-INV-2: should have 1 extra');
    assert.strictEqual(result.extra[0], 'secret', 'T-INV-2: extra should be "secret"');
    console.log('  ✅ T-INV-2: extra file not in index detected');
  } finally {
    cleanup(tmp);
  }
}

{
  // T-INV-3: Index references a command but no file exists → missing
  const tmp = makeTempRepo({
    'COMMANDS-INDEX.md': '- /gd:start\n- /gd:missing-command\n',
    '.claude/commands/gd/start.md': '# /gd:start\ntrigger\n1. step\n',
  });
  try {
    const result = inventoryCommands({ repoRoot: tmp });
    assert.strictEqual(result.missing.length, 1, 'T-INV-3: should have 1 missing');
    assert.strictEqual(result.missing[0], 'missing-command', 'T-INV-3: missing slug correct');
    console.log('  ✅ T-INV-3: missing file (in index, no .md) detected');
  } finally {
    cleanup(tmp);
  }
}

{
  // T-INV-4: Index with grouped format (e.g. "clarificar: /gd:clarify, /gd:specify")
  const tmp = makeTempRepo({
    'COMMANDS-INDEX.md': '- clarificar: /gd:clarify, /gd:specify\n- /gd:start\n',
    '.claude/commands/gd/clarify.md': '# /gd:clarify\ntrigger\n1. step\n',
    '.claude/commands/gd/specify.md': '# /gd:specify\ntrigger\n1. step\n',
    '.claude/commands/gd/start.md': '# /gd:start\ntrigger\n1. step\n',
  });
  try {
    const result = inventoryCommands({ repoRoot: tmp });
    assert.strictEqual(result.missing.length, 0, 'T-INV-4: no missing with grouped format');
    assert.strictEqual(result.extra.length, 0, 'T-INV-4: no extra with grouped format');
    console.log('  ✅ T-INV-4: grouped format in index parsed correctly');
  } finally {
    cleanup(tmp);
  }
}

// ─── Test Suite: validateSchemaContent() ─────────────────────────────────────

console.log('\n=== Tests: validateSchema() ===');

{
  // T-SCH-1: Valid command — heading + trigger + numbered steps
  const content = `# /gd:start — Some Title

## Trigger
/gd:start

## Steps
1. Do this
2. Do that
`;
  const result = validateSchemaContent(content, 'test-valid');
  assert.strictEqual(result.schema, 'pass', 'T-SCH-1: valid command should pass schema');
  assert.strictEqual(result.errors.length, 0, 'T-SCH-1: no errors expected');
  console.log('  ✅ T-SCH-1: valid command passes schema');
}

{
  // T-SCH-2: Missing trigger keyword
  const content = `# /gd:start — Some Title

## Steps
1. Do this
2. Do that
`;
  const result = validateSchemaContent(content, 'test-no-trigger');
  assert.strictEqual(result.schema, 'fail', 'T-SCH-2: missing trigger should fail');
  assert.ok(
    result.errors.some((e) => e.includes('trigger')),
    'T-SCH-2: error should mention trigger',
  );
  console.log('  ✅ T-SCH-2: missing trigger detected');
}

{
  // T-SCH-3: Missing steps body (no numbered list, no checkbox, no steps section)
  const content = `# /gd:start — Some Title

trigger: /gd:start

Just a description without any steps.
`;
  const result = validateSchemaContent(content, 'test-no-steps');
  assert.strictEqual(result.schema, 'fail', 'T-SCH-3: missing steps should fail');
  assert.ok(
    result.errors.some((e) => e.includes('steps')),
    'T-SCH-3: error should mention steps',
  );
  console.log('  ✅ T-SCH-3: missing steps detected');
}

{
  // T-SCH-4: Missing heading (no heading, no description frontmatter)
  const content = `trigger: /gd:start

1. Do this
2. Do that
`;
  const result = validateSchemaContent(content, 'test-no-heading');
  assert.strictEqual(result.schema, 'fail', 'T-SCH-4: missing heading should fail');
  assert.ok(
    result.errors.some((e) => e.includes('heading')),
    'T-SCH-4: error should mention heading',
  );
  console.log('  ✅ T-SCH-4: missing heading detected');
}

{
  // T-SCH-5: Steps via checkbox list (- [ ] item)
  const content = `# /gd:start

trigger: /gd:start

- [ ] Step one
- [ ] Step two
`;
  const result = validateSchemaContent(content, 'test-checkbox-steps');
  assert.strictEqual(result.schema, 'pass', 'T-SCH-5: checkbox steps should pass');
  console.log('  ✅ T-SCH-5: checkbox steps accepted');
}

{
  // T-SCH-6: Steps via "## Paso" section heading
  const content = `# /gd:start — Something

trigger here

## Paso 1 — Do the thing

Explanation text.
`;
  const result = validateSchemaContent(content, 'test-paso-section');
  assert.strictEqual(result.schema, 'pass', 'T-SCH-6: Paso section should pass');
  console.log('  ✅ T-SCH-6: "## Paso" section accepted as steps');
}

// ─── Test Suite: buildReport() ───────────────────────────────────────────────

console.log('\n=== Tests: buildReport() ===');

{
  // T-REP-1: JSON shape matches design contract
  const fakeResults = [
    { name: 'gd:start', file: '.claude/commands/gd/start.md', status: 'pass', schema: 'pass', smoke: 'skipped', errors: [] },
    { name: 'gd:implement', file: '.claude/commands/gd/implement.md', status: 'fail', schema: 'fail', smoke: 'skipped', errors: ['missing_field: trigger'] },
    { name: 'gd:review', file: '.claude/commands/gd/review.md', status: 'warn', schema: 'pass', smoke: 'skipped', errors: ['warning: not_in_COMMANDS-INDEX.md'] },
  ];
  const report = buildReport(fakeResults);

  // Assert top-level shape
  assert.ok('generated' in report, 'T-REP-1: report must have "generated"');
  assert.ok('summary' in report, 'T-REP-1: report must have "summary"');
  assert.ok('commands' in report, 'T-REP-1: report must have "commands"');

  // Assert generated is ISO-8601
  const d = new Date(report.generated);
  assert.ok(!isNaN(d.getTime()), 'T-REP-1: generated must be valid ISO-8601');

  // Assert summary counts
  assert.strictEqual(report.summary.total, 3, 'T-REP-1: total = 3');
  assert.strictEqual(report.summary.pass, 1, 'T-REP-1: pass = 1');
  assert.strictEqual(report.summary.warn, 1, 'T-REP-1: warn = 1');
  assert.strictEqual(report.summary.fail, 1, 'T-REP-1: fail = 1');

  // Assert commands array shape
  assert.strictEqual(report.commands.length, 3, 'T-REP-1: commands length = 3');
  const first = report.commands[0];
  assert.ok('name' in first, 'T-REP-1: command has name');
  assert.ok('file' in first, 'T-REP-1: command has file');
  assert.ok('status' in first, 'T-REP-1: command has status');
  assert.ok('schema' in first, 'T-REP-1: command has schema');
  assert.ok('smoke' in first, 'T-REP-1: command has smoke');
  assert.ok('errors' in first, 'T-REP-1: command has errors');

  console.log('  ✅ T-REP-1: report JSON shape matches design contract');
}

{
  // T-REP-2: Empty results → all zeros
  const report = buildReport([]);
  assert.strictEqual(report.summary.total, 0, 'T-REP-2: total=0');
  assert.strictEqual(report.summary.pass, 0, 'T-REP-2: pass=0');
  assert.strictEqual(report.summary.fail, 0, 'T-REP-2: fail=0');
  assert.deepStrictEqual(report.commands, [], 'T-REP-2: empty commands array');
  console.log('  ✅ T-REP-2: empty results produce all-zero summary');
}

// ─── Test Suite: runSmoke() ───────────────────────────────────────────────────

console.log('\n=== Tests: runSmoke() ===');

{
  // T-SMK-1: Always returns skipped (no dry-run mode in OpenCode)
  const result = runSmoke({ name: 'gd:start', file: '.claude/commands/gd/start.md' });
  assert.strictEqual(result.smoke, 'skipped', 'T-SMK-1: smoke always skipped');
  console.log('  ✅ T-SMK-1: runSmoke() always returns skipped');
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n✅ All unit tests passed.\n');

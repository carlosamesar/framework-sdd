#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

function parseJsonOutput(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(trimmed.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function runNode(scriptPath, args, options = {}) {
  const proc = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd || WORKSPACE_ROOT,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: options.timeoutMs || 0,
    killSignal: 'SIGKILL',
    env: { ...process.env, ...(options.env || {}) },
  });

  return {
    code: proc.status ?? 1,
    stdout: proc.stdout || '',
    stderr: proc.stderr || '',
    signal: proc.signal || null,
    json: parseJsonOutput(proc.stdout),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runStep(name, fn) {
  process.stdout.write(`\n[TEST] ${name}\n`);
  const result = fn();
  process.stdout.write(`[PASS] ${name}\n`);
  return result;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const RAG_ROOT = path.join(WORKSPACE_ROOT, 'rag');
const SCRIPTS_ROOT = path.join(RAG_ROOT, 'scripts');
const smokeSlug = `smoke-${Date.now()}`;
const requireAgentic = process.env.FRAMEWORK_SDD_REQUIRE_AGENTIC === '1';
const agenticMode = process.env.FRAMEWORK_SDD_AGENTIC_MODE || 'auto'; // auto | resilience | live | skip
const envFile = path.join(WORKSPACE_ROOT, '.env');
const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const llmProvider = String(process.env.LLM_PROVIDER || (/(^|\n)LLM_PROVIDER=(.+)$/m.exec(envContent)?.[2] || 'anthropic')).trim().toLowerCase();
const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY) || /(^|\n)ANTHROPIC_API_KEY=/.test(envContent);
const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY) || /(^|\n)OPENROUTER_API_KEY=/.test(envContent);
const canRunAgentic = llmProvider === 'openrouter' ? hasOpenRouterKey : hasAnthropicKey;

try {
  runStep('Init/check evidence DB', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'init-db.mjs'), ['--check']);
    assert(result.code === 0, `init-db failed: ${result.stderr || result.stdout}`);
  });

  const evidencePayloads = [
    ['code', { task_id: 'T1' }],
    ['test', { passed: true, test_kind: 'smoke', framework: 'playwright' }],
    ['review_decision', { decision: 'approve' }],
    ['verification', { passed: true }],
    ['deployment_report', { status: 'success' }],
  ];

  for (const [type, metadata] of evidencePayloads) {
    runStep(`Capture ${type} evidence`, () => {
      const result = runNode(path.join(SCRIPTS_ROOT, 'capture-evidence.mjs'), [
        `--type=${type}`,
        `--change=${smokeSlug}`,
        `--task=${smokeSlug}`,
        `--title=${type}`,
        `--description=${type}`,
        `--metadata=${JSON.stringify(metadata)}`,
      ]);
      assert(result.code === 0, `${type} capture failed: ${result.stderr || result.stdout}`);
      assert(result.stdout.includes('evidence_id='), `${type} capture did not emit evidence id`);
    });
  }

  runStep('Vectorize smoke slug', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'vectorize.mjs'), [`--change=${smokeSlug}`]);
    assert(result.code === 0, `vectorize failed: ${result.stderr || result.stdout}`);
    assert(result.stdout.includes('ok vectorized='), 'vectorize output missing summary');
  });

  runStep('Maturity score reaches certification threshold', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'maturity-score.mjs'), [
      `--change=${smokeSlug}`,
      '--threshold=95',
      '--json',
    ]);
    assert(result.code === 0, `maturity-score failed: ${result.stderr || result.stdout}`);
    const payload = Array.isArray(result.json) ? result.json[0] : result.json;
    assert(payload?.certified === true, 'maturity-score did not certify the seeded slug');
    assert(payload?.score === 100, 'maturity-score did not produce 100 for seeded slug');
  });

  runStep('Semantic search returns seeded evidence', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'search.mjs'), [
      'review_decision',
      '--semantic',
      `--change=${smokeSlug}`,
      '--threshold=-1',
      '--limit=5',
      '--format=json',
    ]);
    assert(result.code === 0, `search failed: ${result.stderr || result.stdout}`);
    const results = result.json;
    assert(Array.isArray(results) && results.length > 0, 'semantic search returned no results for seeded slug');
  });

  runStep('Wrapper returns JSON on missing spec', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'run-langgraph-real.mjs'), [
      '--change=slug-que-no-existe',
      '--json',
    ]);
    assert(result.code === 1, `wrapper missing-spec exit code mismatch: ${result.code}`);
    assert(result.json?.certified === false, 'wrapper missing-spec did not return certified=false');
    assert(typeof result.json?.error === 'string', 'wrapper missing-spec did not return error message');
  });

  runStep('Deterministic cycle certifies and writes summary', () => {
    const result = runNode(path.join(SCRIPTS_ROOT, 'sdd-cycle.mjs'), [
      `--change=${smokeSlug}`,
      '--agents=false',
      '--json',
      `--summary-out=.data/reports/${smokeSlug}-cycle-summary.json`,
      `--report-out=.data/reports/${smokeSlug}-evidence.json`,
    ]);
    assert(result.code === 0, `deterministic cycle failed: ${result.stderr || result.stdout}`);
    assert(result.json?.status === 'certified', 'deterministic cycle did not certify');
    assert(result.json?.summary_file, 'deterministic cycle did not record summary file');
  });

  const resolvedAgenticMode = agenticMode === 'auto'
    ? ((canRunAgentic || requireAgentic) ? 'live' : 'skip')
    : agenticMode;

  if (resolvedAgenticMode === 'live') {
    runStep('Agentic wrapper continuous live mode certifies', () => {
      const result = runNode(path.join(SCRIPTS_ROOT, 'run-langgraph-real.mjs'), [
        '--change=bodega-tipo-responsables',
        '--continuous-live',
        '--live-attempts=3',
        '--live-backoff-ms=2000',
        '--timeout-ms=15000',
        '--process-timeout-ms=180000',
        '--json',
      ], { timeoutMs: 480000 });
      assert(result.code === 0, `agentic wrapper failed: ${result.stderr || result.stdout}`);
      assert(result.json?.certified === true, 'agentic wrapper did not certify');
    });
  } else if (resolvedAgenticMode === 'resilience') {
    runStep('Agentic wrapper timeout resilience returns structured JSON', () => {
      const result = runNode(path.join(SCRIPTS_ROOT, 'run-langgraph-real.mjs'), [
        '--change=bodega-tipo-responsables',
        '--continuous-live',
        '--live-attempts=2',
        '--live-backoff-ms=100',
        '--timeout-ms=15000',
        '--process-timeout-ms=1',
        '--max-process-timeout-ms=1',
        '--json',
      ], { timeoutMs: 120000 });

      assert(result.code !== 0, 'resilience check expected non-zero exit on forced timeout');
      assert(result.json?.certified === false, 'resilience check expected certified=false');
      assert(typeof result.json?.error === 'string', 'resilience check expected structured error');
      assert(typeof result.json?.log_path === 'string', 'resilience check expected log_path');
      assert(Array.isArray(result.json?.attempts) && result.json.attempts.length >= 1, 'resilience check expected attempts trace');
    });
  } else if (resolvedAgenticMode === 'skip') {
    process.stdout.write('\n[SKIP] Agentic validation skipped by mode\n');
  } else {
    throw new Error(`Unsupported FRAMEWORK_SDD_AGENTIC_MODE: ${resolvedAgenticMode}`);
  }

  process.stdout.write('\nAll functional smoke tests passed.\n');
  process.exit(0);
} catch (error) {
  console.error(`\n[FAIL] ${error.message}`);
  process.exit(1);
}
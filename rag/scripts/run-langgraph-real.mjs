#!/usr/bin/env node
/**
 * run-langgraph-real.mjs
 *
 * Stable wrapper for Phase 2 execution on real changes.
 * - Resolves spec from active change path first.
 * - Falls back to archived change path by slug suffix.
 * - Captures output to a log file and prints a consistent result.
 * - Serves as the standard npm entrypoint for `sdd:run`.
 *
 * Usage:
 *   node scripts/run-langgraph-real.mjs --change=<slug> [--spec=<path>] [--json]
 *   node scripts/run-langgraph-real.mjs --change=<slug> [--timeout-ms=15000] [--max-retries=3]
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const idx = arg.indexOf('=');
    if (idx > -1) {
      opts[arg.substring(2, idx)] = arg.substring(idx + 1);
    } else {
      opts[arg.substring(2)] = true;
    }
  }
  return opts;
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

function parseBool(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
}

function parsePositiveInt(value, defaultValue) {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function sleepMs(ms) {
  const delay = Number(ms);
  if (!Number.isFinite(delay) || delay <= 0) return;
  const lock = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(lock, 0, 0, delay);
}

function emitUsageAndExit(jsonOutput, message, extra = {}) {
  if (jsonOutput) {
    process.stdout.write(`${JSON.stringify({ certified: false, error: message, ...extra }, null, 2)}\n`);
  } else {
    console.error(message);
  }
  process.exit(1);
}

function resolveSpecPath(repoRoot, slug, explicitSpec) {
  if (explicitSpec) {
    const resolved = path.isAbsolute(explicitSpec)
      ? explicitSpec
      : path.resolve(process.cwd(), explicitSpec);
    return existsSync(resolved) ? resolved : null;
  }

  const activeSpec = path.join(repoRoot, 'openspec', 'changes', slug, 'spec.md');
  if (existsSync(activeSpec)) return activeSpec;

  const archiveRoot = path.join(repoRoot, 'openspec', 'changes', 'archive');
  if (!existsSync(archiveRoot)) return null;

  const archiveMatch = readdirSync(archiveRoot)
    .sort()
    .reverse()
    .find(name => name.endsWith(`-${slug}`));

  if (!archiveMatch) return null;

  const archivedSpec = path.join(archiveRoot, archiveMatch, 'spec.md');
  return existsSync(archivedSpec) ? archivedSpec : null;
}

const opts = parseArgs(process.argv.slice(2));
const changeSlug = opts.change;
const jsonOutput = opts.json === true;
const timeoutMs = opts['timeout-ms'];
const maxRetries = opts['max-retries'];
const processTimeoutMs = parsePositiveInt(opts['process-timeout-ms'], 180000);
const continuousLive = parseBool(opts['continuous-live'], false);
const liveAttempts = parsePositiveInt(
  opts['live-attempts'],
  parsePositiveInt(process.env.FRAMEWORK_SDD_AGENTIC_LIVE_ATTEMPTS, 3)
);
const liveBackoffMs = parsePositiveInt(
  opts['live-backoff-ms'],
  parsePositiveInt(process.env.FRAMEWORK_SDD_AGENTIC_LIVE_BACKOFF_MS, 5000)
);
const maxProcessTimeoutMs = parsePositiveInt(
  opts['max-process-timeout-ms'],
  parsePositiveInt(process.env.FRAMEWORK_SDD_AGENTIC_MAX_PROCESS_TIMEOUT_MS, 600000)
);
const totalAttempts = continuousLive ? Math.max(1, liveAttempts) : 1;

if (!changeSlug) {
  emitUsageAndExit(jsonOutput, 'Usage: node scripts/run-langgraph-real.mjs --change=<slug> [--spec=<path>] [--json]');
}

const repoRoot = getWorkspaceRoot();
const specPath = resolveSpecPath(repoRoot, changeSlug, opts.spec);

if (!specPath) {
  emitUsageAndExit(
    jsonOutput,
    `Spec not found for change: ${changeSlug}`,
    {
      change_slug: changeSlug,
      details: 'Checked active path and archive suffix matches in openspec/changes/archive/.',
    }
  );
}

const runScript = path.join(repoRoot, 'rag', 'langgraph', 'run.mjs');
const args = ['--change=' + changeSlug, '--spec=' + specPath];
if (jsonOutput) args.push('--json');
if (maxRetries) args.push('--max-retries=' + maxRetries);

const logsDir = path.join(repoRoot, '.data', 'logs');
mkdirSync(logsDir, { recursive: true });

function runAttempt(attemptNumber, attemptProcessTimeoutMs) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = totalAttempts > 1 ? `-try${attemptNumber}` : '';
  const logPath = path.join(logsDir, `langgraph-${changeSlug}-${stamp}${suffix}.log`);

  const result = spawnSync('node', [runScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...(timeoutMs ? {
        LLM_TIMEOUT_MS: String(timeoutMs),
        ANTHROPIC_TIMEOUT_MS: String(timeoutMs),
        OPENROUTER_TIMEOUT_MS: String(timeoutMs),
      } : {})
    },
    maxBuffer: 10 * 1024 * 1024,
    timeout: attemptProcessTimeoutMs,
    killSignal: 'SIGKILL'
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const parsedStdout = parseJsonOutput(stdout);
  const wrapperError = result.error
    ? `[run-langgraph-real] subprocess error: ${result.error.message}`
    : null;
  const emptyOutputError = !stdout.trim() && !stderr.trim()
    ? `No output captured. See log: ${logPath}`
    : null;

  const diagnostics = [
    `[wrapper] change=${changeSlug}`,
    `[wrapper] spec=${specPath}`,
    `[wrapper] timeout_ms=${timeoutMs || 'inherit'}`,
    `[wrapper] process_timeout_ms=${attemptProcessTimeoutMs}`,
    `[wrapper] attempt=${attemptNumber}/${totalAttempts}`,
    `[wrapper] status=${String(result.status)}`,
    `[wrapper] signal=${String(result.signal)}`,
    result.error ? `[wrapper] error=${result.error.message}` : ''
  ].filter(Boolean).join('\n');

  writeFileSync(logPath, [diagnostics, '', stdout, stderr].filter(Boolean).join('\n'));

  const retryableErrorText = [
    wrapperError,
    emptyOutputError,
    parsedStdout?.error,
    stderr.trim(),
  ].filter(Boolean).join('\n').toLowerCase();

  const isRetryable =
    Boolean(result.error) ||
    Boolean(emptyOutputError) ||
    result.signal === 'SIGTERM' ||
    result.signal === 'SIGKILL' ||
    (jsonOutput && !parsedStdout) ||
    retryableErrorText.includes('etimedout') ||
    retryableErrorText.includes('timeout');

  const ok =
    typeof result.status === 'number' &&
    result.status === 0 &&
    (!jsonOutput || Boolean(parsedStdout));

  return {
    attempt: attemptNumber,
    process_timeout_ms: attemptProcessTimeoutMs,
    result,
    stdout,
    stderr,
    parsedStdout,
    logPath,
    wrapperError,
    emptyOutputError,
    ok,
    isRetryable,
  };
}

const attempts = [];
let selected = null;

for (let i = 1; i <= totalAttempts; i++) {
  const scaledTimeout = Math.min(processTimeoutMs * Math.pow(2, i - 1), maxProcessTimeoutMs);
  const attempt = runAttempt(i, scaledTimeout);
  attempts.push(attempt);
  selected = attempt;

  if (attempt.ok) break;
  if (!continuousLive || i >= totalAttempts || !attempt.isRetryable) break;
  sleepMs(liveBackoffMs * i);
}

const finalAttempt = selected || attempts[attempts.length - 1];
const finalResult = finalAttempt.result;
const stdout = finalAttempt.stdout;
const stderr = finalAttempt.stderr;
const parsedStdout = finalAttempt.parsedStdout;
const wrapperError = finalAttempt.wrapperError;
const emptyOutputError = finalAttempt.emptyOutputError;

if (stdout.trim()) process.stdout.write(stdout);
if (stderr.trim() && !jsonOutput) process.stderr.write(stderr);

if (emptyOutputError && !jsonOutput) {
  console.error(emptyOutputError);
}

if (wrapperError && !jsonOutput) {
  console.error(wrapperError);
}

if (!jsonOutput) {
  const attemptInfo = `attempts=${attempts.length}/${totalAttempts}`;
  console.log(`\n[run-langgraph-real] log=${finalAttempt.logPath} ${attemptInfo}`);
} else if (!parsedStdout) {
  const fallback = {
    change_slug: changeSlug,
    certified: false,
    error: wrapperError || emptyOutputError || (stderr.trim() || 'Wrapped LangGraph run did not return JSON output.'),
    status: typeof finalResult.status === 'number' ? finalResult.status : null,
    signal: finalResult.signal || null,
    spec_path: specPath,
    log_path: finalAttempt.logPath,
    attempts: attempts.map((a) => ({
      attempt: a.attempt,
      process_timeout_ms: a.process_timeout_ms,
      status: typeof a.result.status === 'number' ? a.result.status : null,
      signal: a.result.signal || null,
      error: a.wrapperError || a.emptyOutputError || null,
      log_path: a.logPath,
    })),
  };
  process.stdout.write(`${JSON.stringify(fallback, null, 2)}\n`);
}

if (typeof finalResult.status === 'number') {
  process.exit(finalResult.status);
}
process.exit(finalResult.error ? 1 : 0);

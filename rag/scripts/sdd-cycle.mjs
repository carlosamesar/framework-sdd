#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const eq = arg.indexOf('=');
    if (eq > -1) {
      opts[arg.substring(2, eq)] = arg.substring(eq + 1);
      continue;
    }

    const key = arg.substring(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      opts[key] = next;
      i++;
    } else {
      opts[key] = true;
    }
  }
  return opts;
}

function parseJsonOutput(stdout) {
  const trimmed = String(stdout || '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const maybe = trimmed.slice(first, last + 1);
      try {
        return JSON.parse(maybe);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function runNodeScript(scriptPath, args) {
  const proc = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: path.dirname(path.dirname(scriptPath)),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    killSignal: 'SIGKILL',
  });

  return {
    code: proc.status ?? 1,
    stdout: proc.stdout || '',
    stderr: proc.stderr || '',
    signal: proc.signal || null,
    error: proc.error ? proc.error.message : null,
    json: parseJsonOutput(proc.stdout),
  };
}

function ensureAbsoluteOutputPath(workspaceRoot, targetPath) {
  if (!targetPath) return null;
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.join(workspaceRoot, targetPath);
}

function writeSummaryFile(workspaceRoot, summary, summaryOut) {
  const resolved = ensureAbsoluteOutputPath(workspaceRoot, summaryOut);
  if (!resolved) return null;
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  return resolved;
}

function isAgentTimeout(agentic) {
  const errorText = [
    agentic?.error,
    agentic?.stderr,
    agentic?.json?.error,
    agentic?.stdout,
  ].filter(Boolean).join('\n');

  return errorText.includes('ETIMEDOUT') || agentic?.json?.signal === 'SIGTERM';
}

function finalizeAndExit(workspaceRoot, summary, opts, exitCode) {
  summary.finished_at = new Date().toISOString();
  const defaultSummaryOut = path.join('.data', 'reports', `${summary.change}-cycle-summary.json`);
  const summaryPath = writeSummaryFile(workspaceRoot, summary, opts['summary-out'] || defaultSummaryOut);
  if (summaryPath) {
    summary.summary_file = path.relative(workspaceRoot, summaryPath);
  }
  outputSummary(summary, opts.json);
  process.exit(exitCode);
}

function boolOpt(value, defaultValue) {
  if (value === undefined) return defaultValue;
  const normalized = String(value).toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || !opts.change) {
    console.log(`
Run deterministic SDD gates and optional LangGraph agentic execution in one command.

Usage:
  node scripts/sdd-cycle.mjs --change <slug> [options]

Options:
  --change <slug>              Required change slug
  --threshold <n>              Certification threshold for deterministic run (default: 95)
  --auto-capture               Enable deterministic auto-capture
  --payload-file <path>        Payload used by deterministic runner
  --agents <true|false>        Execute agentic LangGraph stage (default: true)
  --agentic-continuous <bool>  Retry live agentic stage on transient timeouts (default: true)
  --agentic-live-attempts <n>  Max attempts for continuous live mode (default: 3)
  --agentic-backoff-ms <n>     Base backoff between live attempts (default: 5000)
  --timeout-ms <n>             LangGraph timeout (default: 600000)
  --process-timeout-ms <n>     Wrapper process timeout for the agentic stage
  --summary-out <path>         Persist cycle summary JSON (default: .data/reports/<slug>-cycle-summary.json)
  --export <true|false>        Export evidence JSON report (default: true)
  --report-out <path>          Export destination path
  --json                       Print machine-readable summary

Examples:
  node scripts/sdd-cycle.mjs --change=bodega-tipo-responsables --json
  node scripts/sdd-cycle.mjs --change=bodega-tipo-responsables --agents=false --json
`);
    process.exit(opts.change ? 0 : 1);
  }

  const workspaceRoot = getWorkspaceRoot();
  const ragScripts = path.join(workspaceRoot, 'rag', 'scripts');

  const deterministicArgs = [
    path.join(ragScripts, 'run-pipeline.mjs'),
    `--change=${opts.change}`,
    `--threshold=${String(opts.threshold || '95')}`,
    '--json',
  ];

  if (boolOpt(opts['auto-capture'], false)) {
    deterministicArgs.push('--auto-capture');
  }
  if (opts['payload-file']) {
    deterministicArgs.push(`--payload-file=${opts['payload-file']}`);
  }

  const deterministic = runNodeScript(deterministicArgs[0], deterministicArgs.slice(1));

  const summary = {
    change: opts.change,
    started_at: new Date().toISOString(),
    deterministic,
    agentic: null,
    report: null,
    status: 'failed',
  };

  const detJson = deterministic.json;
  const deterministicPassed = deterministic.code === 0 && detJson?.certified === true;

  if (!deterministicPassed) {
    summary.status = 'blocked-deterministic';
    finalizeAndExit(workspaceRoot, summary, opts, 2);
  }

  const runAgents = boolOpt(opts.agents, true);
  if (runAgents) {
    const explicitProcessTimeout = opts['process-timeout-ms'] !== undefined;
    const baseProcessTimeout = String(opts['process-timeout-ms'] || '180000');
    const agenticContinuous = boolOpt(opts['agentic-continuous'], true);
    const liveAttempts = String(opts['agentic-live-attempts'] || process.env.FRAMEWORK_SDD_AGENTIC_LIVE_ATTEMPTS || '3');
    const liveBackoffMs = String(opts['agentic-backoff-ms'] || process.env.FRAMEWORK_SDD_AGENTIC_LIVE_BACKOFF_MS || '5000');
    const agentArgs = [
      path.join(ragScripts, 'run-langgraph-real.mjs'),
      `--change=${opts.change}`,
      '--json',
      `--timeout-ms=${String(opts['timeout-ms'] || '600000')}`,
      `--process-timeout-ms=${baseProcessTimeout}`,
    ];

    if (agenticContinuous) {
      agentArgs.push('--continuous-live');
      agentArgs.push(`--live-attempts=${liveAttempts}`);
      agentArgs.push(`--live-backoff-ms=${liveBackoffMs}`);
    }

    if (opts['max-retries']) {
      agentArgs.push(`--max-retries=${String(opts['max-retries'])}`);
    }

    let agentic = runNodeScript(agentArgs[0], agentArgs.slice(1));
    summary.agentic_attempts = [agentic];

    if (!explicitProcessTimeout && isAgentTimeout(agentic)) {
      const fallbackTimeout = String(Math.max(Number(baseProcessTimeout), 300000));
      const retryArgs = [
        ...agentArgs.filter((arg) => !arg.startsWith('--process-timeout-ms=')),
        `--process-timeout-ms=${fallbackTimeout}`,
      ];
      agentic = runNodeScript(retryArgs[0], retryArgs.slice(1));
      summary.agentic_retry = {
        reason: 'timeout',
        process_timeout_ms: fallbackTimeout,
      };
      summary.agentic_attempts.push(agentic);
    }

    summary.agentic = agentic;

    const agentPassed = agentic.code === 0 && agentic.json?.certified === true;
    if (!agentPassed) {
      summary.status = 'blocked-agentic';
      finalizeAndExit(workspaceRoot, summary, opts, 3);
    }
  }

  const doExport = boolOpt(opts.export, true);
  if (doExport) {
    const defaultOut = path.join('.data', 'reports', `${opts.change}-evidence.json`);
    const reportPath = opts['report-out'] || defaultOut;
    const exportArgs = [
      path.join(ragScripts, 'audit-export.mjs'),
      `--change=${opts.change}`,
      '--format=json',
      '--pretty',
      '--include-audit',
      `--out=${reportPath}`,
    ];

    const report = runNodeScript(exportArgs[0], exportArgs.slice(1));
    summary.report = {
      ...report,
      output: reportPath,
    };

    if (report.code !== 0) {
      summary.status = 'warning-export-failed';
      finalizeAndExit(workspaceRoot, summary, opts, 4);
    }
  }

  summary.status = 'certified';
  finalizeAndExit(workspaceRoot, summary, opts, 0);
}

function outputSummary(summary, asJson) {
  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const lines = [
    `Change: ${summary.change}`,
    `Status: ${summary.status}`,
    `Deterministic exit: ${summary.deterministic?.code}`,
  ];

  if (summary.agentic) lines.push(`Agentic exit: ${summary.agentic.code}`);
  if (summary.agentic?.error) lines.push(`Agentic error: ${summary.agentic.error}`);
  if (summary.report?.output) lines.push(`Report: ${summary.report.output}`);
  if (summary.summary_file) lines.push(`Summary: ${summary.summary_file}`);
  lines.push(`Finished: ${summary.finished_at}`);

  console.log(lines.join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(`sdd-cycle failed: ${error.message}`);
    process.exit(1);
  }
}

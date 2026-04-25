#!/usr/bin/env node
/**
 * sdd-new.mjs
 *
 * Flujo completo automático: recibe una descripción en lenguaje natural,
 * genera el spec.md con LLM y ejecuta el ciclo SDD hasta certificación.
 *
 * Usage:
 *   node scripts/sdd-new.mjs --task="Agregar campo moneda a facturas" [--change=<slug>] [--json]
 *   node scripts/sdd-new.mjs --task="..." --change=mi-feature-slug --timeout-ms=15000
 *
 * Flags:
 *   --task=<desc>         Descripción en lenguaje natural (requerido)
 *   --change=<slug>       Slug del change (opcional, se genera automático desde --task)
 *   --json                Output JSON estructurado
 *   --timeout-ms=<ms>     Timeout por llamada LLM (default: 30000)
 *   --process-timeout-ms  Timeout del subprocess agentic (default: 180000)
 *   --continuous-live     Reintentos continuos si el LLM falla
 *   --live-attempts=<n>   Intentos en modo continuous (default: 3)
 *   --dry-run             Solo genera el spec, no ejecuta el pipeline
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const RAG_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(RAG_ROOT, '..');

dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config();

// ─── Arg parsing ─────────────────────────────────────────────────────────────

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

function parseBool(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
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

function toAbsoluteFromRepoRoot(repoRoot, targetPath) {
  if (!targetPath) return null;
  return path.isAbsolute(targetPath) ? targetPath : path.join(repoRoot, targetPath);
}

function buildTransitionsTable(transitions) {
  if (!Array.isArray(transitions) || transitions.length === 0) {
    return '_Sin transiciones registradas_';
  }

  const lines = [
    '| From | To | Decision |',
    '|---|---|---|',
  ];

  for (const transition of transitions) {
    lines.push(`| ${transition.from || '-'} | ${transition.to || '-'} | ${transition.decision || '-'} |`);
  }

  return lines.join('\n');
}

function buildMessagesList(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '- Sin mensajes de etapas';
  }
  return messages.map((message) => `- ${message}`).join('\n');
}

const opts = parseArgs(process.argv.slice(2));
const taskDescription = opts['task'];
const jsonOutput = opts['json'] === true || opts['json'] === 'true';
const dryRun = opts['dry-run'] === true || opts['dry-run'] === 'true';
const reportMdEnabled = parseBool(opts['report-md'], true);

if (!taskDescription) {
  const usage = 'Usage: node scripts/sdd-new.mjs --task="descripción de la tarea" [--change=<slug>] [--json] [--dry-run]';
  if (jsonOutput) {
    process.stdout.write(JSON.stringify({ certified: false, error: 'missing --task', usage }) + '\n');
  } else {
    console.error(usage);
  }
  process.exit(1);
}

// ─── Slug generation ─────────────────────────────────────────────────────────

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
    .replace(/-$/, '');
}

const changeSlug = opts['change'] || toSlug(taskDescription);

if (!jsonOutput) {
  console.log(`[sdd-new] task: ${taskDescription}`);
  console.log(`[sdd-new] slug: ${changeSlug}`);
}

// ─── Check if spec already exists ────────────────────────────────────────────

const specDir = path.join(REPO_ROOT, 'openspec', 'changes', changeSlug);
const specPath = path.join(specDir, 'spec.md');

if (existsSync(specPath) && !opts['force']) {
  if (!jsonOutput) {
    console.log(`[sdd-new] spec already exists: ${specPath}`);
    console.log('[sdd-new] use --force to regenerate, or run sdd:run directly');
  }
  // Skip spec generation, proceed to pipeline
} else {
  // ─── LLM: generate spec ──────────────────────────────────────────────────

  if (!jsonOutput) console.log('[sdd-new] generating spec with LLM...');

  const provider = String(process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  const timeoutMs = parseInt(
    opts['timeout-ms'] ||
    process.env.LLM_TIMEOUT_MS ||
    process.env.ANTHROPIC_TIMEOUT_MS ||
    process.env.OPENROUTER_TIMEOUT_MS ||
    '30000',
    10
  );

  const SPEC_SYSTEM_PROMPT = `Eres un arquitecto de software senior especializado en sistemas multi-tenant.
Tu tarea es escribir un spec técnico de cambio para el framework SDD (Spec-Driven Development).

El spec DEBE seguir este formato exacto en Markdown:
# Spec: <título conciso>

## Context
<Descripción breve del contexto técnico y del sistema afectado. Máximo 3 líneas.>

---

## REQ-01: <Nombre del primer requisito>

**MUST** <restricción obligatoria>.
**MUST NOT** <restricción negativa si aplica>.
**MAY** <comportamiento opcional si aplica>.

### Scenario 1.1 — <nombre del escenario happy path>
\`\`\`
Given: <condición inicial>
When: <acción del usuario o sistema>
Then: <resultado esperado con detalles concretos>
\`\`\`

### Scenario 1.2 — <nombre del escenario de error o borde>
\`\`\`
Given: <condición>
Then: <código HTTP y mensaje de error esperado>
\`\`\`

---

## REQ-02: <Segundo requisito si aplica>
<continúa el mismo patrón>

---

## Non-functional requirements

- **Seguridad**: tenantId siempre desde JWT custom:tenant_id, nunca desde input del cliente.
- **Performance**: <si aplica, especificación de latencia o recursos>

Reglas:
1. Un spec tiene entre 2 y 5 REQ numerados.
2. Cada REQ tiene entre 2 y 4 Scenarios numerados.
3. No incluyas código de implementación, solo especificación.
4. Usa kebab-case para nombres técnicos (campos, endpoints).
5. Responde SOLO con el contenido Markdown del spec, sin texto adicional.`;

  let specContent = null;
  let llmError = null;

  try {
    if (provider === 'openrouter') {
      const { ChatOpenAI } = await import('@langchain/openai');
      const llm = new ChatOpenAI({
        model:
          process.env.CODEX_MODEL ||
          process.env.OPENROUTER_MODEL ||
          process.env.SDD_LLM_MODEL ||
          'openai/gpt-5-mini',
        temperature: 0,
        timeout: timeoutMs,
        maxRetries: 1,
        apiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        },
      });
      const response = await llm.invoke([
        { role: 'system', content: SPEC_SYSTEM_PROMPT },
        { role: 'user', content: `Genera el spec para esta tarea: ${taskDescription}` },
      ]);
      specContent = String(response.content).trim();
    } else {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const llm = new ChatAnthropic({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
        temperature: 0,
        timeout: timeoutMs,
        maxRetries: 1,
      });
      const response = await llm.invoke([
        { role: 'system', content: SPEC_SYSTEM_PROMPT },
        { role: 'user', content: `Genera el spec para esta tarea: ${taskDescription}` },
      ]);
      specContent = String(response.content).trim();
    }
  } catch (err) {
    llmError = err.message || String(err);
  }

  if (llmError || !specContent) {
    const errMsg = `LLM spec generation failed: ${llmError || 'empty response'}`;
    if (jsonOutput) {
      process.stdout.write(JSON.stringify({ certified: false, change_slug: changeSlug, error: errMsg }) + '\n');
    } else {
      console.error(`[sdd-new] ${errMsg}`);
    }
    process.exit(1);
  }

  // Strip markdown code fences if LLM wrapped the response
  if (specContent.startsWith('```')) {
    specContent = specContent.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '');
  }

  // Write spec file
  mkdirSync(specDir, { recursive: true });
  writeFileSync(specPath, specContent + '\n', 'utf8');

  if (!jsonOutput) {
    console.log(`[sdd-new] spec written: ${specPath}`);
    console.log('');
    console.log('─── Generated Spec ────────────────────────────────────────────');
    console.log(specContent);
    console.log('───────────────────────────────────────────────────────────────');
    console.log('');
  }
}

// ─── Dry-run: stop here ───────────────────────────────────────────────────────

if (dryRun) {
  const specContent = readFileSync(specPath, 'utf8');
  if (jsonOutput) {
    process.stdout.write(JSON.stringify({
      change_slug: changeSlug,
      spec_path: specPath,
      spec_content: specContent,
      dry_run: true,
      certified: false,
    }, null, 2) + '\n');
  } else {
    console.log(`[sdd-new] --dry-run: spec ready at ${specPath}`);
    console.log('[sdd-new] run sdd:run to execute the pipeline');
  }
  process.exit(0);
}

// ─── Run full SDD pipeline ───────────────────────────────────────────────────

if (!jsonOutput) console.log('[sdd-new] running full SDD pipeline...');

const runnerPath = path.join(RAG_ROOT, 'scripts', 'run-langgraph-real.mjs');

const runnerArgs = [
  runnerPath,
  `--change=${changeSlug}`,
  `--spec=${specPath}`,
];

if (opts['timeout-ms']) runnerArgs.push(`--timeout-ms=${opts['timeout-ms']}`);
if (opts['process-timeout-ms']) runnerArgs.push(`--process-timeout-ms=${opts['process-timeout-ms']}`);
if (opts['max-process-timeout-ms']) runnerArgs.push(`--max-process-timeout-ms=${opts['max-process-timeout-ms']}`);
if (opts['continuous-live']) runnerArgs.push('--continuous-live');
if (opts['live-attempts']) runnerArgs.push(`--live-attempts=${opts['live-attempts']}`);
if (opts['live-backoff-ms']) runnerArgs.push(`--live-backoff-ms=${opts['live-backoff-ms']}`);
if (opts['max-retries']) runnerArgs.push(`--max-retries=${opts['max-retries']}`);
if (jsonOutput) runnerArgs.push('--json');

const env = {
  ...process.env,
  SDD_NEW_SPEC_PATH: specPath,
};

const result = spawnSync(process.execPath, runnerArgs, {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
  env,
  cwd: RAG_ROOT,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (reportMdEnabled) {
  const parsedRunner = parseJsonOutput(result.stdout || '');
  const defaultReportOut = path.join('.data', 'reports', `${changeSlug}-agent-report.md`);
  const reportPath = toAbsoluteFromRepoRoot(REPO_ROOT, opts['report-out'] || defaultReportOut);
  const exportedEvidence = spawnSync(
    process.execPath,
    [
      path.join(RAG_ROOT, 'scripts', 'audit-export.mjs'),
      `--change=${changeSlug}`,
      '--format=md',
      '--include-audit',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
      cwd: RAG_ROOT,
    }
  );

  const evidenceMd = exportedEvidence.status === 0
    ? String(exportedEvidence.stdout || '').trim()
    : '';

  const pipelineResult = parsedRunner?.pipeline_result || {};
  const runnerStatus = pipelineResult.status || (parsedRunner?.certified ? 'certified' : 'failed');
  const runnerScore = typeof parsedRunner?.score === 'number' ? parsedRunner.score : 'n/a';
  const runnerCertified = parsedRunner?.certified === true;
  const runnerError = parsedRunner?.error || null;
  const logPath = parsedRunner?.log_path || null;

  const reportLines = [
    `# Agent Execution Report: ${changeSlug}`,
    '',
    '## Summary',
    `- Generated at: ${new Date().toISOString()}`,
    `- Task: ${taskDescription}`,
    `- Change: ${changeSlug}`,
    `- Spec path: ${specPath}`,
    `- Status: ${runnerStatus}`,
    `- Certified: ${runnerCertified ? 'yes' : 'no'}`,
    `- Score: ${runnerScore}`,
  ];

  if (runnerError) reportLines.push(`- Error: ${runnerError}`);
  if (logPath) reportLines.push(`- Wrapper log: ${logPath}`);

  reportLines.push('');
  reportLines.push('## Stage Messages');
  reportLines.push(buildMessagesList(parsedRunner?.messages));
  reportLines.push('');
  reportLines.push('## Pipeline Transitions');
  reportLines.push(buildTransitionsTable(pipelineResult.transitions));
  reportLines.push('');
  reportLines.push('## Evidence Export');
  if (evidenceMd) {
    reportLines.push(evidenceMd);
  } else {
    reportLines.push('_No se pudo exportar evidencia en Markdown para este change._');
  }
  reportLines.push('');

  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, reportLines.join('\n') + '\n', 'utf8');

  const reportMsg = `[sdd-new] markdown report: ${reportPath}`;
  if (jsonOutput) {
    process.stderr.write(reportMsg + '\n');
  } else {
    console.log(reportMsg);
  }
}

process.exit(result.status ?? (result.error ? 1 : 0));

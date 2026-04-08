#!/usr/bin/env node
/**
 * Runtime ReAct mínimo (Framework-SDD): lee openspec/tools-manifest.yaml y ejecuta
 * herramientas registradas con type:exec + handler en HANDLERS.
 *
 * Uso:
 *   node scripts/react-runner.mjs --plan scripts/fixtures/react-plan-smoke.json
 *   node scripts/react-runner.mjs --stdin   # NDJSON: una línea {"tool":"spec_validate","input":{}} por acción
 *
 * Políticas: max_tool_iterations y stop_on_first_hard_fail desde el manifiesto.
 * --dry-run: valida plan + input_schema + handler sin ejecutar herramientas.
 * --list-tools: imprime herramientas del manifiesto (JSON) y sale.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { parse as parseYaml } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import { getProjectRoot, getPackageRoot } from './lib/paths.mjs';

const PROJECT_ROOT = getProjectRoot();
const PACKAGE_ROOT = getPackageRoot();

/** Ruta de recurso: proyecto primero, luego plantillas del paquete (npx). */
function resolveBundledPath(relOrAbs) {
  if (path.isAbsolute(relOrAbs)) return relOrAbs;
  const inProject = path.join(PROJECT_ROOT, relOrAbs);
  if (fs.existsSync(inProject)) return inProject;
  return path.join(PACKAGE_ROOT, relOrAbs);
}

/** Resuelve ruta solo bajo PROJECT_ROOT (anti path traversal). */
function resolveSafeUnderRepo(relOrAbs) {
  const resolved = path.isAbsolute(relOrAbs)
    ? path.resolve(relOrAbs)
    : path.resolve(PROJECT_ROOT, relOrAbs);
  const rootResolved = path.resolve(PROJECT_ROOT);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error('data_path fuera del repositorio');
  }
  return resolved;
}

/** Slug de change (sin .. ni absolutos); alineado con verify-change.mjs. */
function assertSafeChangeSlug(slug) {
  if (!slug || typeof slug !== 'string') throw new Error('change_slug inválido');
  const norm = slug.replace(/\\/g, '/').trim();
  if (!norm) throw new Error('change_slug vacío');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) {
    throw new Error('change_slug no puede ser ruta absoluta');
  }
  const parts = norm.split('/').filter((p) => p.length > 0);
  if (parts.some((p) => p === '.' || p === '..')) {
    throw new Error('change_slug contiene segmentos no permitidos');
  }
}

function loadManifest(manifestPath) {
  const abs = path.isAbsolute(manifestPath)
    ? manifestPath
    : resolveBundledPath(manifestPath);
  if (!fs.existsSync(abs)) {
    console.error('Manifiesto no encontrado:', abs);
    process.exit(1);
  }
  return parseYaml(fs.readFileSync(abs, 'utf8'));
}

/** Ejecuta un .mjs del paquete con cwd en el proyecto (compatible con npx). */
function runPkgScript(scriptName, extraArgs = []) {
  const full = path.join(PACKAGE_ROOT, 'scripts', scriptName);
  const res = spawnSync(process.execPath, [full, ...extraArgs], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    exitCode: res.status === null ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error,
  };
}

function nodeValidateReact(dataPath, schema) {
  const res = spawnSync(
    process.execPath,
    [
      path.join(PACKAGE_ROOT, 'scripts', 'validate-react-schemas.mjs'),
      '--data',
      dataPath,
      '--schema',
      schema,
    ],
    { cwd: PROJECT_ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  return {
    exitCode: res.status === null ? 1 : res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
  };
}

/** Mapa nombre_manifiesto → (input) => resultado spawn */
const HANDLERS = {
  spec_validate: () => runPkgScript('validate-spec.mjs'),
  spec_implements: () => runPkgScript('check-spec-implements.mjs'),
  spec_validate_react: () => runPkgScript('validate-react-schemas.mjs'),
  spec_verify_report: (input) => {
    if (input.all === true) return runPkgScript('verify-change.mjs', ['--all']);
    if (!input.change_slug) throw new Error('change_slug requerido salvo all: true');
    assertSafeChangeSlug(input.change_slug);
    return runPkgScript('verify-change.mjs', [input.change_slug]);
  },
  rag_query: (input) => {
    if (!input.question) throw new Error('question requerido');
    const ragRoot = path.join(PROJECT_ROOT, 'rag');
    const script = path.join(ragRoot, 'scripts', 'query.mjs');
    if (!fs.existsSync(script)) throw new Error('rag/scripts/query.mjs no encontrado en el proyecto');
    const res = spawnSync(process.execPath, [script, input.question], {
      cwd: ragRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      exitCode: res.status === null ? 1 : res.status,
      stdout: res.stdout || '',
      stderr: res.stderr || '',
      error: res.error,
    };
  },
  rag_migrate: () => {
    const ragRoot = path.join(PROJECT_ROOT, 'rag');
    const script = path.join(ragRoot, 'scripts', 'run-migration.mjs');
    if (!fs.existsSync(script)) throw new Error('rag/scripts/run-migration.mjs no encontrado en el proyecto');
    const res = spawnSync(process.execPath, [script], {
      cwd: ragRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    return {
      exitCode: res.status === null ? 1 : res.status,
      stdout: res.stdout || '',
      stderr: res.stderr || '',
      error: res.error,
    };
  },
  memory_daemons_start: () => {
    const sh = path.join(PACKAGE_ROOT, 'scripts', 'start-memory-daemons.sh');
    if (!fs.existsSync(sh)) throw new Error('scripts/start-memory-daemons.sh no disponible en el paquete');
    const res = spawnSync('bash', [sh], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
    });
    return {
      exitCode: res.status === null ? 1 : res.status,
      stdout: res.stdout || '',
      stderr: res.stderr || '',
      error: res.error,
    };
  },
  test_implements_e2e: () => runPkgScript('e2e-spec-implements.mjs'),
  spec_validate_react_data: (input) => {
    if (!input.data_path || !input.schema) throw new Error('data_path y schema requeridos');
    const dp = resolveSafeUnderRepo(input.data_path);
    return nodeValidateReact(dp, input.schema);
  },
};

function validateInput(schema, input) {
  if (!schema || typeof schema !== 'object') return { ok: true };
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(input)) return { ok: false, errors: ajv.errorsText(validate.errors) };
  return { ok: true };
}

function preflightToolInput(name, input) {
  if (name === 'spec_verify_report') {
    if (input.all === true) return { ok: true };
    if (input.change_slug && typeof input.change_slug === 'string') {
      try {
        assertSafeChangeSlug(input.change_slug);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }
    return { ok: false, error: 'spec_verify_report requiere change_slug o all: true' };
  }
  if (name === 'spec_validate_react_data') {
    if (!input.data_path || !input.schema) {
      return { ok: false, error: 'spec_validate_react_data requiere data_path y schema' };
    }
    try {
      resolveSafeUnderRepo(input.data_path);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  return { ok: true };
}

function dryRunTool(toolDef, input) {
  const name = toolDef.name;
  if (toolDef.type !== 'exec') {
    return {
      tool: name,
      dry_run: true,
      skipped: true,
      reason: `type "${toolDef.type}"`,
    };
  }
  const vin = validateInput(toolDef.input_schema, input);
  if (!vin.ok) {
    return { tool: name, dry_run: true, input_valid: false, error: vin.errors };
  }
  const handler = HANDLERS[name];
  if (!handler) {
    return { tool: name, dry_run: true, handler: false, error: 'sin HANDLERS' };
  }
  const pre = preflightToolInput(name, input);
  if (!pre.ok) {
    return { tool: name, dry_run: true, input_valid: false, error: pre.error };
  }
  return { tool: name, dry_run: true, input_valid: true, handler: true, would_execute: name };
}

function runTool(toolDef, input, policies) {
  const name = toolDef.name;
  if (toolDef.type !== 'exec') {
    return {
      tool: name,
      skipped: true,
      reason: `type "${toolDef.type}" no ejecutable en react-runner CLI`,
      exitCode: 0,
    };
  }
  const vin = validateInput(toolDef.input_schema, input);
  if (!vin.ok) {
    return { tool: name, exitCode: 1, error: `input_schema: ${vin.errors}` };
  }
  const pre = preflightToolInput(name, input);
  if (!pre.ok) {
    return { tool: name, exitCode: 1, error: pre.error };
  }
  const handler = HANDLERS[name];
  if (!handler) {
    return {
      tool: name,
      exitCode: 1,
      error: 'sin handler en scripts/react-runner.mjs (HANDLERS) — ampliar código',
    };
  }
  const started = Date.now();
  let out;
  try {
    out = handler(input);
  } catch (e) {
    return { tool: name, exitCode: 1, error: e.message };
  }
  const duration_ms = Date.now() - started;
  return {
    tool: name,
    exitCode: out.exitCode,
    stdout_tail: (out.stdout || '').slice(-6000),
    stderr_tail: (out.stderr || '').slice(-6000),
    duration_ms,
  };
}

function parseCli() {
  const argv = process.argv.slice(2);
  let manifestRel = 'openspec/tools-manifest.yaml';
  let maxIter = 25;
  let planPath = null;
  let useStdin = false;
  let dryRun = false;
  let listTools = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--manifest' && argv[i + 1]) manifestRel = argv[++i];
    else if (argv[i] === '--max-iterations' && argv[i + 1]) maxIter = parseInt(argv[++i], 10);
    else if (argv[i] === '--plan' && argv[i + 1]) planPath = argv[++i];
    else if (argv[i] === '--stdin') useStdin = true;
    else if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i] === '--list-tools') listTools = true;
  }
  return { manifestRel, maxIter, planPath, useStdin, dryRun, listTools };
}

function loadActions(planPath, useStdin) {
  if (planPath) {
    const p = path.isAbsolute(planPath) ? planPath : resolveBundledPath(planPath);
    const actions = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(actions)) {
      console.error('--plan debe ser un JSON array de { "tool", "input" }');
      process.exit(1);
    }
    return actions;
  }
  if (useStdin) {
    const raw = fs.readFileSync(0, 'utf8').trim();
    if (!raw) {
      console.error('stdin vacío');
      process.exit(1);
    }
    const actions = [];
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      actions.push(JSON.parse(t));
    }
    return actions;
  }
  console.error(
    'Uso: node scripts/react-runner.mjs --plan <plan.json>\n' +
      '  o: echo \'{"tool":"spec_validate","input":{}}\' | node scripts/react-runner.mjs --stdin',
  );
  process.exit(1);
}

function main() {
  const { manifestRel, maxIter, planPath, useStdin, dryRun, listTools } = parseCli();
  const manifest = loadManifest(manifestRel);

  if (listTools) {
    const tools = (manifest.tools || []).map((t) => ({
      name: t.name,
      type: t.type,
      description: t.description,
      risk: t.risk,
      optional: t.optional,
    }));
    console.log(
      JSON.stringify({ policies: manifest.policies ?? {}, tools }, null, 2),
    );
    process.exit(0);
  }

  const policies = manifest.policies || {};
  const cap = Math.min(Number.isFinite(maxIter) ? maxIter : 25, policies.max_tool_iterations ?? 25);

  const actions = loadActions(planPath, useStdin);
  if (actions.length > cap) {
    console.error(`Plan: ${actions.length} acciones > límite ${cap} (max_tool_iterations / --max-iterations)`);
    process.exit(1);
  }

  const toolMap = new Map((manifest.tools || []).map((t) => [t.name, t]));
  const observations = [];
  let stopHard = false;

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i];
    if (act && act.done === true) break;
    const toolName = act.tool;
    const spec = toolMap.get(toolName);
    if (!spec) {
      observations.push({ iteration: i, error: `herramienta desconocida: ${toolName}` });
      stopHard = policies.stop_on_first_hard_fail === true;
      if (stopHard) break;
      continue;
    }
    const obs = dryRun
      ? dryRunTool(spec, act.input || {})
      : runTool(spec, act.input || {}, policies);
    observations.push({ iteration: i, ...obs });
    if (
      !dryRun &&
      obs.exitCode !== 0 &&
      policies.stop_on_first_hard_fail === true
    ) {
      stopHard = true;
      break;
    }
  }

  const summary = {
    react_runner_schema: 1,
    dry_run: dryRun,
    manifest: manifestRel,
    iterations_executed: observations.length,
    stopped_early: stopHard,
    observations,
  };
  console.log(JSON.stringify(summary, null, 2));

  const anyFail = observations.some((o) => {
    if (dryRun) {
      return Boolean(o.error || o.handler === false || o.input_valid === false);
    }
    return (o.exitCode !== undefined && o.exitCode !== 0) || Boolean(o.error);
  });
  process.exit(anyFail ? 1 : 0);
}

main();

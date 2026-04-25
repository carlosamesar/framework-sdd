#!/usr/bin/env node
/**
 * ============================================================================
 * FRAMEWORK-SDD: Deterministic Evidence Pipeline (Phase 1)
 * ============================================================================
 * Orchestrates lifecycle gates without LLM:
 *   implement -> test -> review -> verify -> release
 *
 * It can run in two modes:
 * 1) Check-only (default): evaluates current evidence and reports block reason.
 * 2) Auto-capture: optionally captures missing evidence from provided payload flags.
 *
 * Usage:
 *   node scripts/run-pipeline.mjs --change=<slug> [options]
 *
 * Options:
 *   --task=<id>                    Task id for generated evidence (default: change)
 *   --threshold=<n>                Certification threshold (default: 95)
 *   --auto-capture                 Capture missing evidence when payload exists
 *
 *   --code-title=...               Payload for code evidence
 *   --code-description=...
 *
 *   --test-title=...               Payload for test evidence
 *   --test-description=...
 *   --test-passed=true|false
 *
 *   --review-title=...             Payload for review decision evidence
 *   --review-description=...
 *   --review-decision=approve|request-changes|comment
 *
 *   --verify-title=...             Payload for verification evidence
 *   --verify-description=...
 *   --verify-passed=true|false
 *
 *   --deploy-title=...             Payload for deployment evidence
 *   --deploy-description=...
 *   --deploy-status=success|failed|rolled-back
 *
 *   --notify-slack                 Send final status to Slack Incoming Webhook
 *   --notify-slack-progress        Send intermediate phase updates to Slack
 *   --notify-slack-progress-response-url  Also send progress updates to slash response_url (default: false)
 *   --slack-webhook-url=...        Optional webhook override (or SLACK_WEBHOOK_URL env)
 *   --slack-channel=...            Optional channel override
 *   --slack-username=...           Optional bot display name
 *   --slack-dry-run                Render payload without sending
 *   --notify-strict                Exit non-zero if Slack notify fails
 *   --slack-response-url=...        Post full audit report to Slack slash command response_url
 *
 *   --json                         Machine-readable output
 * ============================================================================
 */

import path from 'path';
import { spawnSync } from 'child_process';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const RAG_DIR = path.join(WORKSPACE_ROOT, 'rag');
const DB_PATH = path.join(WORKSPACE_ROOT, '.data', 'framework-sdd-audit.db');

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq > -1) {
      const key = arg.substring(2, eq);
      const raw = arg.substring(eq + 1);
      if (raw === 'true') opts[key] = true;
      else if (raw === 'false') opts[key] = false;
      else opts[key] = raw;
    } else {
      opts[arg.substring(2)] = true;
    }
  }
  return opts;
}

function runNodeScript(scriptName, args) {
  const result = spawnSync('node', [path.join(RAG_DIR, 'scripts', scriptName), ...args], {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf-8'
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function openDb() {
  return new Database(DB_PATH, { readonly: true });
}

function buildE2eOrSmokeSql(alias = 'evidence') {
  return `(
    lower(coalesce(json_extract(${alias}.metadata, '$.test_kind'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_type'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_level'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.suite_type'), '')) IN ('e2e', 'smoke')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.framework'), '')) IN ('playwright', 'supertest')
    OR lower(coalesce(json_extract(${alias}.metadata, '$.title'), '')) LIKE '%e2e%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.title'), '')) LIKE '%smoke%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_name'), '')) LIKE '%e2e%'
    OR lower(coalesce(json_extract(${alias}.metadata, '$.test_name'), '')) LIKE '%smoke%'
    OR lower(coalesce(${alias}.content, '')) LIKE '%e2e%'
    OR lower(coalesce(${alias}.content, '')) LIKE '%smoke%'
  )`;
}

function getCounters(db, changeSlug) {
  const q = (sql, ...params) => db.prepare(sql).get(...params).cnt;
  const e2eOrSmokeSql = buildE2eOrSmokeSql('evidence');

  return {
    code: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ? AND artifact_type = 'code'`,
      changeSlug
    ),
    testPassed: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ?
         AND artifact_type = 'test'
         AND json_extract(metadata, '$.passed') = 1`,
      changeSlug
    ),
    testE2ePassed: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ?
         AND artifact_type = 'test'
         AND json_extract(metadata, '$.passed') = 1
         AND ${e2eOrSmokeSql}`,
      changeSlug
    ),
    reviewApproved: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ?
         AND artifact_type = 'review_decision'
         AND json_extract(metadata, '$.decision') = 'approve'`,
      changeSlug
    ),
    verifyPassed: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ?
         AND artifact_type IN ('verification', 'verification_matrix')
         AND json_extract(metadata, '$.passed') = 1`,
      changeSlug
    ),
    deploySuccess: q(
      `SELECT COUNT(*) AS cnt FROM evidence
       WHERE change_slug = ?
         AND artifact_type = 'deployment_report'
         AND json_extract(metadata, '$.status') = 'success'`,
      changeSlug
    )
  };
}

function getEvidenceDetail(db, changeSlug, artifactType, filter = null) {
  let sql = `
    SELECT id, artifact_type, task_id, created_at, metadata
    FROM evidence
    WHERE change_slug = ? AND artifact_type = ?
  `;
  const params = [changeSlug, artifactType];

  if (filter) {
    if (filter.passed !== undefined) {
      sql += ` AND json_extract(metadata, '$.passed') = ?`;
      params.push(filter.passed ? 1 : 0);
    }
    if (filter.e2eOrSmoke === true) {
      sql += ` AND ${buildE2eOrSmokeSql('evidence')}`;
    }
    if (filter.decision) {
      sql += ` AND json_extract(metadata, '$.decision') = ?`;
      params.push(filter.decision);
    }
    if (filter.status) {
      sql += ` AND json_extract(metadata, '$.status') = ?`;
      params.push(filter.status);
    }
  }

  sql += ` ORDER BY created_at DESC LIMIT 10`;

  return db.prepare(sql).all(...params);
}

function formatEvidenceDetail(evidenceRows) {
  if (!evidenceRows || evidenceRows.length === 0) return '';

  return evidenceRows.map((e) => {
    const meta = e.metadata ? JSON.parse(e.metadata) : {};
    const title = meta.title || e.artifact_type;
    const detail = [
      `  *${title}* (ID: ${e.id.slice(0, 8)}...)`,
      `    Capturado: ${e.created_at.slice(0, 19)}`,
      meta.decision ? `    Decision: ${meta.decision}` : '',
      meta.status ? `    Status: ${meta.status}` : '',
      meta.passed !== undefined ? `    Resultado: ${meta.passed ? 'PASSED' : 'FAILED'}` : ''
    ].filter(Boolean).join('\n');
    return detail;
  }).join('\n');
}

function block(phase, reason, counters, transitions) {
  return {
    status: 'blocked',
    current_phase: phase,
    reason,
    counters,
    transitions,
    certified: false,
    score: null
  };
}

function appendTransition(transitions, from, to, decision) {
  transitions.push({ from, to, decision });
}

function buildPanoramicSummary(changeSlug, threshold, counters, transitions, certified, score, gatesPassedNames) {
  // Goal: what we were trying to achieve
  const goal = `Certificar el cambio "${changeSlug}" mediante el pipeline determinístico Framework-SDD, validando todos los gates (implement → test → review → verify → release) y alcanzando un maturity score ≥ ${threshold}%.`;

  // Instructions: what should be done
  const instructions = [
    '- Ejecutar todos los gates del pipeline: implement, test, review, verify, release',
    '- Capturar evidencia en cada gate (artifacts)',
    '- Vectorizar la evidencia registrada',
    '- Calcular maturity score y comparar contra umbral',
    '- Certificar el cambio si score ≥ ' + threshold + '%'
  ].join('\n');

  // Discoveries: what we found (concrete findings)
  const discoveries = [
    `Estado de evidencia:`,
    `- Artefactos code: ${counters.code}`,
    `- Tests passed: ${counters.testPassed}`,
    `- Tests e2e/smoke passed: ${counters.testE2ePassed}`,
    `- Reviews approved: ${counters.reviewApproved}`,
    `- Verifications passed: ${counters.verifyPassed}`,
    `- Deployments successful: ${counters.deploySuccess}`,
    ``,
    `Gates completados: ${gatesPassedNames.length > 0 ? gatesPassedNames.join(' → ') : 'ninguno'}`,
    ``,
    `Resultado final:`,
    certified ? `- Score: ${score}% (≥ ${threshold}% requerido) ✅ CERTIFICADO` : `- Score: ${score != null ? score + '%' : 'n/a'} (< ${threshold}% requerido) ❌ NO CERTIFICADO`,
    `- Flujo completado: ${gatesPassedNames.join(' → ')}`
  ].join('\n');

  // Accomplished: what we achieved
  const accomplished = [];
  if (counters.code > 0) accomplished.push(`✅ Code evidence captured: ${counters.code} artifact(s)`);
  if (counters.testPassed > 0) accomplished.push(`✅ Tests executed and passed: ${counters.testPassed} result(s)`);
  if (counters.testE2ePassed > 0) accomplished.push(`✅ E2E/smoke tests passed: ${counters.testE2ePassed} result(s)`);
  if (counters.reviewApproved > 0) accomplished.push(`✅ Code review approved: ${counters.reviewApproved} decision(s)`);
  if (counters.verifyPassed > 0) accomplished.push(`✅ Verification completed: ${counters.verifyPassed} result(s)`);
  if (counters.deploySuccess > 0) accomplished.push(`✅ Deployment successful: ${counters.deploySuccess} report(s)`);
  if (certified) {
    accomplished.push(`✅ Change certified with score ${score}%`);
  } else {
    accomplished.push(`⚠️ Score ${score != null ? score + '%' : 'n/a'} below threshold ${threshold}%`);
  }

  // Relevant files/paths (in SQLite evidence table)
  const relevantFiles = [
    `Evidence Database: .data/framework-sdd-audit.db`,
    `Change slug: ${changeSlug}`,
    `Query evidence: SELECT * FROM evidence WHERE change_slug = '${changeSlug}'`
  ].join('\n');

  // Next steps: what to do next
  let nextSteps;
  if (certified) {
    nextSteps = [
      '1. Archive the change and close the certification cycle',
      '2. Deploy changes to production if gates all passed',
      '3. Run next change cycle or close the session'
    ].join('\n');
  } else {
    nextSteps = [
      '1. Identify which gates are failing or have insufficient evidence',
      '2. Capture missing artifacts or improve quality of existing evidence',
      '3. Re-run the pipeline with updated evidence'
    ].join('\n');
  }

  return {
    goal,
    instructions,
    discoveries,
    accomplished: accomplished.join('\n'),
    relevant_files: relevantFiles,
    next_steps: nextSteps
  };
}

function buildPanorama(changeSlug, threshold, counters) {
  return [
    `Estoy recorriendo el flujo completo del cambio ${changeSlug}.`,
    `El pipeline exige pasar implement -> test -> review -> verify -> release y alcanzar ${threshold}% de score final.`,
    `Hasta este momento veo: codigo=${counters.code}, tests_ok=${counters.testPassed}, tests_e2e_ok=${counters.testE2ePassed}, review_ok=${counters.reviewApproved}, verify_ok=${counters.verifyPassed}, deploy_ok=${counters.deploySuccess}.`
  ].join(' ');
}

function buildCompleted(counters) {
  const completed = [];
  if (counters.code > 0) completed.push('implement');
  if (counters.testPassed > 0 && counters.testE2ePassed > 0) completed.push('test');
  if (counters.reviewApproved > 0) completed.push('review');
  if (counters.verifyPassed > 0) completed.push('verify');
  if (counters.deploySuccess > 0) completed.push('release');
  return completed.length > 0
    ? completed.join(' -> ')
    : 'Aun no hay gates aprobados; estoy empezando la validacion.';
}

function captureGeneric(type, changeSlug, taskId, title, description, metadata) {
  const args = [
    '--type=' + type,
    '--change=' + changeSlug,
    '--task=' + taskId,
    '--title=' + (title || type),
    '--description=' + (description || title || type),
    '--metadata=' + JSON.stringify(metadata || {})
  ];
  return runNodeScript('capture-evidence.mjs', args);
}

function autoCaptureMissing(opts, changeSlug, taskId, counters) {
  const logs = [];

  if (opts['auto-capture'] !== true) {
    return logs;
  }

  if (counters.code === 0 && (opts['code-title'] || opts['code-description'])) {
    const r = captureGeneric(
      'code',
      changeSlug,
      taskId,
      opts['code-title'],
      opts['code-description'],
      { phase: '/gd:implement' }
    );
    logs.push({ step: 'capture-code', ok: r.ok, stdout: r.stdout.trim(), stderr: r.stderr.trim() });
  }

  if (counters.testPassed === 0 && (opts['test-title'] || opts['test-description'])) {
    const passed = opts['test-passed'] !== false;
    const r = captureGeneric(
      'test',
      changeSlug,
      taskId,
      opts['test-title'],
      opts['test-description'],
      {
        passed,
        phase: '/gd:test',
        test_kind: opts['test-kind'],
        framework: opts['test-framework'],
      }
    );
    logs.push({ step: 'capture-test', ok: r.ok, stdout: r.stdout.trim(), stderr: r.stderr.trim() });
  }

  if (counters.reviewApproved === 0 && (opts['review-title'] || opts['review-description'])) {
    const decision = opts['review-decision'] || 'approve';
    const r = captureGeneric(
      'review_decision',
      changeSlug,
      taskId,
      opts['review-title'],
      opts['review-description'],
      { decision, phase: '/gd:review' }
    );
    logs.push({ step: 'capture-review', ok: r.ok, stdout: r.stdout.trim(), stderr: r.stderr.trim() });
  }

  if (counters.verifyPassed === 0 && (opts['verify-title'] || opts['verify-description'])) {
    const passed = opts['verify-passed'] !== false;
    const r = captureGeneric(
      'verification',
      changeSlug,
      taskId,
      opts['verify-title'],
      opts['verify-description'],
      { passed, phase: '/gd:verify' }
    );
    logs.push({ step: 'capture-verify', ok: r.ok, stdout: r.stdout.trim(), stderr: r.stderr.trim() });
  }

  if (counters.deploySuccess === 0 && (opts['deploy-title'] || opts['deploy-description'])) {
    const status = opts['deploy-status'] || 'success';
    const r = captureGeneric(
      'deployment_report',
      changeSlug,
      taskId,
      opts['deploy-title'],
      opts['deploy-description'],
      { status, phase: '/gd:release' }
    );
    logs.push({ step: 'capture-deploy', ok: r.ok, stdout: r.stdout.trim(), stderr: r.stderr.trim() });
  }

  return logs;
}

function runCertification(changeSlug, threshold) {
  const vectorize = runNodeScript('vectorize.mjs', ['--change=' + changeSlug]);
  const score = runNodeScript('maturity-score.mjs', [
    '--change=' + changeSlug,
    '--threshold=' + String(threshold),
    '--json'
  ]);

  let scoreValue = null;
  let certified = false;

  if (score.ok && score.stdout.trim()) {
    try {
      const parsed = JSON.parse(score.stdout);
      if (Array.isArray(parsed) && parsed.length > 0) {
        scoreValue = parsed[0].score;
        certified = parsed[0].certified === true;
      }
    } catch {
      certified = false;
    }
  }

  return {
    vectorize,
    score,
    scoreValue,
    certified
  };
}

function notifySlackEvent(opts, event, webhookOverride) {
  if (opts['notify-slack'] !== true) {
    return null;
  }

  const webhookUrl = webhookOverride || opts['slack-webhook-url'];

  // Build payload with all event details preserved (including multiline content)
  const payload = {
    title: event.title || 'Framework-SDD pipeline',
    status: event.status || 'info',
    change: event.change || opts.change || 'n/a',
    phase: event.phase || 'n/a',
    score: event.score != null ? String(event.score) : 'n/a',
    reason: event.reason || '',
    overview: event.overview || '',
    completed: event.completed || '',
    doing: event.doing || '',
    how: event.how || '',
    next: event.next || '',
    message: event.message || '',
    'compact-progress': event.compactProgress !== false,
    'webhook-url': webhookUrl || '',
    channel: opts['slack-channel'] || '',
    username: opts['slack-username'] || '',
    'dry-run': opts['slack-dry-run'] === true
  };

  const proc = spawnSync('node', [path.join(RAG_DIR, 'scripts', 'notify-slack.mjs')], {
    cwd: WORKSPACE_ROOT,
    input: JSON.stringify(payload),
    encoding: 'utf-8'
  });

  return {
    event: event.event || 'update',
    requested: true,
    ok: proc.status === 0,
    status: proc.status,
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim()
  };
}

function notifySlackResponseUrl(opts, event) {
  const responseUrl = opts['slack-response-url'];
  if (!responseUrl) return null;
  return notifySlackEvent(opts, event, responseUrl);
}

function shouldNotifySlackProgress(opts) {
  return opts['notify-slack'] === true && opts['notify-slack-progress'] === true;
}

function shouldNotifySlackProgressToResponseUrl(opts) {
  return opts['notify-slack-progress-response-url'] === true;
}

function evaluatePipeline(opts) {
  const changeSlug = opts.change;
  if (!changeSlug) {
    console.error('Missing required option: --change=<slug>');
    process.exit(1);
  }

  const taskId = opts.task || changeSlug;
  const threshold = parseInt(opts.threshold || '95', 10);
  const transitions = [];
  const slackProgress = [];
  const gatesPassed = [];  // Track which gates passed

  const pushProgress = (event) => {
    if (!shouldNotifySlackProgress(opts)) {
      return;
    }
    // Send to Incoming Webhook (channel real-time trace)
    const sent = notifySlackEvent(opts, event);
    if (sent) slackProgress.push(sent);
    // Optionally mirror progress updates to response_url (disabled by default to avoid duplicates)
    if (shouldNotifySlackProgressToResponseUrl(opts)) {
      notifySlackResponseUrl(opts, event);
    }
  };

  let db = openDb();
  let counters = getCounters(db, changeSlug);
  db.close();

  const captureLogs = autoCaptureMissing(opts, changeSlug, taskId, counters);

  if (captureLogs.length > 0) {
    db = openDb();
    counters = getCounters(db, changeSlug);
    db.close();
  }

  // Helper function to load and format evidence details
  const getGateDetail = (artifactType, filter = null) => {
    db = openDb();
    const rows = getEvidenceDetail(db, changeSlug, artifactType, filter);
    db.close();
    return formatEvidenceDetail(rows);
  };

  pushProgress({
    event: 'pipeline-start',
    title: 'Framework-SDD pipeline iniciado',
    status: 'info',
    phase: '/gd:start',
    reason: 'Ejecución del pipeline iniciada',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Estoy preparando la evaluación completa del cambio y revisando la evidencia que ya existe.',
    how: 'Leí la base de auditoría, calculé contadores por gate y, si faltaba algo básico, ejecuté auto-captura antes de empezar a decidir.',
    next: 'Ahora voy a entrar a implement para confirmar si hay base suficiente de evidencia técnica.',
    message: `Change: *${changeSlug}* | Umbral: ${threshold}%\nEvaluando gates: implement → test → review → verify → release`
  });

  appendTransition(transitions, '/gd:start', '/gd:implement', 'enter');
  if (counters.code === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:implement',
      reason: 'Missing code evidence',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en implement porque no encontré evidencia de código.',
      how: 'Consultré la base de auditoría buscando artefactos `code` para este slug y el contador quedó en 0.',
      next: 'Capturar evidencia de código (commit, diff, o descripción técnica) o volver a ejecutar con auto-captura correctamente configurada.',
      message: 'Pipeline stopped at implement gate.'
    });
    return {
      ...block('/gd:implement', 'Missing code evidence', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  const codeDetail = getGateDetail('code');
  gatesPassed.push('implement');
  pushProgress({
    event: 'implement-pass',
    title: ':white_check_mark: Gate implement — OK',
    status: 'info',
    phase: '/gd:implement',
    reason: 'Evidencia de código detectada',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Validé el gate de implement y confirmé que el cambio tiene base técnica de código.',
    how: `Encontré ${counters.code} artefacto(s) de tipo 'code' registrado(s) en la auditoría. Los detalles:\n${codeDetail}`,
    next: 'Pasar a test para comprobar que las pruebas quedaron ejecutadas y aprobadas.',
    message: `Evidencia de código encontrada: *${counters.code}* artefacto(s) confirmado(s).`
  });

  appendTransition(transitions, '/gd:implement', '/gd:test', 'code-evidence-present');
  if (counters.testPassed === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:test',
      reason: 'No passing test evidence',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en test porque no encontré pruebas aprobadas.',
      how: 'Busqué artefactos `test` con `metadata.passed = true` en la base de auditoría y el contador quedó en 0.',
      next: 'Ejecutar pruebas completas del módulo, capturar el resultado y relanzar el pipeline.',
      message: 'Pipeline stopped at test gate.'
    });
    return {
      ...block('/gd:test', 'No passing test evidence', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  if (counters.testE2ePassed === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:test',
      reason: 'No passing e2e/smoke evidence',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en test porque no encontré evidencia aprobada de pruebas e2e o smoke para certificar.',
      how: 'Busqué artefactos `test` con `metadata.passed = true` y clasificación `e2e`/`smoke` en metadata, título, test_name o content; el contador quedó en 0.',
      next: 'Ejecutar y capturar pruebas e2e/smoke reales con metadata `test_kind=e2e|smoke` o framework Playwright/Supertest, y relanzar el pipeline.',
      message: 'Pipeline stopped at test gate: missing e2e/smoke proof.'
    });
    return {
      ...block('/gd:test', 'No passing e2e/smoke evidence', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  const testDetail = getGateDetail('test', { passed: true, e2eOrSmoke: true });
  gatesPassed.push('test');
  pushProgress({
    event: 'test-pass',
    title: ':white_check_mark: Gate test — OK',
    status: 'info',
    phase: '/gd:test',
    reason: 'Pruebas e2e/smoke con resultado passed detectadas',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Confirmé que la certificación tiene pruebas e2e/smoke reales registradas y marcadas como exitosas.',
    how: `Consulté la base de auditoría y encontré ${counters.testE2ePassed} artefacto(s) de tipo 'test' con bandera 'passed=true' y clasificación e2e/smoke. Los detalles:\n${testDetail}`,
    next: 'Pasar a review para verificar la aprobación formal de los cambios.',
    message: `Tests e2e/smoke passed: *${counters.testE2ePassed}* artefacto(s) encontrado(s) y validado(s).`
  });

  appendTransition(transitions, '/gd:test', '/gd:review', 'tests-passed');
  if (counters.reviewApproved === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:review',
      reason: 'No approved review decision',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en review porque no existe una decisión aprobada.',
      how: 'Consulté artefactos `review_decision` con `decision=approve` en la base de auditoría y no encontré coincidencias.',
      next: 'Registrar una revisión con aprobación explícita o corregir el cambio y repetir la validación.',
      message: 'Pipeline stopped at review gate.'
    });
    return {
      ...block('/gd:review', 'No approved review decision', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  const reviewDetail = getGateDetail('review_decision', { decision: 'approve' });
  gatesPassed.push('review');
  pushProgress({
    event: 'review-pass',
    title: ':white_check_mark: Gate review — OK',
    status: 'info',
    phase: '/gd:review',
    reason: 'Decisión de revisión aprobada',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Verifiqué que el cambio pasó la revisión de código con aprobación formal.',
    how: `Encontré ${counters.reviewApproved} artefacto(s) de tipo 'review_decision' con 'decision=approve' registrado(s). Los detalles:\n${reviewDetail}`,
    next: 'Pasar a verify para revisar la evidencia de verificación técnica completa.',
    message: `Reviews aprobados: *${counters.reviewApproved}* encontrado(s) y validado(s).`
  });

  appendTransition(transitions, '/gd:review', '/gd:verify', 'review-approved');
  if (counters.verifyPassed === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:verify',
      reason: 'No passing verification evidence',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en verify porque no encontré evidencia de verificación técnica aprobada.',
      how: 'Consulté artefactos de tipo \'verification\' o \'verification_matrix\' con \'passed=true\' y el contador quedó en 0.',
      next: 'Capturar la verificación técnica completa (matriz de verificación o e2e) y relanzar el pipeline.',
      message: 'Pipeline stopped at verify gate.'
    });
    return {
      ...block('/gd:verify', 'No passing verification evidence', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  const verifyDetail = getGateDetail('verification_matrix', { passed: true }) || getGateDetail('verification', { passed: true });
  gatesPassed.push('verify');
  pushProgress({
    event: 'verify-pass',
    title: ':white_check_mark: Gate verify — OK',
    status: 'info',
    phase: '/gd:verify',
    reason: 'Verificación con resultado passed detectada',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Confirmé que la verificación técnica del cambio pasó todas las validaciones requeridas.',
    how: `Encontré ${counters.verifyPassed} artefacto(s) de verificación con resultado 'passed'. Los detalles:\n${verifyDetail}`,
    next: 'Entrar al gate /gd:release (esto no es una rama git) para validar evidencia de despliegue exitoso.',
    message: `Verificaciones satisfactorias: *${counters.verifyPassed}* encontrado(s) y aprobado(s).`
  });

  appendTransition(transitions, '/gd:verify', '/gd:release', 'verification-passed');
  if (counters.deploySuccess === 0) {
    pushProgress({
      event: 'pipeline-blocked',
      title: 'Framework-SDD pipeline (blocked)',
      status: 'blocked',
      phase: '/gd:release',
      reason: 'No successful deployment report',
      overview: buildPanorama(changeSlug, threshold, counters),
      completed: buildCompleted(counters),
      doing: 'Detuve el pipeline en release porque no hay evidencia de que el deploy fue exitoso.',
      how: 'Consulté artefactos `deployment_report` con `status=success` en la auditoría y no encontré registros.',
      next: 'Ejecutar el despliegue a producción, capturar el resultado exitoso y relanzar el pipeline.',
      message: 'Pipeline stopped at release gate.'
    });
    return {
      ...block('/gd:release', 'No successful deployment report', counters, transitions),
      capture_logs: captureLogs,
      slack_progress: slackProgress
    };
  }

  const deployDetail = getGateDetail('deployment_report', { status: 'success' });
  gatesPassed.push('release');
  pushProgress({
    event: 'release-pass',
    title: ':white_check_mark: Gate release — OK',
    status: 'info',
    phase: '/gd:release',
    reason: 'Deployment report con status success detectado',
    overview: buildPanorama(changeSlug, threshold, counters),
    completed: buildCompleted(counters),
    doing: 'Validé que el despliegue a producción fue completado y reportado como exitoso.',
    how: `Encontré ${counters.deploySuccess} reporte(s) de despliegue con 'status=success'. Los detalles:\n${deployDetail}`,
    next: 'Ahora ejecutar vectorización y cálculo de maturity score para decidir si el cambio se certifica.',
    message: `Deployments exitosos confirmado(s): *${counters.deploySuccess}* artefacto(s) registrado(s).`
  });

  const cert = runCertification(changeSlug, threshold);
  appendTransition(transitions, '/gd:release', cert.certified ? 'end' : '/gd:review', cert.certified ? 'certified' : 'insufficient-score');

  // Build panoramic summary for final message
  const panoramicSummary = buildPanoramicSummary(changeSlug, threshold, counters, transitions, cert.certified, cert.scoreValue, gatesPassed);

  pushProgress({
    event: cert.certified ? 'certified' : 'score-blocked',
    title: cert.certified ? ':trophy: Framework-SDD — CERTIFICADO' : ':warning: Framework-SDD — Score insuficiente',
    status: cert.certified ? 'certified' : 'blocked',
    phase: cert.certified ? 'end' : '/gd:review',
    score: cert.scoreValue,
    reason: cert.certified ? 'Pipeline completado y certificado' : 'Score por debajo del umbral',
    overview: `## Goal\n${panoramicSummary.goal}`,
    completed: `## Discoveries\n${panoramicSummary.discoveries}`,
    doing: `## Accomplished\n${panoramicSummary.accomplished}`,
    how: `## Relevant Files\n${panoramicSummary.relevant_files}`,
    next: `## Next Steps\n${panoramicSummary.next_steps}`,
    message: [
      `Score: ${cert.scoreValue != null ? cert.scoreValue + '%' : 'n/a'} (umbral: ${threshold}%)`,
      cert.certified ? ':white_check_mark: Certificación completa.' : ':x: No se alcanzó el umbral de certificación.'
    ].join('\n')
  });

  return {
    status: cert.certified ? 'certified' : 'blocked',
    current_phase: cert.certified ? 'end' : '/gd:review',
    reason: cert.certified ? 'Pipeline completed and certified' : 'Certification threshold not reached',
    counters,
    transitions,
    certified: cert.certified,
    score: cert.scoreValue,
    threshold,
    capture_logs: captureLogs,
    vectorize: {
      ok: cert.vectorize.ok,
      status: cert.vectorize.status,
      stdout: cert.vectorize.stdout.trim(),
      stderr: cert.vectorize.stderr.trim()
    },
    score_cmd: {
      ok: cert.score.ok,
      status: cert.score.status,
      stdout: cert.score.stdout.trim(),
      stderr: cert.score.stderr.trim()
    },
    slack_progress: slackProgress
  };
}

function notifySlack(result, opts) {
  if (opts['notify-slack'] !== true) {
    return null;
  }

  if (opts['notify-slack-final'] === false) {
    return null;
  }

  return notifySlackEvent(opts, {
    event: 'pipeline-final',
    title: 'Framework-SDD pipeline',
    status: result.status,
    phase: result.current_phase || 'n/a',
    score: typeof result.score === 'number' ? String(result.score) : 'n/a',
    reason: result.reason || '',
    compactProgress: false,
    message: result.certified
      ? 'Pipeline completed with certification.'
      : 'Pipeline blocked. Check reason and counters.'
  });
}

function printHuman(result) {
  console.log('============================================================');
  console.log(' Framework-SDD Deterministic Pipeline (Phase 1)');
  console.log('============================================================');
  console.log('status        :', result.status);
  console.log('current_phase :', result.current_phase);
  console.log('reason        :', result.reason);
  console.log('certified     :', result.certified);
  if (typeof result.score === 'number') {
    console.log('score         :', result.score + '%');
    console.log('threshold     :', result.threshold + '%');
  }
  console.log('counters      :', JSON.stringify(result.counters));

  if (Array.isArray(result.capture_logs) && result.capture_logs.length > 0) {
    console.log('\nCapture logs:');
    for (const item of result.capture_logs) {
      console.log(`- ${item.step}: ${item.ok ? 'ok' : 'error'}`);
      if (item.stdout) console.log(`  stdout: ${item.stdout}`);
      if (item.stderr) console.log(`  stderr: ${item.stderr}`);
    }
  }

  console.log('\nTransitions:');
  for (const t of result.transitions) {
    console.log(`- ${t.from} -> ${t.to} (${t.decision})`);
  }

  if (result.vectorize) {
    console.log('\nVectorize command:');
    console.log('- ok    :', result.vectorize.ok);
    console.log('- code  :', result.vectorize.status);
    if (result.vectorize.stdout) console.log('- stdout:', result.vectorize.stdout);
    if (result.vectorize.stderr) console.log('- stderr:', result.vectorize.stderr);
  }

  if (result.score_cmd) {
    console.log('\nScore command:');
    console.log('- ok    :', result.score_cmd.ok);
    console.log('- code  :', result.score_cmd.status);
    if (result.score_cmd.stdout) console.log('- stdout:', result.score_cmd.stdout);
    if (result.score_cmd.stderr) console.log('- stderr:', result.score_cmd.stderr);
  }

  if (result.slack_notify) {
    console.log('\nSlack notify:');
    console.log('- requested:', result.slack_notify.requested);
    console.log('- ok       :', result.slack_notify.ok);
    console.log('- code     :', result.slack_notify.status);
    if (result.slack_notify.stdout) console.log('- stdout   :', result.slack_notify.stdout);
    if (result.slack_notify.stderr) console.log('- stderr   :', result.slack_notify.stderr);
  }

  if (Array.isArray(result.slack_progress) && result.slack_progress.length > 0) {
    console.log('\nSlack progress notifications:');
    for (const event of result.slack_progress) {
      console.log(`- ${event.event}: ok=${event.ok} code=${event.status}`);
      if (event.stdout) console.log(`  stdout: ${event.stdout}`);
      if (event.stderr) console.log(`  stderr: ${event.stderr}`);
    }
  }
}

const opts = parseArgs(process.argv.slice(2));
const result = evaluatePipeline(opts);

const slackNotify = notifySlack(result, opts);
if (slackNotify) {
  result.slack_notify = slackNotify;
}

if (opts.json === true) {
  console.log(JSON.stringify(result, null, 2));
} else {
  printHuman(result);
}

if (opts['notify-strict'] === true && slackNotify && slackNotify.ok !== true) {
  process.exit(3);
}

process.exit(result.certified ? 0 : 2);

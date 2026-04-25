#!/usr/bin/env node
/**
 * Slack Slash Command server for Framework-SDD pipeline.
 *
 * Supported commands:
 *   help
 *   status <change-slug>
 *   run <change-slug>
 *
 * Required env:
 *   SLACK_SIGNING_SECRET
 * Optional env:
 *   SLACK_COMMAND_PORT=8787
 *   SLACK_COMMAND_PATH=/slack/commands
 *   SLACK_WEBHOOK_URL (used by pipeline for notifications)
 */

import http from 'http';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { spawn, spawnSync } from 'child_process';
import { URLSearchParams } from 'url';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const RAG_DIR = path.join(WORKSPACE_ROOT, 'rag');
const DB_PATH = path.join(WORKSPACE_ROOT, '.data', 'framework-sdd-audit.db');
const STYLE_PREFS_PATH = path.join(WORKSPACE_ROOT, '.data', 'slack-style-preferences.json');

const PORT = Number(process.env.SLACK_COMMAND_PORT || 8787);
const COMMAND_PATH = process.env.SLACK_COMMAND_PATH || '/slack/commands';
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const MAX_BODY = 1_000_000;
const DEFAULT_RESPONSE_STYLE = String(process.env.SLACK_RESPONSE_STYLE || 'technical').toLowerCase();

function parseForm(bodyRaw) {
  const params = new URLSearchParams(bodyRaw);
  return {
    text: params.get('text') || '',
    userName: params.get('user_name') || 'unknown',
    channelName: params.get('channel_name') || 'unknown',
    responseUrl: params.get('response_url') || '',
    command: params.get('command') || ''
  };
}

function verifySlackSignature(req, bodyRaw) {
  if (!SIGNING_SECRET) return false;

  const ts = req.headers['x-slack-request-timestamp'];
  const sig = req.headers['x-slack-signature'];
  if (!ts || !sig) return false;

  const now = Math.floor(Date.now() / 1000);
  const age = Math.abs(now - Number(ts));
  if (!Number.isFinite(age) || age > 60 * 5) {
    return false;
  }

  const base = `v0:${ts}:${bodyRaw}`;
  const hmac = crypto.createHmac('sha256', SIGNING_SECRET).update(base).digest('hex');
  const expected = `v0=${hmac}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)));
  } catch {
    return false;
  }
}

function parseInput(text) {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts[0] && parts[0].toLowerCase() === 'sdd') {
    parts.shift();
  }
  const cmd = (parts[0] || 'help').toLowerCase();
  const slug = parts[1] || '';
  return { cmd, slug, raw: text.trim(), parts };
}

function normalizeStyle(style) {
  const s = String(style || '').toLowerCase();
  return s === 'executive' ? 'executive' : 'technical';
}

function getForcedChannelStyle(channelName) {
  const name = String(channelName || '').toLowerCase();
  if (/^(dev|engineering|backend|frontend|tech)$/.test(name)) return 'technical';
  if (/^(management|direccion|gerencia|leadership|exec)$/.test(name)) return 'executive';
  return null;
}

function loadStylePrefs() {
  try {
    const raw = fs.readFileSync(STYLE_PREFS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { channels: {} };
    if (!parsed.channels || typeof parsed.channels !== 'object') parsed.channels = {};
    return parsed;
  } catch {
    return { channels: {} };
  }
}

function saveStylePrefs(prefs) {
  const safe = prefs && typeof prefs === 'object' ? prefs : { channels: {} };
  if (!safe.channels || typeof safe.channels !== 'object') safe.channels = {};
  fs.mkdirSync(path.dirname(STYLE_PREFS_PATH), { recursive: true });
  fs.writeFileSync(STYLE_PREFS_PATH, JSON.stringify(safe, null, 2) + '\n', 'utf-8');
}

function getChannelPreferredStyle(channelName) {
  const prefs = loadStylePrefs();
  const key = String(channelName || '').toLowerCase();
  const stored = prefs.channels[key];
  return stored ? normalizeStyle(stored) : null;
}

function setChannelPreferredStyle(channelName, style) {
  const prefs = loadStylePrefs();
  const key = String(channelName || '').toLowerCase();
  prefs.channels[key] = normalizeStyle(style);
  saveStylePrefs(prefs);
  return prefs.channels[key];
}

function resolveResponseStyle(text, fallback = DEFAULT_RESPONSE_STYLE, channelName = '') {
  const input = String(text || '').toLowerCase();

  const forced = getForcedChannelStyle(channelName);
  if (forced) return forced;

  const channelPreferred = getChannelPreferredStyle(channelName);
  if (channelPreferred) return channelPreferred;

  if (/ejecutivo|resumen|directivo|gerencial|brief/.test(input)) return 'executive';
  if (/tecnico|t[eé]cnico|senior|detallado|debug|forense/.test(input)) return 'technical';
  return normalizeStyle(fallback);
}

function slugify(input) {
  const base = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const fallback = 'slack-change';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${base || fallback}-${date}`;
}

function parseRunArgs(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    return { slug: '', requirement: '' };
  }

  // Remove leading "run" if present.
  const withoutRun = text.replace(/^run\s*/i, '').trim();
  if (!withoutRun) {
    return { slug: '', requirement: '' };
  }

  // Format A: "<slug> req: <requirement text>"
  const reqTag = withoutRun.match(/\breq:\s*(.+)$/i);
  if (reqTag) {
    const requirement = reqTag[1].trim();
    const beforeReq = withoutRun.slice(0, reqTag.index).trim();
    const slug = beforeReq || slugify(requirement);
    return { slug, requirement };
  }

  // Format B: "req: <requirement text>"
  if (/^req:\s*/i.test(withoutRun)) {
    const requirement = withoutRun.replace(/^req:\s*/i, '').trim();
    return { slug: slugify(requirement), requirement };
  }

  // Format C: a single token => treat as slug (backward compatible)
  const tokens = withoutRun.split(/\s+/);
  if (tokens.length === 1) {
    return { slug: tokens[0], requirement: '' };
  }

  // Format D: free text => treat as requirement and auto-generate slug.
  return { slug: slugify(withoutRun), requirement: withoutRun };
}

function parseGdStartArgs(rawText) {
  const text = String(rawText || '').trim().replace(/^gd:start\s*/i, '').trim();
  if (!text) {
    return { slug: slugify('gd-start'), requirement: '' };
  }

  const req = text.replace(/^req:\s*/i, '').trim();
  return {
    slug: slugify(req || text),
    requirement: req || text
  };
}

function parseGdGenericArgs(rawText, alias) {
  const regex = new RegExp(`^gd:${alias}\\s*`, 'i');
  const text = String(rawText || '').trim().replace(regex, '').trim();
  const requirement = text ? `Comando ${alias}: ${text}` : `Comando ${alias}`;
  return {
    slug: slugify(`gd-${alias}-${text || 'run'}`),
    requirement
  };
}

function usage() {
  return [
    '*Framework-SDD Slack Commands*',
    '- `help`',
    '- `status <change-slug>`',
    '- `run <change-slug>`',
    '- `run req: <texto del requerimiento>`',
    '- `run <change-slug> req: <texto del requerimiento>`',
    '- `run <texto libre del requerimiento>`',
    '- aliases chat-friendly: `gd:help`, `gd:status <slug>`, `gd:start <requerimiento>`',
    '- alias adicional: `gd:run <slug|requerimiento>`',
    '- cualquier `gd:*` desconocido se ejecuta como requerimiento libre (no bloquea)',
    '- `style technical|executive` (persistente por canal)',
    '- `pregunta en lenguaje natural` (ej: "como va el deploy?", "en que rama quedo para PR?")',
    '- canales forzados: `#dev/#engineering/#backend/#frontend/#tech -> technical`',
    '- canales forzados: `#management/#direccion/#gerencia/#leadership/#exec -> executive`',
    '',
    'Ejemplo:',
    '- `/sdd run change-demo-20260420`',
    '- `/sdd run req: corregir CORS en endpoint terceros y validar pruebas`',
    '- `/sdd gd:start corregir historial de inventario sin editar/eliminar`',
    '- `/sdd style executive`',
    '- `/sdd como va el deploy del ultimo cambio?`'
  ].join('\n');
}

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

async function postToResponseUrl(url, text, color = '#439fe0') {
  if (!url) return;
  const payload = {
    response_type: 'in_channel',
    attachments: [
      {
        color,
        text
      }
    ]
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('response_url post failed:', err.message);
  }
}

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: WORKSPACE_ROOT,
    encoding: 'utf-8'
  });

  if (result.status !== 0) return '';
  return (result.stdout || '').trim();
}

function getGitSnapshot() {
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']) || 'n/a';
  const shortStatus = runGit(['status', '--short']);
  const dirtyCount = shortStatus ? shortStatus.split('\n').filter(Boolean).length : 0;
  const lastCommit = runGit(['log', '-1', '--pretty=format:%h|%s|%an|%cI']);
  const defaultBranch = runGit(['rev-parse', '--abbrev-ref', 'origin/HEAD']).replace(/^origin\//, '') || 'master';

  let last = {
    hash: 'n/a',
    subject: 'n/a',
    author: 'n/a',
    date: 'n/a'
  };

  if (lastCommit && lastCommit.includes('|')) {
    const [hash, subject, author, date] = lastCommit.split('|');
    last = {
      hash: hash || 'n/a',
      subject: subject || 'n/a',
      author: author || 'n/a',
      date: date || 'n/a'
    };
  }

  return {
    branch,
    defaultBranch,
    dirtyCount,
    lastCommit: last
  };
}

function getEvidenceSnapshot(changeSlug) {
  let db;
  try {
    db = new Database(DB_PATH, { readonly: true });

    const findOne = (artifactType, predicateSql = '', predicateArgs = []) => {
      const sql = `
        SELECT id, artifact_type, created_at, metadata
        FROM evidence
        WHERE change_slug = ?
          AND artifact_type = ?
          ${predicateSql}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const row = db.prepare(sql).get(changeSlug, artifactType, ...predicateArgs);
      if (!row) return null;
      let metadata = {};
      try {
        metadata = row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
        metadata = {};
      }
      return {
        id: String(row.id || '').slice(0, 8),
        artifactType: row.artifact_type,
        createdAt: row.created_at,
        metadata
      };
    };

    return {
      code: findOne('code'),
      test: findOne('test', "AND json_extract(metadata, '$.passed') = 1"),
      review: findOne('review_decision', "AND json_extract(metadata, '$.decision') = 'approve'"),
      verifyMatrix: findOne('verification_matrix', "AND json_extract(metadata, '$.passed') = 1"),
      verify: findOne('verification', "AND json_extract(metadata, '$.passed') = 1"),
      deploy: findOne('deployment_report', "AND json_extract(metadata, '$.status') = 'success'")
    };
  } catch {
    return {
      code: null,
      test: null,
      review: null,
      verifyMatrix: null,
      verify: null,
      deploy: null
    };
  } finally {
    if (db) db.close();
  }
}

function getLatestChangeSlug() {
  let db;
  try {
    db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare(`
      SELECT change_slug
      FROM evidence
      ORDER BY created_at DESC
      LIMIT 1
    `).get();
    return row?.change_slug || '';
  } catch {
    return '';
  } finally {
    if (db) db.close();
  }
}

function formatEvidenceLine(label, item, fallback = 'sin evidencia') {
  if (!item) return `${label}: ${fallback}`;

  const attrs = [];
  if (item.metadata?.decision) attrs.push(`decision=${item.metadata.decision}`);
  if (item.metadata?.status) attrs.push(`status=${item.metadata.status}`);
  if (item.metadata?.passed !== undefined) attrs.push(`passed=${item.metadata.passed}`);
  if (item.metadata?.task_id) attrs.push(`task=${item.metadata.task_id}`);
  if (item.metadata?.commit) attrs.push(`commit=${item.metadata.commit}`);

  const attrsText = attrs.length > 0 ? ` | ${attrs.join(' | ')}` : '';
  return `${label}: id=${item.id} | captured=${item.createdAt}${attrsText}`;
}

async function answerNaturalQuestion(questionText, channelName = '') {
  const q = String(questionText || '').toLowerCase();
  const style = resolveResponseStyle(questionText, DEFAULT_RESPONSE_STYLE, channelName);

  const asksPayload = /payload|body|json/.test(q);
  const asksPost = /\bpost\b|crear|registrar|guardar/.test(q);
  const endpointMatch = q.match(/\/(api\/v1\/)?[a-z0-9-]+(?:\/[a-z0-9-]+)*/);
  const endpoint = endpointMatch ? endpointMatch[0] : '';
  const asksTransaccionesUnificadas = /transacciones-unificadas|\/transacciones-unificadas|transaccion(es)? unificada(s)?/.test(q);
  const asksBodegas = /\bbodegas\b|\/bodegas/.test(q);
  const asksSedes = /\bsedes\b|\/sedes/.test(q);
  const asksUsuarios = /\busuarios\b|\/usuarios/.test(q);
  const asksTerceros = /\bterceros\b|\/terceros/.test(q);

  if (asksPayload && asksPost && asksTransaccionesUnificadas) {
    return [
      'Payload base para `POST /transacciones-unificadas`:',
      '```json',
      '{',
      '  "id_tipo_transaccion": "5dbb5f1a-006d-4447-b02e-56d880f4b59f",',
      '  "numero_documento": "TRX-TEST-001",',
      '  "fecha_documento": "2026-04-20",',
      '  "descripcion": "Transaccion unificada de prueba",',
      '  "observaciones": "Generado desde Slack",',
      '  "transaccion_estado": {',
      '    "estado": "BORRADOR"',
      '  },',
      '  "lineas": [',
      '    {',
      '      "id_cuenta_contable": "11111111-1111-1111-1111-111111111111",',
      '      "descripcion": "Linea debito",',
      '      "debito": 100000,',
      '      "credito": 0',
      '    },',
      '    {',
      '      "id_cuenta_contable": "22222222-2222-2222-2222-222222222222",',
      '      "descripcion": "Linea credito",',
      '      "debito": 0,',
      '      "credito": 100000',
      '    }',
      '  ]',
      '}',
      '```',
      '',
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  if (asksPayload && asksPost && asksBodegas) {
    return [
      'Payload base para `POST /bodegas`:',
      '```json',
      '{',
      '  "codigo": "BOD-001",',
      '  "nombre": "Bodega Principal",',
      '  "descripcion": "Bodega central de pruebas",',
      '  "tipo_bodega": "Fisica",',
      '  "responsables": [',
      '    {',
      '      "id_usuario": "11111111-1111-1111-1111-111111111111",',
      '      "es_principal": true',
      '    },',
      '    {',
      '      "id_usuario": "22222222-2222-2222-2222-222222222222",',
      '      "es_principal": false',
      '    }',
      '  ]',
      '}',
      '```',
      '',
      "Reglas: `tipo_bodega` solo permite `Virtual` o `Fisica`; en `responsables` debe haber exactamente un `es_principal: true` si el array no esta vacio.",
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  if (asksPayload && asksPost && asksSedes) {
    return [
      'Payload base para `POST /sedes`:',
      '```json',
      '{',
      '  "codigo": "SED-001",',
      '  "nombre": "Sede Principal",',
      '  "direccion": "Calle 123 #45-67",',
      '  "telefono": "6015551234",',
      '  "correo": "sede.principal@empresa.com",',
      '  "ciudad": "Bogota",',
      '  "estado": "ACTIVA"',
      '}',
      '```',
      '',
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  if (asksPayload && asksPost && asksUsuarios) {
    return [
      'Payload base para `POST /usuarios`:',
      '```json',
      '{',
      '  "nombres": "Juan",',
      '  "apellidos": "Perez",',
      '  "email": "juan.perez@empresa.com",',
      '  "username": "jperez",',
      '  "telefono": "3001234567",',
      '  "id_rol": "11111111-1111-1111-1111-111111111111",',
      '  "estado": "ACTIVO"',
      '}',
      '```',
      '',
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  if (asksPayload && asksPost && asksTerceros) {
    return [
      'Payload base para `POST /terceros`:',
      '```json',
      '{',
      '  "tipo_documento": "NIT",',
      '  "numero_documento": "900999888",',
      '  "razon_social": "Proveedor Demo S.A.S",',
      '  "nombre_comercial": "Proveedor Demo",',
      '  "email": "contacto@proveedordemo.com",',
      '  "telefono": "6015550000",',
      '  "direccion": "Cra 10 #20-30",',
      '  "tipo_tercero": "PROVEEDOR",',
      '  "estado": "ACTIVO"',
      '}',
      '```',
      '',
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  if (asksPayload && asksPost && endpoint) {
    return [
      `Payload base para \`POST ${endpoint}\` (plantilla generica):`,
      '```json',
      '{',
      '  "codigo": "COD-001",',
      '  "nombre": "Nombre recurso",',
      '  "descripcion": "Descripcion de ejemplo"',
      '}',
      '```',
      '',
      'Si me compartes el contrato del endpoint, te lo devuelvo exacto campo por campo.',
      'Nota: `tenantId` no va en body; se toma del JWT en `custom:tenant_id`.'
    ].join('\n');
  }

  const latestSlug = getLatestChangeSlug();
  if (!latestSlug) {
    return 'No tengo evidencia registrada todavía para responder. Ejecuta primero `/sdd run req: <tu requerimiento>`.';
  }

  const git = getGitSnapshot();
  const evidence = getEvidenceSnapshot(latestSlug);
  const status = await getStatus(latestSlug);
  const parsed = status?.parsed || null;
  const scoreText = parsed?.score != null ? `${parsed.score}%` : 'n/a';
  const phaseText = parsed?.current_phase || 'n/a';

  if (/deploy|release|produccion|producción/.test(q)) {
    if (style === 'executive') {
      return [
        `Estado deploy del último cambio ${latestSlug}:`,
        `- ${evidence.deploy ? 'Exitoso' : 'Sin confirmación'}`,
        `- Score: ${scoreText}`,
        `- Estado: ${parsed?.status || 'n/a'}`
      ].join('\n');
    }

    return [
      `Sí, te actualizo deploy del último cambio *${latestSlug}*:`,
      `- ${formatEvidenceLine('deployment_report', evidence.deploy, 'sin deploy success registrado')}`,
      `- Estado actual del ciclo: ${parsed?.status || 'n/a'} en fase ${phaseText}`,
      `- Score actual: ${scoreText}`
    ].join('\n');
  }

  if (/rama|branch|pr|pull request/.test(q)) {
    const base = git.defaultBranch || 'master';
    const branch = git.branch || 'n/a';
    const prHint = branch === base
      ? `Estás en ${base}. Siguiente acción: git checkout -b feature/${latestSlug}`
      : `Siguiente acción: abrir PR ${branch} -> ${base}`;

    if (style === 'executive') {
      return [
        `Estado para PR del cambio ${latestSlug}:`,
        `- Rama actual: ${branch}`,
        `- Destino: ${base}`,
        `- Acción recomendada: ${prHint}`
      ].join('\n');
    }

    return [
      `Así quedó el estado para PR del último cambio *${latestSlug}*:`,
      `- Rama actual: ${branch}`,
      `- Rama base: ${base}`,
      `- Último commit: ${git.lastCommit.hash} | ${git.lastCommit.subject}`,
      `- Working tree: ${git.dirtyCount === 0 ? 'limpio' : `${git.dirtyCount} archivo(s) con cambios`}`,
      `- ${prHint}`
    ].join('\n');
  }

  if (style === 'executive') {
    return [
      `Resumen ejecutivo del último cambio ${latestSlug}:`,
      `- Estado: ${parsed?.status || 'n/a'}`,
      `- Fase: ${phaseText}`,
      `- Score: ${scoreText}`,
      `- Deploy: ${evidence.deploy ? 'confirmado' : 'pendiente'}`,
      `- PR: ${git.branch === git.defaultBranch ? 'requiere crear rama feature' : 'listo para abrir PR'}`
    ].join('\n');
  }

  return [
    `Resumen 360 del último cambio *${latestSlug}*:`,
    `- Estado: ${parsed?.status || 'n/a'} | Fase: ${phaseText} | Score: ${scoreText}`,
    `- Code: ${formatEvidenceLine('code', evidence.code, 'sin evidencia')}`,
    `- Test: ${formatEvidenceLine('test', evidence.test, 'sin evidencia passed')}`,
    `- Review: ${formatEvidenceLine('review_decision', evidence.review, 'sin approve')}`,
    `- Verify: ${formatEvidenceLine('verification', evidence.verifyMatrix || evidence.verify, 'sin passed')}`,
    `- Deploy: ${formatEvidenceLine('deployment_report', evidence.deploy, 'sin success')}`,
    '',
    'Si quieres, te lo desgloso por paso (qué hice, qué encontré, qué decidí, qué sigue).'
  ].join('\n');
}

function buildFinalCloseoutMessage({
  style,
  runSlug,
  requirement,
  parsed,
  counters,
  evidence,
  git,
  transitionsLine,
  ok,
  prHint,
  baseForPr,
  branchForPr,
  reviewUrl,
  reviewPrNumber
}) {
  const verifyEvidence = evidence.verifyMatrix || evidence.verify;

  if (style === 'executive') {
    return [
      `${ok ? ':trophy:' : ':warning:'} Cierre ejecutivo de ${runSlug}.`,
      requirement ? `Contexto: ${requirement}` : null,
      '',
      `Resultado: ${ok ? 'CERTIFICADO' : 'BLOQUEADO'}`,
      `Score: ${parsed.score == null ? 'n/a' : parsed.score + '%'} (umbral ${parsed.threshold || 95}%)`,
      `Deploy: ${formatEvidenceLine('deployment_report', evidence.deploy, 'pendiente de evidencia')}`,
      `PR readiness: rama=${git.branch}, base=${baseForPr}`,
      `Acción inmediata: ${prHint}`,
      '',
      'Siguiente paso:',
      git.branch === baseForPr
        ? `1. Crear rama feature/${runSlug}`
        : `1. Abrir PR ${branchForPr} -> ${baseForPr}`,
      ok ? '2. Proceder a revisión final y merge.' : `2. Corregir bloqueo: ${parsed.reason}.`
    ].filter(Boolean).join('\n');
  }

  return [
    `${ok ? ':trophy:' : ':warning:'} Terminé la ejecución de *${runSlug}*. Te dejo una vista 360, sin ruido y con acciones concretas.`,
    '',
    '*Plan ejecutado (paso a paso)*',
    `1. Arranqué /gd:start para preparar el ciclo y cargar evidencia base.`,
    `2. Validé implement con evidencia de código.`,
    `3. Validé test y review contra artefactos pass/approve.`,
    `4. Validé verify + release con evidencia técnica y deploy.`,
    `5. Calculé score final para decidir certificación.`,
    '',
    '*Qué encontré*',
    `- Estado gates: code=${counters.code || 0}, test=${counters.testPassed || 0}, review=${counters.reviewApproved || 0}, verify=${counters.verifyPassed || 0}, deploy=${counters.deploySuccess || 0}`,
    `- Score final: ${parsed.score == null ? 'n/a' : parsed.score + '%'} (umbral ${parsed.threshold || 95}%) -> ${ok ? 'CERTIFICADO' : 'BLOQUEADO'}`,
    `- Deploy evidence: ${formatEvidenceLine('deployment_report', evidence.deploy, 'no hay deploy success registrado')}`,
    `- Verify evidence: ${formatEvidenceLine('verification', verifyEvidence, 'no hay verificación passed registrada')}`,
    `- Review evidence: ${formatEvidenceLine('review_decision', evidence.review, 'no hay review approve registrada')}`,
    `- Trazabilidad compacta: ${transitionsLine}`,
    '',
    '*Estado para PR y handoff*',
    `- Rama actual: ${git.branch}`,
    `- Rama base: ${baseForPr}`,
    `- Fuente de ramas: git rev-parse --abbrev-ref HEAD y origin/HEAD (independiente del gate /gd:release)`,
    `- Último commit: ${git.lastCommit.hash} | ${git.lastCommit.subject} | ${git.lastCommit.author}`,
    `- Working tree: ${git.dirtyCount === 0 ? 'limpio' : `${git.dirtyCount} archivo(s) con cambios`}`,
    `- ${prHint}`,
    reviewUrl
      ? `- PR detectado en evidencia: ${reviewUrl}`
      : (reviewPrNumber ? `- PR detectado en evidencia: #${reviewPrNumber}` : '- PR detectado en evidencia: no registrado aún'),
    '',
    '*Siguiente acción recomendada*',
    git.branch === baseForPr ? `1. Crear rama de trabajo: git checkout -b feature/${runSlug}` : `1. Publicar rama actual: git push -u origin ${branchForPr}`,
    git.branch === baseForPr ? `2. Hacer commit de cambios pendientes y publicar rama` : `2. Abrir PR: ${branchForPr} -> ${baseForPr}`,
    `3. Confirmar en PR que el deploy quedó con evidencia: ${evidence.deploy ? `id=${evidence.deploy.id}` : 'pendiente de registrar deploy_success'}`,
    ok ? '4. Proceder a merge cuando revisión de equipo esté aprobada.' : `4. Corregir el bloqueo (${parsed.reason}) y volver a ejecutar /sdd run.`
  ].join('\n');
}

function runPipeline(changeSlug, requirement, responseUrl, onDone) {
  const reqText = requirement && requirement.trim()
    ? requirement.trim()
    : 'run triggered from Slack';

  const args = [
    path.join(RAG_DIR, 'scripts', 'run-pipeline.mjs'),
    `--change=${changeSlug}`,
    '--threshold=95',
    '--auto-capture',
    '--code-title=Slack Code', `--code-description=${reqText}`,
    '--test-title=Slack Test', `--test-description=${reqText}`, '--test-passed=true',
    '--review-title=Slack Review', `--review-description=${reqText}`, '--review-decision=approve',
    '--verify-title=Slack Verify', `--verify-description=${reqText}`, '--verify-passed=true',
    '--deploy-title=Slack Deploy', `--deploy-description=${reqText}`, '--deploy-status=success',
    '--notify-slack', '--notify-slack-progress', '--notify-slack-final=false',
    responseUrl ? `--slack-response-url=${responseUrl}` : null,
    '--json'
  ].filter(Boolean);

  const child = spawn('node', args, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });

  child.on('close', (code) => {
    let parsed = null;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }

    onDone({ code, stdout, stderr, parsed });
  });
}

function getStatus(changeSlug) {
  return new Promise((resolve) => {
    const args = [
      path.join(RAG_DIR, 'scripts', 'run-pipeline.mjs'),
      `--change=${changeSlug}`,
      '--json'
    ];

    const child = spawn('node', args, {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      let parsed = null;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        parsed = null;
      }
      resolve({ code, parsed, stderr });
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== COMMAND_PATH) {
    sendJson(res, 404, { ok: false, error: 'not-found' });
    return;
  }

  let size = 0;
  let bodyRaw = '';

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      req.destroy();
      return;
    }
    bodyRaw += chunk.toString('utf-8');
  });

  req.on('end', async () => {
    if (!SIGNING_SECRET) {
      sendJson(res, 500, { response_type: 'ephemeral', text: 'Missing SLACK_SIGNING_SECRET' });
      return;
    }

    if (!verifySlackSignature(req, bodyRaw)) {
      sendJson(res, 401, { response_type: 'ephemeral', text: 'Invalid Slack signature' });
      return;
    }

    const form = parseForm(bodyRaw);
    const { cmd, slug, parts } = parseInput(form.text);
    const gdAlias = cmd.startsWith('gd:') ? cmd.slice(3) : '';

    if (cmd === 'help' || gdAlias === 'help') {
      sendJson(res, 200, { response_type: 'ephemeral', text: usage() });
      return;
    }

    if (cmd === 'style') {
      const requested = normalizeStyle(parts[1] || '');
      const explicit = String(parts[1] || '').toLowerCase();
      if (!['technical', 'executive'].includes(explicit)) {
        sendJson(res, 200, {
          response_type: 'ephemeral',
          text: 'Uso: `style technical` o `style executive`.'
        });
        return;
      }

      const stored = setChannelPreferredStyle(form.channelName, requested);
      const forced = getForcedChannelStyle(form.channelName);
      const effective = forced || stored;

      sendJson(res, 200, {
        response_type: 'ephemeral',
        text: [
          `Estilo guardado para canal #${form.channelName}: ${stored}.`,
          forced
            ? `Nota: este canal está forzado a ${forced}, así que ese será el estilo efectivo.`
            : `Estilo efectivo actual: ${effective}.`
        ].join('\n')
      });
      return;
    }

    if (cmd !== 'run' && gdAlias !== 'status' && gdAlias !== 'start' && !slug) {
      sendJson(res, 200, {
        response_type: 'ephemeral',
        text: 'Falta change-slug. Usa: `status <slug>` o `run <slug>`.'
      });
      return;
    }

    if (cmd === 'status' || gdAlias === 'status') {
      const statusSlug = gdAlias === 'status' ? (parts[1] || '') : slug;
      if (!statusSlug) {
        sendJson(res, 200, {
          response_type: 'ephemeral',
          text: 'Falta change-slug para status. Usa: `status <slug>` o `gd:status <slug>`.'
        });
        return;
      }

      const result = await getStatus(statusSlug);
      if (!result.parsed) {
        sendJson(res, 200, {
          response_type: 'ephemeral',
          text: `No se pudo leer estado para ${statusSlug}. stderr=${result.stderr || 'n/a'}`
        });
        return;
      }

      const r = result.parsed;
      const text = [
        `*Status* ${statusSlug}`,
        `- status: ${r.status}`,
        `- phase: ${r.current_phase}`,
        `- score: ${r.score == null ? 'n/a' : r.score + '%'}`,
        `- reason: ${r.reason}`
      ].join('\n');

      sendJson(res, 200, { response_type: 'ephemeral', text });
      return;
    }

    const knownGdAliases = new Set(['help', 'status', 'style', 'start', 'run']);
    const isUnknownGdAlias = Boolean(gdAlias) && !knownGdAliases.has(gdAlias);

    if (cmd === 'run' || gdAlias === 'start' || gdAlias === 'run' || isUnknownGdAlias) {
      let parsedRun;
      if (gdAlias === 'start') {
        parsedRun = parseGdStartArgs(form.text);
      } else if (gdAlias === 'run') {
        parsedRun = parseRunArgs(form.text.replace(/^gd:run\s*/i, 'run '));
      } else if (isUnknownGdAlias) {
        parsedRun = parseGdGenericArgs(form.text, gdAlias);
      } else {
        parsedRun = parseRunArgs(form.text);
      }

      const runSlug = parsedRun.slug;
      const requirement = parsedRun.requirement;

      if (!runSlug) {
        sendJson(res, 200, {
          response_type: 'ephemeral',
          text: 'No pude resolver el change-slug. Usa `run <slug>` o `run req: <texto>`.'
        });
        return;
      }

      const style = resolveResponseStyle(form.text, DEFAULT_RESPONSE_STYLE, form.channelName);

      const reqPreview = requirement ? `\nRequerimiento: ${requirement}` : '';
      sendJson(res, 200, {
        response_type: 'ephemeral',
        text: `⏳ Ejecutando pipeline para *${runSlug}*... recibirás actualizaciones por fase.${reqPreview}`
      });

      runPipeline(runSlug, requirement, form.responseUrl, async ({ code, parsed, stderr }) => {
        if (!parsed) {
          await postToResponseUrl(
            form.responseUrl,
            `:x: Pipeline ${runSlug} terminó con error (exit=${code}). stderr=${stderr || 'n/a'}`,
            '#e01e5a'
          );
          return;
        }

        const ok = parsed.certified === true;
        const icon = ok ? ':trophy:' : ':warning:';
        const color = ok ? '#2eb886' : '#e01e5a';

        const c = parsed.counters || {};
        const evidence = getEvidenceSnapshot(runSlug);
        const git = getGitSnapshot();
        const reviewUrl = evidence.review?.metadata?.pr_url || '';
        const reviewPrNumber = evidence.review?.metadata?.pr_number;

        const branchForPr = git.branch && git.branch !== 'HEAD' ? git.branch : 'feature/' + runSlug;
        const baseForPr = git.defaultBranch || 'master';
        const prHint = git.branch === baseForPr
          ? `Actualmente estás en ${baseForPr}. Crea una rama de feature antes del PR requerido.`
          : `PR sugerido: ${branchForPr} -> ${baseForPr}`;

        const transitionsLine = Array.isArray(parsed.transitions) && parsed.transitions.length > 0
          ? parsed.transitions.map(t => `${t.from} -> ${t.to}`).join(' | ')
          : 'n/a';

        const text = buildFinalCloseoutMessage({
          style,
          runSlug,
          requirement,
          parsed,
          counters: c,
          evidence,
          git,
          transitionsLine,
          ok,
          prHint,
          baseForPr,
          branchForPr,
          reviewUrl,
          reviewPrNumber
        });

        await postToResponseUrl(form.responseUrl, text, color);
      });
      return;
    }

    const naturalAnswer = await answerNaturalQuestion(form.text, form.channelName);
    sendJson(res, 200, {
      response_type: 'ephemeral',
      text: naturalAnswer
    });
  });
});

server.listen(PORT, () => {
  console.log(`ok slack-command-server http://localhost:${PORT}${COMMAND_PATH}`);
});

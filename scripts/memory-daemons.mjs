#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRAME_ROOT = path.resolve(__dirname, '..');
const DEFAULT_CONFIG_BASE = process.platform === 'win32'
  ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
  : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'));
const CONFIG_DIRS = [
  process.env.FRAMEWORK_SDD_CONFIG_DIR,
  path.join(DEFAULT_CONFIG_BASE, 'framework-sdd'),
  path.join(os.homedir(), '.config', 'framework-sdd'),
].filter(Boolean);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

[
  ...CONFIG_DIRS.flatMap((dir) => [
    path.join(dir, 'engram-daemon.env'),
    path.join(dir, 'rag-daemon.env'),
  ]),
  path.join(FRAME_ROOT, 'config', 'engram-daemon.local.env'),
  path.join(FRAME_ROOT, 'config', 'rag-daemon.local.env'),
  process.env.ENGRAM_DAEMON_ENV_FILE,
  process.env.RAG_DAEMON_ENV_FILE,
].filter(Boolean).forEach(parseEnvFile);

const LOCAL_KB_DIR = path.join(FRAME_ROOT, 'engineering-knowledge-base');
const KB_DIR = process.env.ENGRAM_DATA_DIR && fs.existsSync(process.env.ENGRAM_DATA_DIR)
  ? process.env.ENGRAM_DATA_DIR
  : LOCAL_KB_DIR;
const RAG_DIR = path.join(FRAME_ROOT, 'rag');
const ENGRAM_PID_FILE = path.join(KB_DIR, '.engram-sync.pid');
const ENGRAM_LOG_FILE = path.join(KB_DIR, '.engram-sync.log');
const ENGRAM_LAST_SIZE_FILE = path.join(KB_DIR, '.engram-last-size');
const RAG_PID_FILE = path.join(RAG_DIR, '.rag-index-daemon.pid');
const RAG_LOG_FILE = path.join(RAG_DIR, '.rag-index-daemon.log');
const ENGRAM_INTERVAL_MS = Number(process.env.ENGRAM_SYNC_INTERVAL_MS || 30000);
const RAG_INTERVAL_MS = Number(process.env.RAG_INDEX_INTERVAL || 3600) * 1000;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function appendLog(filePath, message) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${new Date().toISOString()} ${message}${os.EOL}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPidRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(pidFile) {
  if (!fs.existsSync(pidFile)) return null;
  const raw = fs.readFileSync(pidFile, 'utf8').trim();
  const pid = Number(raw);
  return Number.isFinite(pid) ? pid : null;
}

function statusLabel(running) {
  return running ? 'RUNNING' : 'STOPPED';
}

function findEngramCommand() {
  const candidates = [
    process.env.ENGRAM_BIN,
    'engram',
    path.join(os.homedir(), 'go', 'bin', process.platform === 'win32' ? 'engram.exe' : 'engram'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const check = spawnSync(candidate, ['--help'], {
      encoding: 'utf8',
      shell: process.platform === 'win32' && !path.isAbsolute(candidate),
    });
    const output = `${check.stdout || ''} ${check.stderr || ''}`.toLowerCase();
    if (!check.error && check.status !== 127 && !output.includes('not recognized') && !output.includes('not found')) {
      return candidate;
    }
  }
  return null;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || FRAME_ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    shell: options.shell ?? (process.platform === 'win32' && !path.isAbsolute(command)),
  });
  return result;
}

async function syncEngramOnce() {
  ensureDir(KB_DIR);
  appendLog(ENGRAM_LOG_FILE, '[info] engram cycle');

  const dbPath = path.join(KB_DIR, 'engram.db');
  if (!fs.existsSync(dbPath)) {
    appendLog(ENGRAM_LOG_FILE, '[warn] engram.db not found, skipping sync');
    return;
  }

  const currentSize = fs.statSync(dbPath).size;
  const previousSize = fs.existsSync(ENGRAM_LAST_SIZE_FILE)
    ? Number(fs.readFileSync(ENGRAM_LAST_SIZE_FILE, 'utf8').trim() || '0')
    : null;

  if (previousSize !== null && Math.abs(currentSize - previousSize) < 1024) {
    return;
  }

  const engramCmd = findEngramCommand();
  if (!engramCmd) {
    appendLog(ENGRAM_LOG_FILE, '[warn] engram binary not found in PATH or ENGRAM_BIN');
    fs.writeFileSync(ENGRAM_LAST_SIZE_FILE, String(currentSize));
    return;
  }

  const sync = runCommand(engramCmd, ['sync'], { cwd: KB_DIR });
  if (sync.status !== 0) {
    appendLog(ENGRAM_LOG_FILE, `[warn] engram sync failed: ${(sync.stderr || sync.stdout || '').trim()}`);
    fs.writeFileSync(ENGRAM_LAST_SIZE_FILE, String(currentSize));
    return;
  }

  if (process.env.ENGRAM_GIT_TOKEN) {
    const remote = process.env.ENGRAM_GIT_REMOTE || 'https://github.com/carlosamesar/engineering-knowledge-base.git';
    runCommand('git', ['remote', 'set-url', 'origin', `https://${process.env.ENGRAM_GIT_TOKEN}@${remote.replace(/^https:\/\//, '')}`], { cwd: KB_DIR });
  }

  runCommand('git', ['add', '.engram/'], { cwd: KB_DIR });
  const staged = runCommand('git', ['diff', '--staged', '--quiet'], { cwd: KB_DIR });
  if (staged.status !== 0) {
    runCommand('git', ['commit', '-m', `sync: engram memories ${new Date().toISOString()}`], { cwd: KB_DIR });
    const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: KB_DIR });
    const branchName = (branch.stdout || '').trim() || 'master';
    const push = runCommand('git', ['push', 'origin', branchName], { cwd: KB_DIR });
    if (push.status === 0) appendLog(ENGRAM_LOG_FILE, '[ok] engram sync pushed');
    else appendLog(ENGRAM_LOG_FILE, `[warn] git push failed: ${(push.stderr || push.stdout || '').trim()}`);
  } else {
    appendLog(ENGRAM_LOG_FILE, '[info] no new engram chunks to commit');
  }

  fs.writeFileSync(ENGRAM_LAST_SIZE_FILE, String(currentSize));
}

async function ragIndexOnce() {
  ensureDir(RAG_DIR);
  appendLog(RAG_LOG_FILE, '[info] rag cycle');

  if (!fs.existsSync(path.join(RAG_DIR, 'package.json'))) {
    appendLog(RAG_LOG_FILE, '[warn] rag/package.json not found');
    return;
  }

  if (!fs.existsSync(path.join(RAG_DIR, 'node_modules'))) {
    appendLog(RAG_LOG_FILE, '[info] installing rag dependencies');
    runCommand('npm', ['install', '--silent'], { cwd: RAG_DIR, shell: true });
  }

  const result = runCommand(process.execPath, [path.join(RAG_DIR, 'scripts', 'index.mjs')], { cwd: RAG_DIR });
  if (result.status === 0) appendLog(RAG_LOG_FILE, '[ok] rag index complete');
  else appendLog(RAG_LOG_FILE, `[warn] rag index failed: ${(result.stderr || result.stdout || '').trim()}`);
}

async function daemonLoop(kind) {
  const logFile = kind === 'engram' ? ENGRAM_LOG_FILE : RAG_LOG_FILE;
  appendLog(logFile, `[info] ${kind} daemon started on ${process.platform}`);
  while (true) {
    try {
      if (kind === 'engram') await syncEngramOnce();
      else await ragIndexOnce();
    } catch (error) {
      appendLog(logFile, `[error] ${error.stack || error.message}`);
    }
    await sleep(kind === 'engram' ? ENGRAM_INTERVAL_MS : RAG_INTERVAL_MS);
  }
}

function startOne(kind) {
  const pidFile = kind === 'engram' ? ENGRAM_PID_FILE : RAG_PID_FILE;
  const logFile = kind === 'engram' ? ENGRAM_LOG_FILE : RAG_LOG_FILE;
  const currentPid = readPid(pidFile);

  if (currentPid && isPidRunning(currentPid)) {
    console.log(`${kind}: ${statusLabel(true)} (pid ${currentPid})`);
    return;
  }

  ensureDir(path.dirname(pidFile));
  ensureDir(path.dirname(logFile));
  const out = fs.openSync(logFile, 'a');
  const child = spawn(process.execPath, [__filename, `${kind}-loop`], {
    cwd: FRAME_ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: process.env,
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  console.log(`${kind}: started (pid ${child.pid})`);
}

function stopOne(kind) {
  const pidFile = kind === 'engram' ? ENGRAM_PID_FILE : RAG_PID_FILE;
  const pid = readPid(pidFile);

  if (!pid) {
    console.log(`${kind}: ${statusLabel(false)}`);
    return;
  }

  try {
    process.kill(pid);
  } catch {}

  if (fs.existsSync(pidFile)) fs.rmSync(pidFile, { force: true });
  console.log(`${kind}: stopped`);
}

function statusOne(kind) {
  const pidFile = kind === 'engram' ? ENGRAM_PID_FILE : RAG_PID_FILE;
  const pid = readPid(pidFile);
  const running = !!pid && isPidRunning(pid);

  if (!running && fs.existsSync(pidFile)) fs.rmSync(pidFile, { force: true });
  console.log(`${kind}: ${statusLabel(running)}${running ? ` (pid ${pid})` : ''}`);
}

async function main() {
  const command = process.argv[2] || 'status';

  if (command === 'engram-loop') return daemonLoop('engram');
  if (command === 'rag-loop') return daemonLoop('rag');

  switch (command) {
    case 'start':
      startOne('engram');
      startOne('rag');
      break;
    case 'stop':
      stopOne('engram');
      stopOne('rag');
      break;
    case 'status':
      statusOne('engram');
      statusOne('rag');
      break;
    case 'health': {
      const engramCmd = findEngramCommand();
      console.log(`platform: ${process.platform}`);
      console.log(`engram binary: ${engramCmd || 'NOT FOUND'}`);
      console.log(`knowledge base: ${fs.existsSync(KB_DIR) ? 'OK' : 'MISSING'} (${KB_DIR})`);
      console.log(`rag dir: ${fs.existsSync(RAG_DIR) ? 'OK' : 'MISSING'} (${RAG_DIR})`);
      break;
    }
    default:
      console.error('Usage: node scripts/memory-daemons.mjs {start|stop|status|health}');
      process.exitCode = 1;
  }
}

main();

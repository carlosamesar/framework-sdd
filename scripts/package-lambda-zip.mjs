#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!key.startsWith('--')) continue;
    const normalized = key.slice(2);
    if (next && !next.startsWith('--')) {
      args[normalized] = next;
      i += 1;
    } else {
      args[normalized] = true;
    }
  }
  return args;
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}`);
  }
}

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function shouldSkip(name, fullPath, sourceRoot) {
  const relativePath = path.relative(sourceRoot, fullPath).replace(/\\/g, '/');
  const excludedDirs = new Set([
    '.git',
    '.github',
    '.vscode',
    'coverage',
    '__tests__',
    'test',
    'tests',
    '.nyc_output'
  ]);

  if (excludedDirs.has(name)) return true;
  if (relativePath === 'deploy.zip') return true;
  if (/\.log$/i.test(name)) return true;
  if (/\.md$/i.test(name) && !/README-DEPLOYMENT\.md$/i.test(name)) return true;
  if (/\.tsbuildinfo$/i.test(name)) return true;
  if (relativePath.includes('node_modules/.cache')) return true;
  return false;
}

function copyDirectory(sourceDir, targetDir, rootDir, state) {
  ensureDirectory(targetDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (shouldSkip(entry.name, sourcePath, rootDir)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, rootDir, state);
    } else if (entry.isFile()) {
      ensureDirectory(path.dirname(targetPath));
      fs.copyFileSync(sourcePath, targetPath);
      state.files += 1;
    }
  }
}

function packageZip(sourceDir, outputZip) {
  if (fs.existsSync(outputZip)) {
    fs.rmSync(outputZip, { force: true });
  }

  ensureDirectory(path.dirname(outputZip));

  if (process.platform === 'win32') {
    const psCommand = [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${sourceDir.replace(/'/g, "''")}\\*' -DestinationPath '${outputZip.replace(/'/g, "''")}' -Force`
    ];
    runCommand('powershell', psCommand);
    return;
  }

  runCommand('zip', ['-qr', outputZip, '.'], { cwd: sourceDir });
}

const args = parseArgs(process.argv.slice(2));
const lambdaPathArg = args['lambda-path'];

if (!lambdaPathArg) {
  console.error('Uso: node scripts/package-lambda-zip.mjs --lambda-path <ruta> [--output <deploy.zip>] [--skip-install] [--skip-build]');
  process.exit(1);
}

const lambdaPath = path.resolve(lambdaPathArg);
const outputZip = path.resolve(args.output || path.join(lambdaPath, 'deploy.zip'));
const skipInstall = Boolean(args['skip-install']);
const skipBuild = Boolean(args['skip-build']);

if (!fs.existsSync(lambdaPath) || !fs.statSync(lambdaPath).isDirectory()) {
  console.error(`La ruta de la lambda no existe o no es directorio: ${lambdaPath}`);
  process.exit(1);
}

const packageJsonPath = path.join(lambdaPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!skipInstall) {
    if (fs.existsSync(path.join(lambdaPath, 'package-lock.json'))) {
      runCommand('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: lambdaPath });
    } else {
      runCommand('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: lambdaPath });
    }
  }

  if (!skipBuild && pkg.scripts && pkg.scripts.build) {
    runCommand('npm', ['run', 'build'], { cwd: lambdaPath });
  }
}

const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lambda-zip-'));
const state = { files: 0 };
copyDirectory(lambdaPath, stagingDir, lambdaPath, state);
packageZip(stagingDir, outputZip);

const bytes = fs.statSync(outputZip).size;
const megabytes = (bytes / (1024 * 1024)).toFixed(2);
console.log(`ZIP generado: ${outputZip}`);
console.log(`Archivos empaquetados: ${state.files}`);
console.log(`Tamaño: ${megabytes} MB`);

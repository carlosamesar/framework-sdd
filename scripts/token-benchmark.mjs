#!/usr/bin/env node
/**
 * Token Usage Benchmark
 * Mide el contexto actual usando tamaños reales de archivos clave.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASELINE = 74600;
const rel = (...parts) => path.join(ROOT, ...parts);
const read = (file) => fs.readFileSync(rel(file), 'utf8');
const tokens = (file) => Math.ceil(read(file).length / 4);

const coreModules = [
  '.agents-core/multi-tenant.md',
  '.agents-core/lambdas-pattern.md',
  '.agents-core/nestjs-pattern.md',
  '.agents-core/testing-rules.md',
  '.agents-core/saga-pattern.md',
];

const avgModule = Math.ceil(coreModules.reduce((sum, file) => sum + tokens(file), 0) / coreModules.length);
const patterns = tokens('PATTERNS-CACHE.md');
const commands = tokens('COMMANDS-INDEX.md');
const agents = tokens('AGENTS.md');

const profiles = {
  CLAUDE: tokens('CLAUDE.md') + agents + avgModule + patterns + commands,
  QWEN: tokens('QWEN.md') + agents + avgModule + patterns + commands,
  COPILOT: tokens('.github/copilot-instructions.md') + tokens('COPILOT.md') + agents + avgModule + patterns + commands,
};

console.log('\n' + '='.repeat(72));
console.log('TOKEN USAGE BENCHMARK — REAL FILE BUDGET');
console.log('='.repeat(72));
console.log(`Baseline histórica: ${BASELINE} tokens`);
console.log(`AGENTS: ${agents} | avg módulo: ${avgModule} | patterns: ${patterns} | commands: ${commands}`);
console.log('-'.repeat(72));
console.log(`${'Tool'.padEnd(12)}${'Actual'.padStart(12)}${'Savings'.padStart(12)}`);
console.log('-'.repeat(72));

let minSavings = 100;
for (const [tool, total] of Object.entries(profiles)) {
  const savings = ((BASELINE - total) / BASELINE) * 100;
  minSavings = Math.min(minSavings, savings);
  console.log(`${tool.padEnd(12)}${String(total).padStart(12)}${(`${savings.toFixed(2)}%`).padStart(12)}`);
}

console.log('-'.repeat(72));
console.log(`Resultado mínimo verificado: ${minSavings.toFixed(2)}% ahorro`);
console.log('='.repeat(72) + '\n');

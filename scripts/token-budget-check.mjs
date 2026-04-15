#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const BASELINE_TOKENS = 74600;
const TARGET_SAVINGS = 95;
const STRICT = process.argv.includes('--strict');

const rel = (...parts) => path.join(ROOT, ...parts);
const exists = (file) => fs.existsSync(rel(file));
const read = (file) => fs.readFileSync(rel(file), 'utf8');
const tokens = (file) => (exists(file) ? Math.ceil(read(file).length / 4) : 0);

const coreModules = [
  '.agents-core/multi-tenant.md',
  '.agents-core/lambdas-pattern.md',
  '.agents-core/nestjs-pattern.md',
  '.agents-core/testing-rules.md',
  '.agents-core/saga-pattern.md',
];

const requiredAssets = [
  'PATTERNS-CACHE.md',
  '.agents-reference/rag-first-workflow.md',
  ...coreModules,
];

const avgModuleTokens = Math.ceil(coreModules.reduce((sum, file) => sum + tokens(file), 0) / coreModules.length);
const commandsTokens = tokens('COMMANDS-INDEX.md');
const patternsTokens = tokens('PATTERNS-CACHE.md');

const budgets = {
  CLAUDE: tokens('CLAUDE.md') + tokens('AGENTS.md') + avgModuleTokens + patternsTokens + commandsTokens,
  QWEN: tokens('QWEN.md') + tokens('AGENTS.md') + avgModuleTokens + patternsTokens + commandsTokens,
  COPILOT: tokens('.github/copilot-instructions.md') + tokens('COPILOT.md') + tokens('AGENTS.md') + avgModuleTokens + patternsTokens + commandsTokens,
};

const rows = Object.entries(budgets).map(([name, total]) => {
  const savings = Number((((BASELINE_TOKENS - total) / BASELINE_TOKENS) * 100).toFixed(2));
  return { name, total, savings, pass: savings >= TARGET_SAVINGS };
});

console.log('\nTOKEN BUDGET CHECK');
console.log('='.repeat(72));
console.log(`Baseline: ${BASELINE_TOKENS} tokens | Target savings: > ${TARGET_SAVINGS}%`);
console.log(`Avg module: ${avgModuleTokens} | Patterns: ${patternsTokens} | Commands: ${commandsTokens}`);
console.log('-'.repeat(72));
console.log(`${'Tool'.padEnd(12)}${'Current'.padStart(12)}${'Savings'.padStart(12)}${'Status'.padStart(12)}`);
console.log('-'.repeat(72));
for (const row of rows) {
  console.log(`${row.name.padEnd(12)}${String(row.total).padStart(12)}${(`${row.savings}%`).padStart(12)}${(row.pass ? 'PASS' : 'FAIL').padStart(12)}`);
}
console.log('-'.repeat(72));

const missingAssets = requiredAssets.filter((file) => !exists(file));
if (missingAssets.length) {
  console.error('\nMissing assets:');
  missingAssets.forEach((file) => console.error(`- ${file}`));
}

const failed = rows.filter((row) => !row.pass);
if (STRICT && (failed.length || missingAssets.length)) {
  process.exitCode = 1;
}

#!/usr/bin/env node
/**
 * sdd-budget-counter.mjs
 * Control de presupuesto mensual persistente (Vector 2).
 * Evita el gasto descontrolado de tokens en el agente automático.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const REPO_ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const BUDGET_FILE = path.join(REPO_ROOT, '.sdd-budget-state.json');
const CONFIG_PATH = path.join(REPO_ROOT, '.github/sdd-issue-config.yaml');

function getMonthlyKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function loadBudget() {
  if (!fs.existsSync(BUDGET_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveBudget(state) {
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(state, null, 2));
}

function run() {
  const mode = process.argv[2] || 'check'; // 'check' o 'add'
  const amount = parseFloat(process.argv[3]) || 0;

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('No config found');
    process.exit(1);
  }

  const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const limit = config.budget?.max_monthly_usd || 50.0;
  
  const state = loadBudget();
  const monthKey = getMonthlyKey();
  
  if (!state[monthKey]) {
    state[monthKey] = { usd_spent: 0, tokens_spent: 0 };
  }

  const currentSpent = state[monthKey].usd_spent;

  if (mode === 'check') {
    if (currentSpent >= limit) {
      console.log(`BUDGET_EXCEEDED: Spent $${currentSpent.toFixed(2)} of $${limit.toFixed(2)}`);
      process.exit(1);
    } else {
      console.log(`BUDGET_OK: Spent $${currentSpent.toFixed(2)} of $${limit.toFixed(2)}`);
      process.exit(0);
    }
  }

  if (mode === 'add') {
    state[monthKey].usd_spent += amount;
    saveBudget(state);
    console.log(`UPDATED_BUDGET: New total $${state[monthKey].usd_spent.toFixed(2)}`);
    process.exit(0);
  }
}

run();

#!/usr/bin/env node
/**
 * sdd-issue-runner.mjs
 * Runner de alta seguridad para disparar el ciclo SDD desde GitHub Issues.
 * Implementa las 4 capas de mitigación de riesgo (Vector 1-4).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// --- CONFIGURACIÓN ---
const ISSUE_NUMBER = process.env.GITHUB_ISSUE_NUMBER;
const ISSUE_BODY = process.env.GITHUB_ISSUE_BODY || '';
const ISSUE_TITLE = process.env.GITHUB_ISSUE_TITLE || '';
const ISSUE_AUTHOR = process.env.GITHUB_ISSUE_AUTHOR;
const REPO_ROOT = process.env.GITHUB_WORKSPACE || process.cwd();
const CONFIG_PATH = path.join(REPO_ROOT, '.github/sdd-issue-config.yaml');

// --- UTILIDADES ---
function log(msg) { console.log(`[SDD-RUNNER] ${msg}`); }
function error(msg) { console.error(`[SDD-RUNNER] ❌ ERROR: ${msg}`); }
function comment(msg) {
  if (process.env.GITHUB_ACTIONS) {
    execSync(`gh issue comment ${ISSUE_NUMBER} --body "${msg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } else {
    log(`SIMULATED COMMENT: ${msg}`);
  }
}

async function run() {
  log(`Iniciando runner para issue #${ISSUE_NUMBER} de @${ISSUE_AUTHOR}`);

  // 1. CARGAR CONFIGURACIÓN
  if (!fs.existsSync(CONFIG_PATH)) {
    error('No se encontró .github/sdd-issue-config.yaml');
    process.exit(1);
  }
  const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));

  // --- VECTOR 2: BUDGET CHECK (PRE-LLM) ---
  const budgetScript = path.join(REPO_ROOT, 'bin/sdd-budget-counter.mjs');
  try {
    execSync(`node ${budgetScript} check`, { stdio: 'inherit' });
  } catch (e) {
    error('Presupuesto mensual excedido.');
    comment(`🛑 **Presupuesto SDD excedido.** No se pueden procesar más tareas este mes para evitar sobrecostos.`);
    process.exit(0);
  }

  // --- VECTOR 1: MITIGACIÓN DE ACTIVACIÓN ---
  
  // Gate: Allowlist de autores
  if (!config.allowed_authors.includes(ISSUE_AUTHOR)) {
    error(`Autor @${ISSUE_AUTHOR} no está en allowlist.`);
    comment(`⚠️ El usuario @${ISSUE_AUTHOR} no tiene permisos para disparar el SDD Agent automático.`);
    process.exit(0); // Exit gracefully para no fallar el workflow
  }

  // Gate: Rama existente (evitar duplicados)
  const branchName = `feature/issue-${ISSUE_NUMBER}`;
  try {
    execSync(`git ls-remote --heads origin ${branchName}`);
    error(`La rama ${branchName} ya existe.`);
    comment(`🛑 El agente ya está trabajando (o ya trabajó) en este issue. Rama \`${branchName}\` detectada.`);
    process.exit(0);
  } catch (e) { /* Branch doesn't exist, proceed */ }

  // --- VECTOR 3: CALIDAD DE INPUT ---
  
  const validation = config.input_validation;
  if (ISSUE_BODY.length < validation.min_body_length) {
    error('Body demasiado corto.');
    comment(`❌ El issue es demasiado breve (< ${validation.min_body_length} chars). Por favor usa el template \`sdd-feature.md\` y describe bien la tarea.`);
    process.exit(0);
  }

  for (const section of validation.required_sections) {
    if (!ISSUE_BODY.includes(section)) {
      error(`Falta sección obligatoria: ${section}`);
      comment(`❌ Falta la sección obligatoria: **${section}**. Por favor usa el template oficial.`);
      process.exit(0);
    }
  }

  // --- PREPARACIÓN DEL ENTORNO ---
  
  log(`Creando rama local: ${branchName}`);
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

  // --- VECTOR 2: CONTROL DE COSTO (ENV VARS) ---
  
  process.env.SDD_SKIP_HUMAN_GATE = '1';
  process.env.SDD_GUARDRAIL_STRICT = '1';
  process.env.SDD_MAX_ITERATIONS = '7';
  // El model-router lee directamente la configuración o env vars.
  // Inyectamos el mapa de modelos de la config si es necesario.
  if (config.phase_model_map) {
    process.env.SDD_PHASE_MODEL_MAP = JSON.stringify(config.phase_model_map);
  }

  // --- EJECUCIÓN DEL CICLO SDD ---
  
  comment(`🤖 **SDD Agent iniciado.** Trabajando en la rama \`${branchName}\`...`);
  
  const taskDescription = `${ISSUE_TITLE}\n\n${ISSUE_BODY}`;
  const cycleScript = path.join(REPO_ROOT, 'packages/sdd-agent-orchestrator/src/run-gd-cycle.mjs');
  
  try {
    // Invocamos el ciclo real. Redirigimos output para capturar resumen.
    log('Ejecutando run-gd-cycle.mjs...');
    const output = execSync(`node ${cycleScript} "${taskDescription.replace(/"/g, '\\"')}"`, { 
      encoding: 'utf8',
      env: { ...process.env, SDD_GD_CYCLE_FULL_JSON: '1' }
    });
    
    const result = JSON.parse(output);
    log(`Ciclo terminado. Fase final: ${result.phase}`);

    // --- VECTOR 4: CALIDAD A PRODUCCIÓN (DRAFT PR) ---
    
    log('Sincronizando cambios y creando PR...');
    execSync('git add .');
    execSync(`git commit -m "feat(issue-${ISSUE_NUMBER}): implemented via SDD Agent"`, { stdio: 'inherit' });
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

    const prBody = `## SDD Agent Implementation\n\n- **Issue:** #${ISSUE_NUMBER}\n- **Complexity:** ${result.complexityLevel}\n- **Fases completadas:** ${result.trace.join(' → ')}\n\n### Certification Preview\n\`\`\`markdown\n${result.archivePreview.slice(0, 1000)}...\n\`\`\``;
    
    const prUrl = execSync(`gh pr create --title "[SDD] #${ISSUE_NUMBER} ${ISSUE_TITLE}" --body "${prBody.replace(/"/g, '\\"')}" --draft --label "sdd-review"`, {
      encoding: 'utf8'
    }).trim();

    // --- ACTUALIZAR BUDGET AL FINALIZAR CON ÉXITO ---
    // Estimación: $0.40 por ciclo (gpt-4o-mini + gpt-4o mixto)
    execSync(`node ${budgetScript} add 0.40`, { stdio: 'inherit' });

    comment(`✅ **Implementación completa.**\n\n- **PR:** ${prUrl}\n- **Complexity:** ${result.complexityLevel}\n- **Estado:** Pendiente de revisión humana.`);

  } catch (e) {
    error('Falla en la ejecución del ciclo.');
    console.error(e);
    comment(`🚨 **El agente falló.** Error detectado durante la ejecución. Ver logs de GitHub Actions.`);
    process.exit(1);
  }
}

run();

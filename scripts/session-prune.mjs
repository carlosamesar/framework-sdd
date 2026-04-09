#!/usr/bin/env node
/**
 * Session Context Pruning Tool
 * 
 * Genera un resumen compacto del contexto actual para evitar
* sobrecarga de context window en sesiones largas.
 * 
 * Uso:
 *   node scripts/session-prune.mjs [ruta-a-project.md]
 */

import fs from 'fs';
import path from 'path';

function generatePruneSummary(projectRoot) {
  const root = projectRoot || process.cwd();
  
  // Leer archivos de estado
  const projectMd = tryRead(path.join(root, 'engineering-knowledge-base/project.md'));
  const registryMd = tryRead(path.join(root, 'engineering-knowledge-base/registry.md'));
  
  // Contar cambios recientes
  const changesDir = path.join(root, 'openspec/changes');
  const recentChanges = tryListDir(changesDir).slice(-5);
  
  // Generar resumen compacto
  const summary = [];
  
  summary.push('=== SESSION CONTEXT SUMMARY ===');
  summary.push('');
  
  if (projectMd) {
    // Extraer solo las últimas 10 líneas significativas
    const lines = projectMd.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(-10);
    summary.push('## Project State (recent)');
    summary.push(...lines);
  }
  
  if (registryMd) {
    const entries = registryMd.split('\n').filter(l => l.includes('|') && l.includes('✅')).slice(-5);
    summary.push('');
    summary.push('## Recent Changes (last 5)');
    summary.push(...entries);
  }
  
  if (recentChanges.length > 0) {
    summary.push('');
    summary.push('## Active Changes');
    recentChanges.forEach(c => summary.push(`- ${c}`));
  }
  
  summary.push('');
  summary.push('=== END SUMMARY ===');
  summary.push('');
  summary.push('[Use this compact context instead of full conversation history]');
  
  return summary.join('\n');
}

function tryRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function tryListDir(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

// CLI
const projectRoot = process.argv[2];
const summary = generatePruneSummary(projectRoot);
console.log(summary);

console.log('\n--- PRUNING INFO ---');
console.log(`Generated compact session context`);
console.log(`Chars: ${summary.length}`);
console.log(`Estimated tokens: ~${Math.ceil(summary.length / 4)}`);
console.log('===================\n');

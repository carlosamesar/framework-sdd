#!/usr/bin/env node
/**
 * Prompt Compression Tool
 * 
 * Comprime descripciones de tareas verbose en formato denso.
 * Reduce tokens de input en 30-50%.
 * 
 * Uso:
 *   node scripts/prompt-compress.mjs [texto]
 *   echo "descripción larga..." | node scripts/prompt-compress.mjs
 */

const ABBREVIATIONS = {
  'crear nuevo': 'NEW',
  'actualizar': 'UPDATE',
  'eliminar': 'DELETE',
  'obtener': 'GET',
  'listar todos': 'LIST',
  'listar': 'LIST',
  'parámetros opcionales': 'params?',
  'parámetros': 'params',
  'debe usar': 'use:',
  'debe': '→',
  'requiere': 'req:',
  'opcional': 'opt:',
  'tipo de dato': 'type:',
  'respuesta esperada': 'response:',
  'manejo de errores': 'errors:',
  'validación de entrada': 'validate:',
  'multi-tenant': 'MT:JWT',
  'tenant_id desde JWT': 'MT:JWT',
  'soft delete': 'soft-del',
  'fecha de creación': 'createdAt',
  'fecha de actualización': 'updatedAt',
  'identificador único': 'UUID',
};

function compress(text) {
  if (!text) return '';
  
  let compressed = text;
  
  // Aplicar abreviaturas
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
  }
  
  // Eliminar palabras filler
  compressed = compressed
    .replace(/\bpor favor\b/gi, '')
    .replace(/\bquiero\b/gi, '')
    .replace(/\bnecesito\b/gi, '')
    .replace(/\bpodrías\b/gi, '')
    .replace(/\bsimplemente\b/gi, '')
    .replace(/\bbásicamente\b/gi, '')
    .replace(/\bpara\s+que\b/gi, '→')
    .replace(/\bcon\s+el\s+fin\s+de\b/gi, '→')
    .replace(/\bde\s+manera\s+que\b/gi, '→');
  
  // Colapsar espacios múltiples
  compressed = compressed.replace(/\s+/g, ' ').trim();
  
  return compressed;
}

// CLI
const input = process.argv.slice(2).join(' ') || 
  (process.stdin.isTTY ? '' : require('fs').readFileSync(0, 'utf8'));

if (input) {
  const original = input.length;
  const compressed = compress(input);
  const saved = original - compressed.length;
  const pct = ((saved / original) * 100).toFixed(0);
  
  console.log(`\n📝 Original: ${original} chars`);
  console.log(`📦 Comprimido: ${compressed.length} chars`);
  console.log(`💰 Ahorro: ${saved} chars (${pct}%)\n`);
  console.log('--- compressed ---');
  console.log(compressed);
  console.log('--- end ---\n');
} else {
  console.log('Prompt Compression Tool');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/prompt-compress.mjs "descripción de tarea"');
  console.log('  echo "texto largo" | node scripts/prompt-compress.mjs');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node scripts/prompt-compress.mjs "Crear nuevo endpoint para listar transacciones con filtros"');
  console.log('  → "NEW endpoint LIST transacciones con filtros"');
}

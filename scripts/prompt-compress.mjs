#!/usr/bin/env node
/**
 * Prompt Compression Tool
 * Reduce ruido en prompts largos y entrega una versión más densa.
 */

import fs from 'fs';

const ABBREVIATIONS = {
  'crear nuevo': 'NEW',
  'crear': 'NEW',
  'actualizar': 'UPDATE',
  'eliminar': 'DELETE',
  'obtener': 'GET',
  'listar todos': 'LIST',
  'listar': 'LIST',
  'parámetros opcionales': 'params?',
  'parámetros': 'params',
  'respuesta esperada': 'response:',
  'validación de entrada': 'validate:',
  'manejo de errores': 'errors:',
  'multi-tenant': 'MT:JWT',
  'tenant_id desde JWT': 'MT:JWT',
  'base de datos': 'DB',
  'github actions': 'GHA',
};

function compress(text) {
  if (!text) return '';

  let compressed = text;
  for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
    compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
  }

  compressed = compressed
    .replace(/\bpor favor\b/gi, '')
    .replace(/\bquiero\b/gi, '')
    .replace(/\bnecesito\b/gi, '')
    .replace(/\bpodrías\b/gi, '')
    .replace(/\bbásicamente\b/gi, '')
    .replace(/\bcon\s+el\s+fin\s+de\b/gi, '→')
    .replace(/\bde\s+manera\s+que\b/gi, '→')
    .replace(/\s+/g, ' ')
    .trim();

  return compressed;
}

const argvInput = process.argv.slice(2).join(' ').trim();
const stdinInput = !process.stdin.isTTY ? fs.readFileSync(0, 'utf8').trim() : '';
const input = argvInput || stdinInput;

if (!input) {
  console.log('Prompt Compression Tool');
  console.log('Uso: node scripts/prompt-compress.mjs "texto"');
  process.exit(0);
}

const originalChars = input.length;
const compressed = compress(input);
const compressedChars = compressed.length;
const savedChars = originalChars - compressedChars;
const savedPct = originalChars > 0 ? ((savedChars / originalChars) * 100).toFixed(0) : '0';

console.log(`Original: ${originalChars} chars (~${Math.ceil(originalChars / 4)} tokens)`);
console.log(`Comprimido: ${compressedChars} chars (~${Math.ceil(compressedChars / 4)} tokens)`);
console.log(`Ahorro: ${savedChars} chars (${savedPct}%)`);
console.log('\n' + compressed);

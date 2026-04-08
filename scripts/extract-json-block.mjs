#!/usr/bin/env node
/**
 * Extrae objetos JSON de texto (transcripts del modelo).
 * - Por defecto: el primer objeto (fences ```json, trim {…}, o primer {…} balanceado).
 * - --all: todos los objetos (fences + barrido de {…} balanceados; dedupe por JSON.stringify).
 *
 * Uso:
 *   node scripts/extract-json-block.mjs [--all] [--array] [--pretty] [archivo]
 *   cat t.md | node scripts/extract-json-block.mjs --all | node scripts/validate-react-schemas.mjs --stdin-ndjson --schema specify
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Intenta parsear un objeto JSON balanceado desde text[start], que debe ser '{'.
 * @returns {{ value: object, nextIndex: number } | null}
 */
export function tryParseBalancedObject(text, start) {
  if (!text || start < 0 || start >= text.length || text[start] !== '{') return null;

  let depth = 0;
  let inString = false;
  let esc = false;

  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        try {
          const value = JSON.parse(slice);
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return { value, nextIndex: i + 1 };
          }
          return null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function pushParsedObjects(target, parsed) {
  if (parsed === null || parsed === undefined) return;
  if (Array.isArray(parsed)) {
    for (const x of parsed) {
      if (x !== null && typeof x === 'object' && !Array.isArray(x)) target.push(x);
    }
  } else if (typeof parsed === 'object') {
    target.push(parsed);
  }
}

/** Todos los objetos JSON encontrados (orden: bloques fenced, luego barrido izquierda-derecha). */
export function extractAllJsonObjects(text) {
  if (typeof text !== 'string' || !text.length) {
    throw new Error('Texto vacío');
  }

  const fromFences = [];
  const re = /```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1].trim();
    if (!inner) continue;
    try {
      pushParsedObjects(fromFences, JSON.parse(inner));
    } catch {
      /* ignorar fence inválido */
    }
  }

  const seen = new Set();
  const out = [];

  const addDedup = (obj) => {
    const key = JSON.stringify(obj);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(obj);
  };

  for (const o of fromFences) addDedup(o);

  let pos = 0;
  while (pos < text.length) {
    const idx = text.indexOf('{', pos);
    if (idx === -1) break;
    const parsed = tryParseBalancedObject(text, idx);
    if (!parsed) {
      pos = idx + 1;
      continue;
    }
    addDedup(parsed.value);
    pos = parsed.nextIndex;
  }

  if (out.length === 0) {
    throw new Error('No se encontró ningún objeto JSON');
  }
  return out;
}

export function extractFirstJsonObject(text) {
  if (typeof text !== 'string' || !text.length) {
    throw new Error('Texto vacío');
  }

  const fence = text.match(/```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```/i);
  if (fence) {
    const inner = fence[1].trim();
    try {
      const v = JSON.parse(inner);
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v;
      if (Array.isArray(v) && v.length && typeof v[0] === 'object' && !Array.isArray(v[0])) return v[0];
    } catch {
      /* continuar */
    }
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      const v = JSON.parse(trimmed);
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch {
      /* continuar */
    }
  }

  const start = text.indexOf('{');
  if (start === -1) {
    throw new Error('No se encontró inicio de objeto JSON ({)');
  }

  const parsed = tryParseBalancedObject(text, start);
  if (parsed) return parsed.value;

  throw new Error('Objeto JSON sin cerrar o mal formado');
}

function main() {
  const argv = process.argv.slice(2);
  const pretty = argv.includes('--pretty');
  const allMode = argv.includes('--all');
  const asArray = argv.includes('--array');
  const files = argv.filter((a) => !a.startsWith('--'));

  let raw;
  if (files.length > 0) {
    raw = fs.readFileSync(files[0], 'utf8');
  } else {
    raw = fs.readFileSync(0, 'utf8');
  }

  try {
    if (allMode) {
      const objs = extractAllJsonObjects(raw);
      if (asArray) {
        const out = pretty ? JSON.stringify(objs, null, 2) : JSON.stringify(objs);
        process.stdout.write(out + '\n');
      } else {
        for (const o of objs) {
          process.stdout.write(JSON.stringify(o) + '\n');
        }
      }
    } else {
      const obj = extractFirstJsonObject(raw);
      const out = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      process.stdout.write(out + '\n');
    }
  } catch (e) {
    console.error('extract-json-block:', e.message);
    process.exit(1);
  }
}

const selfPath = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && path.resolve(selfPath) === path.resolve(process.argv[1]);
if (invoked) {
  main();
}

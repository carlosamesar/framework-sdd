#!/usr/bin/env node
/**
 * Valida los JSON de ejemplo contra los esquemas ReAct (*.output.schema.json) con Ajv draft 2020-12.
 *
 * Modo batch (default): todos los *.schema.json en openspec/templates/react-outputs vs examples/*.example.json
 *
 * Modo ad-hoc:
 *   node scripts/validate-react-schemas.mjs --data <archivo.json> --schema <nombre|archivo>
 *   <nombre>: specify | plan | breakdown | verify  → resuelve a *.output.schema.json
 *   <archivo>: ruta absoluta o relativa a un .schema.json
 *
 * Modo stdin (salida del modelo / pipe):
 *   node scripts/validate-react-schemas.mjs --stdin --schema specify
 *   El stdin debe ser un único objeto JSON (sin fences markdown).
 *
 * Modo stdin NDJSON (varios objetos, una línea cada uno — típico tras extract-json-block --all):
 *   node scripts/validate-react-schemas.mjs --stdin-ndjson --schema specify
 */
import fs from 'fs';
import path from 'path';
import Ajv2020 from 'ajv/dist/2020.js';
import { getProjectRoot, getPackageRoot } from './lib/paths.mjs';

const PROJECT_ROOT = getProjectRoot();
const PACKAGE_ROOT = getPackageRoot();
const TEMPLATES = path.join(PACKAGE_ROOT, 'openspec', 'templates', 'react-outputs');
const EXAMPLES = path.join(TEMPLATES, 'examples');

function assertResolvedUnderRepo(absPath, label) {
  const resolved = path.resolve(absPath);
  const root = path.resolve(PROJECT_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    console.error(`${label} fuera del proyecto:`, absPath);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const useNdjson = argv.includes('--stdin-ndjson');
  const useStdin = argv.includes('--stdin');
  const dataIdx = argv.indexOf('--data');
  const schemaIdx = argv.indexOf('--schema');

  if (useNdjson && useStdin) {
    console.error('Use solo uno de --stdin o --stdin-ndjson');
    process.exit(1);
  }

  if (useNdjson) {
    if (schemaIdx === -1) {
      console.error('Modo stdin-ndjson: requiere --schema <nombre|path>');
      process.exit(1);
    }
    const schemaArg = argv[schemaIdx + 1];
    if (!schemaArg || schemaArg.startsWith('--')) {
      console.error('Uso: --stdin-ndjson --schema specify|plan|breakdown|verify|<ruta.schema.json>');
      process.exit(1);
    }
    return { mode: 'stdin-ndjson', schemaArg };
  }

  if (useStdin) {
    if (schemaIdx === -1) {
      console.error('Modo stdin: requiere --schema <nombre|path>');
      process.exit(1);
    }
    const schemaArg = argv[schemaIdx + 1];
    if (!schemaArg || schemaArg.startsWith('--')) {
      console.error('Uso: --stdin --schema specify|plan|breakdown|verify|<ruta.schema.json>');
      process.exit(1);
    }
    return { mode: 'stdin', schemaArg };
  }

  if (dataIdx === -1 && schemaIdx === -1) return { mode: 'batch' };
  if (dataIdx === -1 || schemaIdx === -1) {
    console.error('Modo ad-hoc: requiere ambos --data <path> y --schema <nombre|path>');
    process.exit(1);
  }
  const dataPath = argv[dataIdx + 1];
  const schemaArg = argv[schemaIdx + 1];
  if (!dataPath || !schemaArg || dataPath.startsWith('--') || schemaArg.startsWith('--')) {
    console.error('Uso: --data <archivo.json> --schema specify|plan|breakdown|verify|<ruta.schema.json>');
    process.exit(1);
  }
  return { mode: 'adhoc', dataPath, schemaArg };
}

function resolveSchemaPath(schemaArg) {
  if (path.isAbsolute(schemaArg)) {
    if (fs.existsSync(schemaArg) && schemaArg.endsWith('.json')) return schemaArg;
  } else {
    const inProj = path.join(PROJECT_ROOT, schemaArg);
    if (fs.existsSync(inProj) && inProj.endsWith('.json')) return inProj;
    const inPkg = path.join(PACKAGE_ROOT, schemaArg);
    if (fs.existsSync(inPkg) && inPkg.endsWith('.json')) return inPkg;
  }

  const short = schemaArg.replace(/\.schema\.json$/i, '').replace(/\.output$/i, '');
  const candidate = path.join(TEMPLATES, `${short}.output.schema.json`);
  if (fs.existsSync(candidate)) return candidate;

  const legacy = path.join(TEMPLATES, `${short}.schema.json`);
  if (fs.existsSync(legacy)) return legacy;

  return null;
}

function compileValidator(schemaPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const schema = { ...raw };
  delete schema.$schema;
  const validate = ajv.compile(schema);
  return { ajv, validate };
}

function compileAndValidate(schemaPath, data) {
  const { ajv, validate } = compileValidator(schemaPath);
  if (!validate(data)) {
    return { ok: false, errors: ajv.errorsText(validate.errors) };
  }
  return { ok: true };
}

function readStdinJson() {
  const raw = fs.readFileSync(0, 'utf8').trim();
  if (!raw) {
    console.error('stdin vacío');
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('JSON inválido en stdin:', e.message);
    process.exit(1);
  }
}

function runStdinNdjson(schemaArg) {
  const schemaPath = resolveSchemaPath(schemaArg);
  if (!schemaPath) {
    console.error('No se resolvió esquema para:', schemaArg, '(buscado en', TEMPLATES + ')');
    process.exit(1);
  }
  assertResolvedUnderRepo(schemaPath, 'schema');
  const { ajv, validate } = compileValidator(schemaPath);
  const raw = fs.readFileSync(0, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    console.error('stdin vacío');
    process.exit(1);
  }
  for (let i = 0; i < lines.length; i++) {
    let data;
    try {
      data = JSON.parse(lines[i]);
    } catch (e) {
      console.error(`Línea ${i + 1}: JSON inválido —`, e.message);
      process.exit(1);
    }
    if (!validate(data)) {
      console.error(
        `Línea ${i + 1}: no cumple esquema —`,
        ajv.errorsText(validate.errors),
      );
      process.exit(1);
    }
  }
  console.log(
    'spec:validate-react — OK (stdin-ndjson, %d líneas) vs %s',
    lines.length,
    path.relative(PROJECT_ROOT, schemaPath),
  );
}

function runStdin(schemaArg) {
  const data = readStdinJson();
  const schemaPath = resolveSchemaPath(schemaArg);
  if (!schemaPath) {
    console.error('No se resolvió esquema para:', schemaArg, '(buscado en', TEMPLATES + ')');
    process.exit(1);
  }
  assertResolvedUnderRepo(schemaPath, 'schema');
  const result = compileAndValidate(schemaPath, data);
  if (!result.ok) {
    console.error('spec:validate-react — error contra', path.relative(PROJECT_ROOT, schemaPath));
    console.error(' ', result.errors);
    process.exit(1);
  }
  console.log(
    'spec:validate-react — OK (stdin) vs %s',
    path.relative(PROJECT_ROOT, schemaPath),
  );
}

function runAdhoc(dataPath, schemaArg) {
  const dataAbs = path.isAbsolute(dataPath) ? dataPath : path.join(PROJECT_ROOT, dataPath);
  assertResolvedUnderRepo(dataAbs, 'data');
  if (!fs.existsSync(dataAbs)) {
    console.error('No existe archivo de datos:', dataAbs);
    process.exit(1);
  }
  const schemaPath = resolveSchemaPath(schemaArg);
  if (!schemaPath) {
    console.error('No se resolvió esquema para:', schemaArg, '(buscado en', TEMPLATES + ')');
    process.exit(1);
  }
  assertResolvedUnderRepo(schemaPath, 'schema');

  let data;
  try {
    data = JSON.parse(fs.readFileSync(dataAbs, 'utf8'));
  } catch (e) {
    console.error('JSON inválido en', dataAbs, e.message);
    process.exit(1);
  }

  const result = compileAndValidate(schemaPath, data);
  if (!result.ok) {
    console.error('spec:validate-react — error contra', path.relative(PROJECT_ROOT, schemaPath));
    console.error(' ', result.errors);
    process.exit(1);
  }
  console.log(
    'spec:validate-react — OK (adhoc) %s vs %s',
    path.relative(PROJECT_ROOT, dataAbs),
    path.relative(PROJECT_ROOT, schemaPath),
  );
}

function runBatch() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const errors = [];

  const schemaFiles = fs.existsSync(TEMPLATES)
    ? fs.readdirSync(TEMPLATES).filter((f) => f.endsWith('.schema.json'))
    : [];

  if (schemaFiles.length === 0) {
    console.error('No se encontraron esquemas en', TEMPLATES);
    process.exit(1);
  }

  for (const sf of schemaFiles) {
    const schemaPath = path.join(TEMPLATES, sf);
    const raw = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const schema = { ...raw };
    delete schema.$schema;
    let validate;
    try {
      validate = ajv.compile(schema);
    } catch (e) {
      errors.push(`[${sf}] compile: ${e.message}`);
      continue;
    }

    const exampleName = sf.replace(/\.schema\.json$/i, '.example.json');
    const examplePath = path.join(EXAMPLES, exampleName);
    if (!fs.existsSync(examplePath)) {
      errors.push(`Falta ejemplo para ${sf}: examples/${exampleName}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    if (!validate(data)) {
      errors.push(`[${exampleName}] ${ajv.errorsText(validate.errors)}`);
    }
  }

  if (errors.length) {
    console.error('spec:validate-react — errores:');
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }

  console.log('spec:validate-react — OK (%d esquemas)', schemaFiles.length);
}

function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);
  if (parsed.mode === 'adhoc') {
    runAdhoc(parsed.dataPath, parsed.schemaArg);
  } else if (parsed.mode === 'stdin-ndjson') {
    runStdinNdjson(parsed.schemaArg);
  } else if (parsed.mode === 'stdin') {
    runStdin(parsed.schemaArg);
  } else {
    runBatch();
  }
}

main();

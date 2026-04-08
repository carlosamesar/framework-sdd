#!/usr/bin/env node
/**
 * Valida los JSON de ejemplo contra los esquemas ReAct (*.output.schema.json) con Ajv draft 2020-12.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const TEMPLATES = path.join(REPO_ROOT, 'openspec', 'templates', 'react-outputs');
const EXAMPLES = path.join(TEMPLATES, 'examples');

function main() {
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

main();

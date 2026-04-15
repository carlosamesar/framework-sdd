#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const sourceDir = path.join(ROOT, '.claude', 'commands', 'gd');
const promptsDir = path.join(ROOT, '.github', 'prompts');

if (!fs.existsSync(sourceDir)) {
  console.error('No existe el catálogo fuente:', sourceDir);
  process.exit(1);
}

fs.mkdirSync(promptsDir, { recursive: true });

const files = fs.readdirSync(sourceDir)
  .filter((name) => name.endsWith('.md'))
  .sort((a, b) => a.localeCompare(b, 'es'));

const created = [];
for (const file of files) {
  const base = path.basename(file, '.md');
  const promptFileName = `gd-${base}.prompt.md`;
  const promptPath = path.join(promptsDir, promptFileName);
  const sourceRelative = path.posix.join('.claude', 'commands', 'gd', file);
  const commandName = `/gd-${base}`;
  const canonicalName = `/gd:${base}`;

  const content = `---
mode: ask
description: "${canonicalName} — comando SDD disponible en VS Code como ${commandName}"
---

Usa como contrato canónico la guía en [${sourceRelative}](../${sourceRelative}).

Instrucciones:
- sigue estrictamente las reglas del archivo fuente y las instrucciones del workspace;
- usa la estructura real del repositorio antes de proponer cambios;
- si el requerimiento es transversal, respeta el orden BD → backend → frontend → certificación;
- no declares cierre sin evidencia de pruebas.

Ejecuta el comportamiento de ${canonicalName} con base en el requerimiento actual del usuario.
`;

  fs.writeFileSync(promptPath, content, 'utf8');
  created.push(promptFileName);
}

const indexPath = path.join(promptsDir, 'gd-catalog.prompt.md');
const indexContent = `---
mode: ask
description: "Catálogo VS Code de comandos gd:* del framework"
---

Muestra los comandos disponibles instalados en VS Code, explica cuál conviene usar y redirige al flujo correcto.

Formato esperado:
- comando sugerido
- cuándo usarlo
- siguiente paso recomendado
`;
fs.writeFileSync(indexPath, indexContent, 'utf8');

console.log(`Prompts generados: ${created.length + 1}`);
console.log(`Directorio: ${promptsDir}`);

#!/usr/bin/env node
/**
 * Instalador de dependencias del paquete @framework-sdd/sdd-agent-orchestrator.
 * Desarrollo: npm run agent:install
 * Producción: npm run agent:install:production  (o --production / SDD_AGENT_INSTALL_PRODUCTION=1)
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREFIX = path.join(ROOT, 'packages', 'sdd-agent-orchestrator');

const argv = process.argv.slice(2);
const production =
  argv.includes('--production') ||
  process.env.SDD_AGENT_INSTALL_PRODUCTION === '1' ||
  process.env.NODE_ENV === 'production';

const major = Number.parseInt(process.versions.node.split('.')[0], 10);
if (Number.isFinite(major) && major < 20) {
  console.error('install-sdd-agent: se requiere Node.js >= 20 (actual:', process.version, ')');
  process.exit(1);
}

if (!fs.existsSync(path.join(PREFIX, 'package.json'))) {
  console.error('install-sdd-agent: no existe', PREFIX);
  process.exit(1);
}

const hasLock = fs.existsSync(path.join(PREFIX, 'package-lock.json'));
const npmCmd = hasLock ? 'ci' : 'install';
const npmExtra = production ? ['--omit=dev'] : [];
console.log(
  `install-sdd-agent: npm ${npmCmd}${production ? ' --omit=dev' : ''} --prefix packages/sdd-agent-orchestrator`,
);

const r = spawnSync('npm', [npmCmd, '--prefix', PREFIX, ...npmExtra], {
  stdio: 'inherit',
  cwd: ROOT,
  env: { ...process.env, NODE_ENV: production ? 'production' : process.env.NODE_ENV },
});

if (r.status !== 0) {
  process.exit(r.status === null ? 1 : r.status);
}

const envExample = path.join(PREFIX, '.env.example');
const envLocal = path.join(PREFIX, '.env');
if (!production && fs.existsSync(envExample) && !fs.existsSync(envLocal)) {
  fs.copyFileSync(envExample, envLocal);
  console.log(
    'install-sdd-agent: creado packages/sdd-agent-orchestrator/.env desde .env.example (editá OPENAI_API_KEY si usás llm)',
  );
} else if (production && !fs.existsSync(envLocal)) {
  console.log(
    'install-sdd-agent: modo producción — no se crea .env local; inyectá secretos vía entorno o secret store.',
  );
}

console.log('install-sdd-agent: listo. Probar: npx sdd-agent list-tools');

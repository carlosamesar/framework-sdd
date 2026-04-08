/**
 * Raíz del paquete framework-sdd (donde viven scripts/ y plantillas publicadas).
 * Raíz del proyecto del usuario (OpenSpec bajo openspec/).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __libDir = path.dirname(fileURLToPath(import.meta.url));

export function getPackageRoot() {
  return path.resolve(__libDir, '..', '..');
}

/**
 * Proyecto a validar: env > cwd con openspec/ > paquete instalado.
 * Para `npx framework-sdd` en un monorepo, ejecutar desde la raíz que contiene openspec/
 * o usar --project-root / FRAMEWORK_SDD_PROJECT_ROOT.
 */
export function getProjectRoot() {
  if (process.env.FRAMEWORK_SDD_PROJECT_ROOT) {
    return path.resolve(process.env.FRAMEWORK_SDD_PROJECT_ROOT);
  }
  const cwd = process.cwd();
  if (
    fs.existsSync(path.join(cwd, 'openspec', 'changes')) ||
    fs.existsSync(path.join(cwd, 'openspec', 'config.yaml'))
  ) {
    return cwd;
  }
  return getPackageRoot();
}

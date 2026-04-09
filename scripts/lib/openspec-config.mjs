/**
 * Resolución de `changes_root` con soporte multi-proyecto (openspec/config.yaml).
 * Prioridad: FRAMEWORK_SDD_OPENSPEC_PROJECT > active_project > único proyecto definido.
 */
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export function loadOpenspecConfig(repoRoot) {
  const cfgPath = path.join(repoRoot, 'openspec', 'config.yaml');
  if (!fs.existsSync(cfgPath)) return null;
  try {
    return yaml.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeRoot(rel) {
  return String(rel || '')
    .trim()
    .replace(/\/$/, '');
}

/**
 * @param {string} repoRoot raíz del monorepo (getProjectRoot)
 * @returns {{ changesRoot: string, activeProject: string | null, source: string }}
 */
export function resolveOpenspecContext(repoRoot) {
  const doc = loadOpenspecConfig(repoRoot);
  if (!doc) {
    return {
      changesRoot: path.join('openspec', 'changes'),
      activeProject: null,
      source: 'default',
    };
  }

  const projects = doc.projects;
  if (projects && typeof projects === 'object' && !Array.isArray(projects)) {
    const keys = Object.keys(projects).filter((k) => projects[k] && projects[k].changes_root);
    if (keys.length > 0) {
      const envName = process.env.FRAMEWORK_SDD_OPENSPEC_PROJECT?.trim();
      let active =
        envName ||
        (typeof doc.active_project === 'string' ? doc.active_project.trim() : '') ||
        (keys.length === 1 ? keys[0] : '');
      if (!active) {
        throw new Error(
          `openspec/config.yaml: hay varios proyectos (${keys.join(', ')}) — definí active_project o exportá FRAMEWORK_SDD_OPENSPEC_PROJECT.`,
        );
      }
      const entry = projects[active];
      if (!entry?.changes_root) {
        throw new Error(
          `openspec/config.yaml: proyecto "${active}" sin changes_root. Disponibles: ${keys.join(', ')}`,
        );
      }
      return {
        changesRoot: normalizeRoot(entry.changes_root),
        activeProject: active,
        source: envName ? 'env:FRAMEWORK_SDD_OPENSPEC_PROJECT' : 'config:active_project',
      };
    }
  }

  const legacy =
    doc.paths?.changes_root ?? doc.changes_root ?? path.join('openspec', 'changes');
  return {
    changesRoot: normalizeRoot(legacy),
    activeProject: null,
    source: 'paths.changes_root',
  };
}

export function resolveChangesRoot(repoRoot) {
  return resolveOpenspecContext(repoRoot).changesRoot;
}

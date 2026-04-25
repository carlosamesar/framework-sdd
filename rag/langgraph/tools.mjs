/**
 * tools.mjs — LangChain Tool wrappers for CLI evidence scripts.
 *
 * Each tool runs the corresponding rag/scripts/* CLI via spawnSync so it is
 * fully deterministic (no network calls).  Tools are passed to LLM agent nodes
 * so the model can invoke them when generating evidence.
 */
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCRIPTS_DIR = resolve(__dirname, '../scripts');
const REPO_ROOT = resolve(__dirname, '../../');

function runScript(scriptName, args = []) {
  const result = spawnSync(
    'node',
    [join(SCRIPTS_DIR, scriptName), ...args],
    { cwd: REPO_ROOT, encoding: 'utf8', timeout: 60_000 }
  );
  if (result.error) throw result.error;
  const combined = (result.stdout ?? '') + (result.stderr ?? '');
  if (result.status !== 0) {
    throw new Error(`${scriptName} exited ${result.status}: ${combined.slice(0, 500)}`);
  }
  return combined.trim();
}

// ─── captureEvidenceTool ────────────────────────────────────────────────────

export const captureEvidenceTool = new DynamicStructuredTool({
  name: 'capture_evidence',
  description: 'Capture a piece of evidence (code, test, review_decision, verification, deployment_report) into the audit DB.',
  schema: z.object({
    type: z.enum(['code', 'test', 'review_decision', 'verification', 'deployment_report']),
    change: z.string().describe('The change_slug for this run'),
    title: z.string(),
    description: z.string(),
    metadata: z.string().describe('JSON string with type-specific fields, e.g. {"task_id":"T1"} or {"passed":true}'),
  }),
  func: async ({ type, change, title, description, metadata }) => {
    return runScript('capture-evidence.mjs', [
      `--type=${type}`,
      `--change=${change}`,
      `--title=${title}`,
      `--description=${description}`,
      `--metadata=${metadata}`,
    ]);
  },
});

// ─── searchEvidenceTool ──────────────────────────────────────────────────────

export const searchEvidenceTool = new DynamicStructuredTool({
  name: 'search_evidence',
  description: 'Full-text search across existing evidence in the audit DB. Use to find prior patterns or knowledge.',
  schema: z.object({
    query: z.string(),
    limit:  z.number().optional().default(5),
  }),
  func: async ({ query, limit }) => {
    return runScript('search.mjs', [`--query=${query}`, `--limit=${limit}`]);
  },
});

// ─── runPipelineTool ─────────────────────────────────────────────────────────

export const runPipelineTool = new DynamicStructuredTool({
  name: 'run_pipeline',
  description: 'Run the Phase 1 deterministic pipeline checker and return the JSON result (certified/blocked + current_phase + score).',
  schema: z.object({
    change: z.string().describe('The change_slug to check'),
  }),
  func: async ({ change }) => {
    const result = spawnSync(
      'node',
      [join(SCRIPTS_DIR, 'run-pipeline.mjs'), `--change=${change}`, '--json'],
      { cwd: REPO_ROOT, encoding: 'utf8', timeout: 60_000 }
    );
    const out = (result.stdout ?? '') + (result.stderr ?? '');
    // exit code 2 = blocked, 0 = certified — both are expected non-error exits
    if (result.error) throw result.error;
    return out.trim();
  },
});

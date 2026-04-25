/**
 * run.mjs — CLI entry point for the Phase 2 LangGraph pipeline.
 *
 * Usage:
 *   node rag/langgraph/run.mjs --change=<slug> [--spec=<path>] [--max-retries=<n>] [--json]
 *
 * Environment variables required:
 *   LLM_PROVIDER         — anthropic | openrouter (default: anthropic)
 *   ANTHROPIC_API_KEY    — Required when LLM_PROVIDER=anthropic
 *   OPENROUTER_API_KEY   — Required when LLM_PROVIDER=openrouter
 *
 * Exit codes:
 *   0  — Pipeline ran to completion (check pipeline_result.certified for outcome)
 *   1  — Fatal error (missing spec, API key, etc.)
 */
import { resolve, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { app } from './graph.mjs';
import { resolveLlmProvider } from './llm.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../');

// Load env explicitly from the repository root so both
// `node rag/langgraph/run.mjs` and `cd rag && npm run sdd:run` work.
dotenv.config({ path: join(REPO_ROOT, '.env') });
dotenv.config();

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [k, ...v] = a.slice(2).split('=');
      return [k, v.length ? v.join('=') : 'true'];
    })
);

const changeSlug  = args['change'];
const specPath    = args['spec'];
const maxRetries  = parseInt(args['max-retries'] ?? '3', 10);
const jsonOutput  = args['json'] === 'true';

if (!changeSlug) {
  console.error('Usage: node run.mjs --change=<slug> [--spec=<path>] [--max-retries=3] [--json]');
  process.exit(1);
}

const llmProvider = resolveLlmProvider();

if (llmProvider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter.');
  process.exit(1);
}

if (llmProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic.');
  process.exit(1);
}

// ─── Resolve spec ─────────────────────────────────────────────────────────────

const resolvedSpecPath = specPath
  ? resolve(process.cwd(), specPath)
  : join(REPO_ROOT, 'openspec', 'changes', changeSlug, 'spec.md');

if (!existsSync(resolvedSpecPath)) {
  console.error(`Spec not found: ${resolvedSpecPath}`);
  console.error(`Create it at openspec/changes/${changeSlug}/spec.md or pass --spec=<path>`);
  process.exit(1);
}

const specContent = readFileSync(resolvedSpecPath, 'utf8');
const runId = randomUUID();

// ─── Run the graph ────────────────────────────────────────────────────────────

if (!jsonOutput) {
  console.log(`\n🚀  SDD Phase 2 — LangGraph pipeline`);
  console.log(`   change  : ${changeSlug}`);
  console.log(`   run_id  : ${runId}`);
  console.log(`   spec    : ${resolvedSpecPath}`);
  console.log(`   retries : max ${maxRetries}\n`);
}

const initialInput = {
  change_slug: changeSlug,
  run_id: runId,
  spec_content: specContent,
  max_retries: maxRetries,
  retry_count: 0,
  messages: [],
};

try {
  const finalState = await app.invoke(initialInput);

  const output = {
    change_slug: changeSlug,
    run_id: runId,
    certified: finalState.pipeline_result?.certified ?? false,
    score: finalState.pipeline_result?.score ?? 0,
    pipeline_result: finalState.pipeline_result,
    review_decision: finalState.review_decision,
    retry_count: finalState.retry_count,
    messages: finalState.messages,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    const cert = output.certified ? '✅  CERTIFIED' : '❌  NOT CERTIFIED';
    console.log(`\n${cert}`);
    console.log(`   Score        : ${output.score}%`);
    console.log(`   Review       : ${output.review_decision}`);
    console.log(`   Retries used : ${output.retry_count}`);
    console.log('\n── Agent messages ─────────────────────────────────────────');
    output.messages.forEach(m => console.log(' •', m));
    if (finalState.pipeline_result) {
      console.log('\n── Pipeline result ────────────────────────────────────────');
      console.log(JSON.stringify(finalState.pipeline_result, null, 2));
    }
  }

  process.exit(0);
} catch (err) {
  const errorMessage = String(err.message ?? err);
  const normalizedError = errorMessage.includes('credit balance is too low') || errorMessage.toLowerCase().includes('insufficient credits')
    ? `${llmProvider} API key loaded, but the account has insufficient credits.`
    : errorMessage;
  const out = { error: normalizedError, change_slug: changeSlug, run_id: runId };
  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.error('\n❌  Fatal error:', normalizedError);
    if (process.env.DEBUG) console.error(err.stack);
  }
  process.exit(1);
}

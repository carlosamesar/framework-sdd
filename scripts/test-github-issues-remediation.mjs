import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ticketing = require('../packages/sdd-ticket-management/index.cjs');

async function run() {
  assert.equal(typeof ticketing.createIssue, 'function', 'createIssue debe existir');
  assert.equal(typeof ticketing.validateGitHubAccess, 'function', 'validateGitHubAccess debe existir');

  const dryRunResult = await ticketing.createIssue({
    owner: 'demo-owner',
    repo: 'demo-repo',
    title: 'Dry run issue',
    body: 'No debe llamar a GitHub',
    dryRun: true,
  });

  assert.equal(dryRunResult.dryRun, true, 'debe marcar dryRun=true');
  assert.match(dryRunResult.html_url, /^dry-run:\/\//, 'debe devolver URL simulada');

  const validation = await ticketing.validateGitHubAccess({
    owner: 'demo-owner',
    repo: 'demo-repo',
    dryRun: true,
  });

  assert.equal(validation.ok, true, 'la validación dry-run debe ser exitosa');
  assert.equal(validation.dryRun, true, 'la validación debe indicar dry-run');

  const previousGitHubToken = process.env.GITHUB_TOKEN;
  const previousGhToken = process.env.GH_TOKEN;
  delete process.env.GITHUB_TOKEN;
  process.env.GH_TOKEN = 'fallback-token';

  const fallbackContext = ticketing.resolveGitHubContext({
    owner: 'demo-owner',
    repo: 'demo-repo',
  });

  assert.equal(fallbackContext.tokenPresent, true, 'debe detectar GH_TOKEN como fallback');

  if (previousGitHubToken) process.env.GITHUB_TOKEN = previousGitHubToken;
  if (previousGhToken) process.env.GH_TOKEN = previousGhToken;
  else delete process.env.GH_TOKEN;

  console.log('OK: github issues remediation smoke test passed');
}

run().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});

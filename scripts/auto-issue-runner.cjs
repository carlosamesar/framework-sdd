// Auto Issue Runner for gd:start
// Requiere: GITHUB_TOKEN con permisos de issues y repo, Node.js >=18
// Uso: node scripts/auto-issue-runner.cjs

const { Octokit } = require('octokit');
const { execSync } = require('child_process');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'framework-sdd';
const OWNER = 'carlosamesar';
const POLL_INTERVAL = 60 * 1000; // 1 minuto

if (!GITHUB_TOKEN) {
  console.error('Falta GITHUB_TOKEN en .env');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getOpenIssues() {
  const { data } = await octokit.rest.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    state: 'open',
    labels: '',
  });
  return data;
}

async function commentOnIssue(issue_number, body) {
  await octokit.rest.issues.createComment({
    owner: OWNER,
    repo: REPO,
    issue_number,
    body,
  });
}

async function runPipeline(issue) {
  const issue_number = issue.number;
  try {
    await commentOnIssue(issue_number, ':robot: Ejecutando pipeline gd:start...');
    // Ejecuta el pipeline gd:start (ajusta el comando si es necesario)
    const output = execSync('node bin/gd-orchestrate.cjs', { encoding: 'utf-8' });
    await commentOnIssue(issue_number, `✅ Pipeline ejecutado con éxito.\n\n\`
${output}\n\``);
  } catch (err) {
    await commentOnIssue(issue_number, `❌ Error al ejecutar pipeline:\n\n\`
${err.message}\n\``);
  }
}

let processed = new Set();

async function main() {
  while (true) {
    const issues = await getOpenIssues();
    for (const issue of issues) {
      if (!processed.has(issue.number) && /orquestaci[oó]n|gd:start/i.test(issue.title + issue.body)) {
        await runPipeline(issue);
        processed.add(issue.number);
      }
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

main();

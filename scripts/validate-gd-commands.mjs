#!/usr/bin/env node
/**
 * Validates all gd:* commands in .claude/commands/gd/*.md against COMMANDS-INDEX.md.
 * Checks schema (heading, trigger, steps) and optionally runs CLI smoke.
 * Writes reports/gd-commands-report.json. Exit 0 = OK, 1 = failures.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProjectRoot } from './lib/paths.mjs';

const REPO_ROOT = getProjectRoot();

// ─── Regex patterns (reused from validate-spec.mjs approach) ─────────────────

/** Matches a top-level markdown heading */
const RE_HEADING = /^#{1,3}\s+.+/m;

/** Matches the word "trigger" as a keyword (case-insensitive) */
const RE_TRIGGER = /\btrigger\b/i;

/** Matches numbered list item (1. foo) */
const RE_NUMBERED_LIST = /^\d+\.\s+.+/m;

/** Matches a markdown checkbox list (- [ ] or - [x]) */
const RE_STEPS_CHECKBOX = /^-\s*\[[ xX]\]/m;

/** Matches any "steps" section or "## Paso" */
const RE_STEPS_SECTION = /^#{1,3}\s+(?:step|paso|pasos|steps)\b/im;

// ─── Phase stubs ──────────────────────────────────────────────────────────────

/**
 * @typedef {{ name: string; file: string; slug: string }} CommandEntry
 * @typedef {{ name: string; file: string; slug: string; indexed: boolean; extra: boolean }} CommandInventoryItem
 * @typedef {{ schema: 'pass'|'fail'; errors: string[] }} SchemaResult
 * @typedef {{ smoke: 'pass'|'skipped'|'fail'; smokeError?: string }} SmokeResult
 * @typedef {{ name: string; file: string; status: 'pass'|'warn'|'fail'; schema: 'pass'|'fail'; smoke: 'pass'|'skipped'|'fail'; errors: string[] }} CommandReport
 */

/**
 * Returns the list of commands in COMMANDS-INDEX.md (as slugs like "start", "implement", etc.)
 * Parses lines like `- /gd:start` or `- clarificar: /gd:clarify, /gd:specify`
 */
function parseIndexedCommands(indexContent) {
  const slugs = new Set();
  const gdPattern = /\/gd:([a-zA-Z0-9_-]+)/g;
  let m;
  while ((m = gdPattern.exec(indexContent)) !== null) {
    slugs.add(m[1]);
  }
  return slugs;
}

/**
 * Inventories .claude/commands/gd/*.md, cross-references with COMMANDS-INDEX.md.
 * @returns {{ commands: CommandInventoryItem[]; missing: string[]; extra: string[] }}
 */
export function inventoryCommands(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const gdDir = path.join(repoRoot, '.claude', 'commands', 'gd');
  const indexPath = path.join(repoRoot, 'COMMANDS-INDEX.md');

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const indexedSlugs = parseIndexedCommands(indexContent);

  const files = fs
    .readdirSync(gdDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const commands = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const name = `gd:${slug}`;
    return {
      name,
      file: path.join('.claude', 'commands', 'gd', f),
      slug,
      indexed: indexedSlugs.has(slug),
      extra: !indexedSlugs.has(slug),
    };
  });

  const fileSlugs = new Set(files.map((f) => f.replace(/\.md$/, '')));
  const missing = [...indexedSlugs].filter((s) => !fileSlugs.has(s));
  const extra = commands.filter((c) => c.extra).map((c) => c.slug);

  return { commands, missing, extra };
}

/**
 * Validates the schema of a single command file.
 * Checks: heading/description, `trigger` keyword, steps/numbered-list body.
 * @param {string} filePath — absolute path to the .md file
 * @returns {SchemaResult}
 */
export function validateSchema(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return validateSchemaContent(content, filePath);
}

/**
 * Inner logic — accepts content string (testable without FS).
 * @param {string} content
 * @param {string} [label]
 * @returns {SchemaResult}
 */
export function validateSchemaContent(content, label = '') {
  const errors = [];

  // Rule 1: must have a heading or description field
  const hasHeading = RE_HEADING.test(content);
  const hasFrontmatterDescription = /^description\s*:/im.test(content);
  if (!hasHeading && !hasFrontmatterDescription) {
    errors.push('missing_field: heading_or_description');
  }

  // Rule 2: must have trigger keyword
  if (!RE_TRIGGER.test(content)) {
    errors.push('missing_field: trigger');
  }

  // Rule 3: must have steps or numbered-list body
  const hasStepsSection = RE_STEPS_SECTION.test(content);
  const hasNumberedList = RE_NUMBERED_LIST.test(content);
  const hasCheckboxSteps = RE_STEPS_CHECKBOX.test(content);
  if (!hasStepsSection && !hasNumberedList && !hasCheckboxSteps) {
    errors.push('missing_field: steps_or_numbered_list');
  }

  return { schema: errors.length === 0 ? 'pass' : 'fail', errors };
}

/**
 * Attempts CLI smoke run if OpenCode binary is present.
 * Always returns { smoke: 'skipped' } if CLI is absent (no hard dependency).
 * @returns {SmokeResult}
 */
export function runSmoke(_command) {
  // Smoke execution requires an interactive OpenCode CLI session with a project context.
  // Since no dry-run mode exists for OpenCode commands today, smoke is stubbed as 'skipped'.
  // This is intentional: deferred to a future change once a headless/dry-run mode is available.
  return { smoke: 'skipped' };
}

/**
 * Assembles the final report object.
 * @param {CommandReport[]} results
 * @returns {object} report JSON object
 */
export function buildReport(results) {
  const total = results.length;
  const pass = results.filter((r) => r.status === 'pass').length;
  const warn = results.filter((r) => r.status === 'warn').length;
  const fail = results.filter((r) => r.status === 'fail').length;

  return {
    generated: new Date().toISOString(),
    summary: { total, pass, warn, fail },
    commands: results,
  };
}

/**
 * Determines overall status for a command given schema + smoke results + indexed flag.
 * @param {CommandInventoryItem} item
 * @param {SchemaResult} schemaResult
 * @param {SmokeResult} smokeResult
 * @returns {'pass'|'warn'|'fail'}
 */
function resolveStatus(item, schemaResult, smokeResult) {
  if (schemaResult.schema === 'fail') return 'fail';
  if (smokeResult.smoke === 'fail') return 'fail';
  if (!item.indexed) return 'warn'; // present on disk but not in index
  return 'pass';
}

// ─── main ─────────────────────────────────────────────────────────────────────

function main() {
  const { commands, missing, extra } = inventoryCommands();

  const results = [];

  for (const item of commands) {
    const absPath = path.join(REPO_ROOT, item.file);
    const schemaResult = validateSchema(absPath);
    const smokeResult = runSmoke(item);
    const status = resolveStatus(item, schemaResult, smokeResult);

    const errors = [...schemaResult.errors];
    if (!item.indexed) errors.push('warning: not_in_COMMANDS-INDEX.md');

    results.push({
      name: item.name,
      file: item.file,
      status,
      schema: schemaResult.schema,
      smoke: smokeResult.smoke,
      errors,
    });
  }

  // Report missing commands (in index but no file)
  for (const slug of missing) {
    results.push({
      name: `gd:${slug}`,
      file: path.join('.claude', 'commands', 'gd', `${slug}.md`),
      status: 'fail',
      schema: 'fail',
      smoke: 'skipped',
      errors: ['missing_file: listed_in_index_but_no_file_found'],
    });
  }

  const report = buildReport(results);

  // Write report
  const reportsDir = path.join(REPO_ROOT, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = path.join(reportsDir, 'gd-commands-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  // Print summary
  const { total, pass, warn, fail } = report.summary;
  console.log(`gd:validate — ${total} commands | ✅ ${pass} pass | ⚠️  ${warn} warn | ❌ ${fail} fail`);
  if (warn > 0) {
    const warnings = results.filter((r) => r.status === 'warn');
    for (const w of warnings) {
      console.warn(`  WARN [${w.name}]: ${w.errors.join(', ')}`);
    }
  }
  if (fail > 0) {
    const failures = results.filter((r) => r.status === 'fail');
    for (const f of failures) {
      console.error(`  FAIL [${f.name}]: ${f.errors.join(', ')}`);
    }
  }
  if (extra.length > 0) {
    console.warn(`  Extra commands (on disk, not in index): ${extra.join(', ')}`);
  }
  if (missing.length > 0) {
    console.error(`  Missing commands (in index, no file): ${missing.join(', ')}`);
  }

  console.log(`  Report written → reports/gd-commands-report.json`);

  process.exit(fail > 0 ? 1 : 0);
}

// Only run when executed directly (not when imported by tests)
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;
if (isMain) {
  main();
}

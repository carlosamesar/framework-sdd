#!/usr/bin/env node

/**
 * ============================================================================
 * FRAMEWORK-SDD: Evidence Capture Engine
 * ============================================================================
 * Captures evidence from lifecycle events and stores in audit database
 * Called from hooks: git, npm test, PR reviews, merge events
 * 
 * Usage:
 *   node scripts/capture-evidence.mjs <type> <options>
 *
 * Evidence Types:
 *   - code:                Changes/diffs from git commits
 *   - test:                Test execution results (pass/fail/metrics)
 *   - review_comment:      Code review feedback and suggestions
 *   - review_decision:     Review approval/rejection decision
 *   - verification:        Verification matrix and PASS/FAIL evidence
 *   - closure_report:      Change closure and final metrics
 *   - deployment_report:   Deployment logs and status
 *   - architecture_decision: ADR and design decisions
 *   - security_finding:    Security scan results
 *   - performance_issue:   Performance bottleneck identification
 *   - bug:                 Bug discovery and root cause
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const DB_PATH = path.join(WORKSPACE_ROOT, '.data', 'framework-sdd-audit.db');
const LOGS_DIR = path.join(WORKSPACE_ROOT, '.data', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class EvidenceCapture {
  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.evidenceColumns = new Set(
      this.db.prepare('PRAGMA table_info(evidence)').all().map((c) => c.name)
    );
    this.usesNewEvidenceSchema = this.evidenceColumns.has('source_file') && this.evidenceColumns.has('source_hash');
    this.auditColumns = new Set(
      this.db.prepare('PRAGMA table_info(audit_trail)').all().map((c) => c.name)
    );
  }

  normalizeSourceType(sourceType = 'manual') {
    if (!this.usesNewEvidenceSchema) return sourceType;
    const map = {
      manual: 'system_generated',
      git: 'git_commit',
      npm: 'test_output',
      github: 'review_comment',
      deployment: 'system_generated',
      sdd: 'system_generated'
    };
    return map[sourceType] || 'system_generated';
  }

  normalizeSeverity(severity = 'info') {
    if (this.usesNewEvidenceSchema) {
      const map = {
        info: 'INFO',
        warning: 'MAJOR',
        error: 'CRITICAL',
        critical: 'CRITICAL',
        major: 'MAJOR',
        minor: 'MINOR'
      };
      return map[String(severity).toLowerCase()] || 'INFO';
    }
    return String(severity).toLowerCase();
  }
  
  /**
   * Capture code evidence from git commit
   * @param {Object} options - { changeSlug, taskId, diff, message, author, timestamp, hash }
   */
  captureCode(options) {
    const {
      changeSlug,
      taskId,
      diff,
      message,
      author,
      timestamp = new Date().toISOString(),
      hash
    } = options;
    
    if (!changeSlug || !taskId || !diff) {
      throw new Error('Missing required: changeSlug, taskId, diff');
    }
    
    const contentHash = hash || crypto.createHash('sha256').update(diff).digest('hex');
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'code',
      content: diff,
      sourceType: 'git',
      sourceId: contentHash.substring(0, 8),
      severity: 'info',
      tags: ['code', 'commit'],
      metadata: {
        message,
        author,
        commit_hash: contentHash,
        lines_changed: (diff.match(/^[+-]/gm) || []).length
      }
    });
  }
  
  /**
   * Capture test execution results
   * @param {Object} options - { changeSlug, taskId, testName, passed, duration, error, output }
   */
  captureTest(options) {
    const {
      changeSlug,
      taskId,
      testName,
      passed,
      duration = 0,
      error = null,
      output = '',
      coverage = null
    } = options;
    
    if (!changeSlug || !taskId || typeof passed !== 'boolean') {
      throw new Error('Missing required: changeSlug, taskId, passed');
    }
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'test',
      content: output,
      sourceType: 'npm',
      sourceId: testName,
      severity: passed ? 'info' : 'error',
      tags: [passed ? 'test-pass' : 'test-fail'],
      metadata: {
        test_name: testName,
        passed,
        duration_ms: duration,
        error_message: error,
        coverage_percent: coverage,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Capture review comment from PR
   * @param {Object} options - { changeSlug, taskId, comment, author, prNumber, line }
   */
  captureReviewComment(options) {
    const {
      changeSlug,
      taskId,
      comment,
      author,
      prNumber,
      line = null,
      severity = 'info'
    } = options;
    
    if (!changeSlug || !taskId || !comment) {
      throw new Error('Missing required: changeSlug, taskId, comment');
    }
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'review_comment',
      content: comment,
      sourceType: 'github',
      sourceId: `PR-${prNumber}`,
      severity,
      tags: ['review', 'comment'],
      metadata: {
        author,
        pr_number: prNumber,
        line_number: line,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Capture review decision (approve/request changes/comment)
   * @param {Object} options - { changeSlug, taskId, decision, reason, reviewer, prNumber }
   */
  captureReviewDecision(options) {
    const {
      changeSlug,
      taskId,
      decision, // 'approve', 'request-changes', 'comment'
      reason = '',
      reviewer,
      prNumber,
      blocked = false
    } = options;
    
    if (!changeSlug || !taskId || !decision) {
      throw new Error('Missing required: changeSlug, taskId, decision');
    }
    
    const severityMap = {
      'approve': 'info',
      'request-changes': 'warning',
      'comment': 'info'
    };
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'review_decision',
      content: reason,
      sourceType: 'github',
      sourceId: `PR-${prNumber}`,
      severity: severityMap[decision] || 'info',
      tags: ['review', decision],
      metadata: {
        reviewer,
        decision,
        pr_number: prNumber,
        blocked,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Capture verification matrix results
   * @param {Object} options - { changeSlug, taskId, passed, failures, coverage }
   */
  captureVerification(options) {
    const {
      changeSlug,
      taskId,
      passed,
      failures = [],
      coverage = null,
      matrix = {}
    } = options;
    
    if (!changeSlug || !taskId || typeof passed !== 'boolean') {
      throw new Error('Missing required: changeSlug, taskId, passed');
    }
    
    const content = failures.length > 0 
      ? `FAILURES:\
${failures.join('\
')}`
      : 'All verification checks passed';
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'verification',
      content,
      sourceType: 'sdd',
      sourceId: 'verification',
      severity: passed ? 'info' : 'error',
      tags: [passed ? 'verify-pass' : 'verify-fail'],
      metadata: {
        passed,
        failure_count: failures.length,
        coverage_percent: coverage,
        matrix,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Capture deployment report
   * @param {Object} options - { changeSlug, taskId, environment, status, logs }
   */
  captureDeployment(options) {
    const {
      changeSlug,
      taskId,
      environment,
      status, // 'success', 'failed', 'rolled-back'
      logs = '',
      duration = 0
    } = options;
    
    if (!changeSlug || !taskId || !environment) {
      throw new Error('Missing required: changeSlug, taskId, environment');
    }
    
    const severityMap = {
      'success': 'info',
      'failed': 'error',
      'rolled-back': 'error'
    };
    
    return this.insertEvidence({
      changeSlug,
      taskId,
      artifactType: 'deployment_report',
      content: logs,
      sourceType: 'deployment',
      sourceId: environment,
      severity: severityMap[status] || 'warning',
      tags: ['deploy', environment, status],
      metadata: {
        environment,
        status,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Generic evidence insertion
   * Called by all capture methods
   */
  insertEvidence(options) {
    const {
      changeSlug,
      taskId,
      artifactType,
      content,
      sourceType = 'manual',
      sourceId = '',
      severity = 'info',
      tags = [],
      metadata = {},
      parentId = null
    } = options;
    
    const contentHash = crypto.createHash('sha256')
      .update(`${changeSlug}:${artifactType}:${taskId || ''}:${content}`)
      .digest('hex');
    const now = new Date().toISOString();
    const evidenceId = crypto.randomUUID();
    const normalizedSourceType = this.normalizeSourceType(sourceType);
    const normalizedSeverity = this.normalizeSeverity(severity);
    const normalizedArtifactType = this.usesNewEvidenceSchema && artifactType === 'verification'
      ? 'verification_matrix'
      : artifactType;
    
    try {
      const cols = [];
      const vals = [];
      const add = (name, value) => {
        if (this.evidenceColumns.has(name)) {
          cols.push(name);
          vals.push(value);
        }
      };

      add('id', evidenceId);
      add('change_slug', changeSlug);
      add('task_id', taskId);
      add('artifact_type', normalizedArtifactType);
      add('content', content);
      add('hash', contentHash);
      add('source_type', normalizedSourceType);
      add('source_id', sourceId);
      add('source_file', null);
      add('source_hash', sourceId || contentHash.substring(0, 12));
      add('severity', normalizedSeverity);
      add('tags', JSON.stringify(tags));
      add('parent_id', parentId);
      add('parent_evidence_id', parentId);
      add('metadata', JSON.stringify(metadata));
      add('created_at', now);
      add('captured_at', now);
      add('modified_at', null);
      add('is_active', 1);

      const placeholders = cols.map(() => '?').join(', ');
      const stmt = this.db.prepare(`INSERT INTO evidence (${cols.join(', ')}) VALUES (${placeholders})`);
      const result = stmt.run(...vals);
      
      // Record audit trail
      const auditEvidenceId = this.evidenceColumns.has('id') ? evidenceId : result.lastInsertRowid;
      this.recordAudit({
        evidenceId: auditEvidenceId,
        eventType: 'create',
        eventPhase: 'capture',
        message: `Captured ${artifactType} evidence for task ${taskId}`,
        metadata: { source: sourceType }
      });
      
      return auditEvidenceId;
      
    } catch (error) {
      console.error(`Error inserting evidence: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record audit trail event
   */
  recordAudit(options) {
    const {
      evidenceId,
      eventType,
      eventPhase = 'unknown',
      actor = 'system',
      message,
      blocked = false,
      metadata = {}
    } = options;
    
    try {
      const now = new Date().toISOString();
      const eventTypeMap = {
        create: 'CREATED',
        modified: 'MODIFIED',
        reviewed: 'REVIEWED',
        merged: 'MERGED',
        blocked: 'BLOCKED',
        tested: 'TESTED',
        verified: 'VERIFIED',
        deployed: 'DEPLOYED',
        archived: 'ARCHIVED'
      };
      const eventPhaseMap = {
        capture: 'IMPLEMENT',
        implement: 'IMPLEMENT',
        test: 'TEST',
        review: 'REVIEW',
        verify: 'VERIFY',
        close: 'CLOSE',
        release: 'RELEASE',
        deploy: 'DEPLOY',
        archive: 'ARCHIVE'
      };

      const cols = [];
      const vals = [];
      const add = (name, value) => {
        if (this.auditColumns.has(name)) {
          cols.push(name);
          vals.push(value);
        }
      };

      add('id', crypto.randomUUID());
      add('evidence_id', evidenceId);
      add('event_type', eventTypeMap[String(eventType).toLowerCase()] || 'CREATED');
      add('event_phase', eventPhaseMap[String(eventPhase).toLowerCase()] || 'IMPLEMENT');
      add('actor', actor);
      add('actor_role', 'system');
      add('message', message || 'Evidence event');
      add('blocked', blocked ? 1 : 0);
      add('metadata', JSON.stringify(metadata));
      add('metrics', JSON.stringify(metadata));
      add('created_at', now);

      const placeholders = cols.map(() => '?').join(', ');
      const stmt = this.db.prepare(`INSERT INTO audit_trail (${cols.join(', ')}) VALUES (${placeholders})`);
      stmt.run(...vals);
    } catch (_) {
      // Keep evidence capture non-blocking even if audit trail schema differs.
    }
  }
  
  close() {
    this.db.close();
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse all flags and positionals in one pass (supports both --type=X and positional X)
  const allArgs = process.argv.slice(2);
  const opts = {};
  const positionals = [];
  for (const arg of allArgs) {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > -1) {
        const key = arg.substring(2, eqIdx);
        const rawVal = arg.substring(eqIdx + 1);
        opts[key] = rawVal === 'true' ? true : rawVal === 'false' ? false : rawVal;
      } else {
        opts[arg.substring(2)] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  // Type from --type=X flag OR first positional argument (legacy)
  const method = opts.type || positionals[0];

  if (!method || opts.help) {
    console.log(`
Framework-SDD Evidence Capture Engine

Usage:
  node scripts/capture-evidence.mjs <type> <options>

Evidence Types:
  code:               e.g., --change=<slug> --task=<id> --diff=<file>
  test:               e.g., --change=<slug> --task=<id> --name=<test> --passed=true|false
  review_comment:     e.g., --change=<slug> --task=<id> --comment=<text>
  review_decision:    e.g., --change=<slug> --task=<id> --decision=approve|request-changes
  verification:       e.g., --change=<slug> --task=<id> --passed=true|false
  deployment:         e.g., --change=<slug> --task=<id> --env=prod --status=success

Example:
  node scripts/capture-evidence.mjs test \\\\
    --change=feat-auth-v2 \\\\
    --task=task-01 \\\\
    --name=\"Backend Auth Tests\" \\\\
    --passed=true \\\\
    --duration=1500

`);
    process.exit(0);
  }
  
  const capture = new EvidenceCapture();

  try {
    const taskId = opts.task || opts.change || 'manual';

    // Generic path: when --title or --description provided, call insertEvidence directly
    if (opts.title !== undefined || opts.description !== undefined) {
      let metadata = {};
      if (typeof opts.metadata === 'string') {
        try { metadata = JSON.parse(opts.metadata); } catch (_) { metadata = { raw: opts.metadata }; }
      }
      const passed = metadata.passed;
      const content = opts.description || opts.title || '';
      const evidenceId = capture.insertEvidence({
        changeSlug: opts.change,
        taskId,
        artifactType: method.toLowerCase(),
        content,
        sourceType: opts['source-type'] || 'manual',
        sourceId: opts['source-id'] || taskId,
        severity: passed === false ? 'error' : 'info',
        tags: [method.toLowerCase()],
        metadata: { title: opts.title, ...metadata, timestamp: new Date().toISOString() }
      });
      console.log(`evidence_id=${evidenceId} type=${method.toLowerCase()} change=${opts.change}`);
      capture.close();
      process.exit(0);
    }

    // Route to specialized capture methods
    let evidenceId;
    switch (method.toLowerCase()) {
      case 'code':
        evidenceId = capture.captureCode({
          changeSlug: opts.change,
          taskId: opts.task,
          diff: opts.diff ? fs.readFileSync(opts.diff, 'utf-8') : ''
        });
        console.log(`✓ Code evidence captured: ID ${evidenceId}`);
        break;
        
      case 'test':
        evidenceId = capture.captureTest({
          changeSlug: opts.change,
          taskId: opts.task,
          testName: opts.name,
          passed: opts.passed,
          duration: parseInt(opts.duration || '0'),
          output: opts.output ? fs.readFileSync(opts.output, 'utf-8') : ''
        });
        console.log(`✓ Test evidence captured: ID ${evidenceId}`);
        break;
        
      case 'review_comment':
        evidenceId = capture.captureReviewComment({
          changeSlug: opts.change,
          taskId: opts.task,
          comment: opts.comment,
          author: opts.author || 'reviewer',
          prNumber: opts.pr
        });
        console.log(`✓ Review comment captured: ID ${evidenceId}`);
        break;
        
      case 'review_decision':
        evidenceId = capture.captureReviewDecision({
          changeSlug: opts.change,
          taskId: opts.task,
          decision: opts.decision,
          reason: opts.reason || '',
          reviewer: opts.reviewer || 'reviewer',
          prNumber: opts.pr
        });
        console.log(`✓ Review decision captured: ID ${evidenceId}`);
        break;
        
      case 'verification':
        evidenceId = capture.captureVerification({
          changeSlug: opts.change,
          taskId: opts.task,
          passed: opts.passed
        });
        console.log(`✓ Verification evidence captured: ID ${evidenceId}`);
        break;
        
      case 'deployment':
        evidenceId = capture.captureDeployment({
          changeSlug: opts.change,
          taskId: opts.task,
          environment: opts.env,
          status: opts.status,
          logs: opts.logs ? fs.readFileSync(opts.logs, 'utf-8') : ''
        });
        console.log(`✓ Deployment evidence captured: ID ${evidenceId}`);
        break;
        
      case 'deployment_report':
        evidenceId = capture.captureDeployment({
          changeSlug: opts.change,
          taskId: opts.task || opts.change || 'manual',
          environment: opts.env || 'production',
          status: opts.status || 'success',
          logs: opts.logs ? fs.readFileSync(opts.logs, 'utf-8') : opts.description || ''
        });
        console.log(`✓ Deployment evidence captured: ID ${evidenceId}`);
        break;

      default:
        console.error(`Unknown evidence type: ${method}`);
        process.exit(1);
    }
    
    capture.close();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

export { EvidenceCapture };

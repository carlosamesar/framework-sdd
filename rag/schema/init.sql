-- ============================================================================
-- FRAMEWORK-SDD: Audit Evidence Storage Schema (SQLite)
-- ============================================================================
-- Purpose: Centralized, vectorized audit storage of ALL artifacts during SDD lifecycle
-- Database: SQLite (portable, zero-config, encryptable)
-- Author: Framework-SDD Audit System
-- Version: 1.0.0
-- Created: 2026-04-17
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- TABLE 1: evidence - Main artifact storage (code, tests, reviews, decisions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  -- Identification
  id TEXT PRIMARY KEY NOT NULL,
  change_slug TEXT NOT NULL,
  task_id TEXT,
  artifact_type TEXT NOT NULL CHECK(artifact_type IN (
    'code', 'test', 'review_comment', 'review_decision',
    'decision', 'bug', 'architecture', 'security_finding',
    'performance_issue', 'test_result', 'verification_matrix',
    'closure_report', 'deployment_report', 'architecture_decision'
  )),
  
  -- Content
  content TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  
  -- Vectorization (optional, filled on demand)
  embedding BLOB,
  embedding_model TEXT,
  embedding_dim INTEGER,
  embedding_created_at DATETIME,
  
  -- Classification
  severity TEXT CHECK(severity IN ('CRITICAL', 'MAJOR', 'MINOR', 'INFO', NULL)) DEFAULT 'INFO',
  tags TEXT,  -- JSON array: [\"security\", \"multi-tenant\", \"performance\"]
  
  -- Source
  source_file TEXT,
  source_type TEXT CHECK(source_type IN (
    'source_code', 'test_code', 'comment', 'git_commit',
    'test_output', 'review_comment', 'system_generated', NULL
  )),
  source_hash TEXT,
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME,
  
  -- Relations
  parent_evidence_id TEXT,
  
  -- Metadata JSON
  metadata TEXT,  -- JSON: {coverage, duration, warnings, links, ...}
  
  -- Audit fields
  is_active BOOLEAN DEFAULT 1,
  archived_at DATETIME,
  
  FOREIGN KEY(parent_evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
);

CREATE INDEX idx_evidence_change ON evidence(change_slug);
CREATE INDEX idx_evidence_type ON evidence(artifact_type);
CREATE INDEX idx_evidence_created ON evidence(created_at DESC);
CREATE INDEX idx_evidence_hash ON evidence(hash);
CREATE INDEX idx_evidence_severity ON evidence(severity);
CREATE INDEX idx_evidence_source ON evidence(source_type, source_file);

-- ============================================================================
-- TABLE 2: audit_trail - Complete trace of all changes and events
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id TEXT PRIMARY KEY NOT NULL,
  evidence_id TEXT NOT NULL,
  
  -- Event classification
  event_type TEXT NOT NULL CHECK(event_type IN (
    'CREATED', 'MODIFIED', 'REVIEWED', 'MERGED', 'BLOCKED',
    'TESTED', 'VERIFIED', 'DEPLOYED', 'ROLLED_BACK', 'ARCHIVED'
  )),
  event_phase TEXT NOT NULL CHECK(event_phase IN (
    'PLANNING', 'IMPLEMENT', 'TEST', 'REVIEW', 'VERIFY', 'CLOSE',
    'RELEASE', 'DEPLOY', 'ARCHIVE'
  )),
  
  -- Actor
  actor TEXT,  -- email or username
  actor_role TEXT CHECK(actor_role IN ('developer', 'reviewer', 'architect', 'system', NULL)),
  
  -- Event details
  message TEXT NOT NULL,
  impact TEXT,  -- code lines, test coverage delta, etc
  
  -- State tracking
  status_before TEXT,
  status_after TEXT,
  
  -- Blocking information
  blocked BOOLEAN DEFAULT 0,
  block_reason TEXT,
  block_resolution TEXT,
  
  -- Timing
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INTEGER,
  
  -- Git information
  git_commit TEXT,
  git_branch TEXT,
  pr_number INTEGER,
  pr_url TEXT,
  
  -- Detailed metrics (JSON)
  metrics TEXT,  -- {test_count, coverage, duration_breakdown, ...}
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_evidence ON audit_trail(evidence_id);
CREATE INDEX idx_audit_event ON audit_trail(event_type);
CREATE INDEX idx_audit_phase ON audit_trail(event_phase);
CREATE INDEX idx_audit_actor ON audit_trail(actor);
CREATE INDEX idx_audit_created ON audit_trail(created_at DESC);
CREATE INDEX idx_audit_blocked ON audit_trail(blocked);
CREATE INDEX idx_audit_git ON audit_trail(git_commit);

-- ============================================================================
-- TABLE 3: artifact_index - Fast search and relevance scoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS artifact_index (
  id TEXT PRIMARY KEY NOT NULL,
  evidence_id TEXT NOT NULL UNIQUE,
  
  -- Searchable content (for FTS)
  searchable_text TEXT NOT NULL,
  
  -- Categorization
  category TEXT,  -- security, architecture, performance, bug, refactor, optimization
  risk_level INTEGER CHECK(risk_level >= 0 AND risk_level <= 5) DEFAULT 0,
  affected_modules TEXT,  -- JSON array: [\"auth\", \"multi-tenant\", \"api\"]
  
  -- Relevance tracking
  view_count INTEGER DEFAULT 0,
  relevance_score REAL DEFAULT 1.0,
  search_query_history TEXT,  -- JSON array of queries that found this
  
  -- Access tracking
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME,
  last_modified DATETIME,
  
  FOREIGN KEY(evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE INDEX idx_artifact_category ON artifact_index(category);
CREATE INDEX idx_artifact_risk ON artifact_index(risk_level DESC);
CREATE INDEX idx_artifact_relevance ON artifact_index(relevance_score DESC);

-- ============================================================================
-- TABLE 4: vectors - Vectorized embeddings for semantic search
-- ============================================================================
CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY NOT NULL,
  evidence_id TEXT NOT NULL UNIQUE,
  
  -- Embedding vector (binary float32)
  embedding BLOB NOT NULL,
  embedding_dim INTEGER NOT NULL,
  embedding_model TEXT NOT NULL,
  
  -- Versioning (for re-embedding if model changes)
  embedding_version INTEGER DEFAULT 1,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reindexed_at DATETIME,
  
  FOREIGN KEY(evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

CREATE INDEX idx_vectors_evidence ON vectors(evidence_id);
CREATE INDEX idx_vectors_model ON vectors(embedding_model);

-- ============================================================================
-- TABLE 5: changes - Reference to openspec/changes/ (denormalized for speed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS changes (
  slug TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  stack TEXT CHECK(stack IN ('frontend', 'backend', 'fullstack')),
  
  -- Status tracking
  status TEXT CHECK(status IN (
    'planning', 'implementing', 'testing', 'review', 'verifying',
    'closed', 'released', 'deployed', 'archived'
  )) DEFAULT 'planning',
  
  -- Metrics
  total_evidence_count INTEGER DEFAULT 0,
  total_test_evidence_count INTEGER DEFAULT 0,
  total_review_evidence_count INTEGER DEFAULT 0,
  
  -- Lifecycle tracking
  started_at DATETIME,
  completed_at DATETIME,
  released_at DATETIME,
  deployed_at DATETIME,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_changes_status ON changes(status);
CREATE INDEX idx_changes_created ON changes(created_at DESC);

-- ============================================================================
-- TABLE 6: search_queries - Track and learn from search patterns
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY NOT NULL,
  query_text TEXT NOT NULL,
  query_type TEXT CHECK(query_type IN ('semantic', 'keyword', 'filter', 'combined')),
  
  -- Results
  result_count INTEGER,
  top_result_evidence_id TEXT,
  top_result_relevance REAL,
  
  -- User feedback (optional)
  user_feedback TEXT CHECK(user_feedback IN ('relevant', 'irrelevant', 'partial', NULL)),
  
  actor TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY(top_result_evidence_id) REFERENCES evidence(id)
);

CREATE INDEX idx_search_queries_text ON search_queries(query_text);
CREATE INDEX idx_search_queries_created ON search_queries(created_at DESC);

-- ============================================================================
-- TABLE 7: system_config - Framework-SDD audit system configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT OR IGNORE INTO system_config (key, value, description) VALUES
  ('schema_version', '1.0.0', 'Schema version for migrations'),
  ('embedding_model', 'ollama:nomic-embed-text', 'Default embedding model'),
  ('embedding_dim', '768', 'Default embedding dimension'),
  ('last_vectorization', '', 'Timestamp of last vectorization run'),
  ('archive_older_than_days', '365', 'Auto-archive evidence older than this'),
  ('max_vector_search_results', '10', 'Maximum results for semantic search');

-- ============================================================================
-- VIEW 1: active_evidence - Only show non-archived evidence
-- ============================================================================
CREATE VIEW IF NOT EXISTS active_evidence AS
SELECT * FROM evidence
WHERE is_active = 1 AND archived_at IS NULL;

-- ============================================================================
-- VIEW 2: evidence_with_audit - Evidence joined with latest audit trail entry
-- ============================================================================
CREATE VIEW IF NOT EXISTS evidence_with_audit AS
SELECT
  e.id,
  e.change_slug,
  e.artifact_type,
  e.content,
  e.severity,
  e.created_at,
  a.event_type,
  a.event_phase,
  a.actor,
  a.blocked,
  a.block_reason
FROM evidence e
LEFT JOIN audit_trail a ON e.id = a.evidence_id
WHERE e.is_active = 1
ORDER BY e.created_at DESC;

-- ============================================================================
-- VIEW 3: change_evidence_summary - Summary per change
-- ============================================================================
CREATE VIEW IF NOT EXISTS change_evidence_summary AS
SELECT
  e.change_slug,
  COUNT(*) as total_evidence,
  COUNT(CASE WHEN e.artifact_type = 'code' THEN 1 END) as code_evidence,
  COUNT(CASE WHEN e.artifact_type LIKE 'test%' THEN 1 END) as test_evidence,
  COUNT(CASE WHEN e.artifact_type LIKE 'review%' THEN 1 END) as review_evidence,
  COUNT(CASE WHEN e.severity = 'CRITICAL' THEN 1 END) as critical_count,
  COUNT(CASE WHEN a.blocked = 1 THEN 1 END) as blocking_count,
  MAX(e.created_at) as last_update
FROM evidence e
LEFT JOIN audit_trail a ON e.id = a.evidence_id
WHERE e.is_active = 1
GROUP BY e.change_slug;

-- ============================================================================
-- VIEW 4: timeline - Chronological view of all events
-- ============================================================================
CREATE VIEW IF NOT EXISTS timeline AS
SELECT
  a.id,
  a.created_at,
  a.event_phase,
  a.event_type,
  a.actor,
  a.message,
  a.blocked,
  a.block_reason,
  e.change_slug,
  e.artifact_type
FROM audit_trail a
JOIN evidence e ON a.evidence_id = e.id
ORDER BY a.created_at DESC;

-- ============================================================================
-- Initialization markers
-- ============================================================================
CREATE TABLE IF NOT EXISTS _schema_metadata (
  id INTEGER PRIMARY KEY,
  version TEXT NOT NULL,
  initialized_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT INTO _schema_metadata (version, description)
VALUES ('1.0.0', 'Framework-SDD Evidence Audit System - SQLite Schema');

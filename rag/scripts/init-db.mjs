#!/usr/bin/env node

/**
 * ============================================================================
 * FRAMEWORK-SDD: Evidence Database Initialization
 * ============================================================================
 * Initializes SQLite database with schema, indexes, and default config
 * Zero external dependencies (uses native sqlite3 module)
 * 
 * Usage:
 *   node scripts/init-db.mjs                    # Create/migrate DB
 *   node scripts/init-db.mjs --reset           # Drop and recreate
 *   node scripts/init-db.mjs --check            # Verify schema integrity
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

function getWorkspaceRoot() {
  const cwd = process.cwd();
  return cwd.endsWith('/rag') ? path.dirname(cwd) : cwd;
}

const WORKSPACE_ROOT = getWorkspaceRoot();
const DB_PATH = path.join(WORKSPACE_ROOT, '.data', 'framework-sdd-audit.db');
const SCHEMA_FILE = path.join(WORKSPACE_ROOT, 'rag', 'schema', 'init.sql');
const LOGS_DIR = path.join(WORKSPACE_ROOT, '.data', 'logs');

// Ensure directories exist
ensureDir(path.dirname(DB_PATH));
ensureDir(LOGS_DIR);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(level, msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] [${level}] ${msg}`;
  console.log(logMsg);
  
  // Also write to log file
  const logFile = path.join(LOGS_DIR, 'init.log');
  fs.appendFileSync(logFile, logMsg + '\
');
}

function initDatabase(options = {}) {
  const { reset = false, check = false } = options;
  
  try {
    // Step 1: Handle reset
    if (reset && fs.existsSync(DB_PATH)) {
      log('INFO', `Resetting database at ${DB_PATH}`);
      fs.unlinkSync(DB_PATH);
    }
    
    // Step 2: Create connection
    log('INFO', `Initializing database at ${DB_PATH}`);
    const db = new Database(DB_PATH);
    
    // Step 3: Enable WAL mode for concurrent access
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    
    // Step 4: Read and execute schema
    if (!fs.existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
    }
    
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    
    // Split by comments and statements
    const statements = schema
      .split('\
')
      .filter(line => !line.trim().startsWith('--'))
      .join('\
')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    log('INFO', `Executing ${statements.length} SQL statements`);
    
    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (err) {
        log('WARN', `Error executing statement: ${err.message}`);
      }
    }
    
    // Step 5: Verify schema
    if (check) {
      verifySchema(db);
    }
    
    // Step 6: Get database stats
    const stats = getStats(db);
    log('INFO', `Database initialized successfully`);
    log('INFO', `Tables: ${stats.tables.join(', ')}`);
    log('INFO', `Views: ${stats.views.join(', ')}`);
    log('INFO', `Indexes: ${stats.indexes}`);
    
    db.close();
    return true;
    
  } catch (error) {
    log('ERROR', `Failed to initialize database: ${error.message}`);
    process.exit(1);
  }
}

function verifySchema(db) {
  log('INFO', 'Verifying schema integrity...');
  
  const requiredTables = [
    'evidence',
    'audit_trail',
    'artifact_index',
    'vectors',
    'changes',
    'search_queries',
    'system_config'
  ];
  
  const result = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();
  
  const existingTables = result.map(r => r.name);
  
  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      throw new Error(`Missing required table: ${table}`);
    }
    log('INFO', `✓ Table '${table}' exists`);
  }
  
  log('INFO', 'Schema verification passed');
}

function getStats(db) {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_%'
  `).all().map(r => r.name);
  
  const views = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='view'
  `).all().map(r => r.name);
  
  const indexes = db.prepare(`
    SELECT COUNT(*) as cnt FROM sqlite_master
    WHERE type='index' AND name NOT LIKE 'sqlite_%'
  `).get().cnt;
  
  return { tables, views, indexes };
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  reset: args.includes('--reset'),
  check: args.includes('--check')
};

if (args.includes('--help')) {
  console.log(`
Framework-SDD Evidence Database Initialization

Usage:
  node scripts/init-db.mjs [options]

Options:
  --reset         Drop existing database and recreate
  --check         Verify schema integrity after creation
  --help          Show this help message

Examples:
  node scripts/init-db.mjs
  node scripts/init-db.mjs --reset --check
  node scripts/init-db.mjs --check

`);
  process.exit(0);
}

log('INFO', '=== Framework-SDD Evidence Database Initialization ===');
log('INFO', `Node: ${process.version}`);
log('INFO', `CWD: ${process.cwd()}`);
log('INFO', `DB Path: ${DB_PATH}`);

initDatabase(options);
log('INFO', 'Initialization complete');

#!/usr/bin/env node

/**
 * Script: execute-delete-transacciones.mjs
 * Purpose: Execute the SQL script to delete all transactions safely
 * Date: 2026-04-09
 * 
 * Usage: cd rag && node ../scripts/execute-delete-transacciones.mjs
 * 
 * Environment variables required (in .env or environment):
 * - DB_HOST: PostgreSQL host
 * - DB_PORT: PostgreSQL port (default: 5432)
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name
 * - DB_SSL: Enable SSL (true/false, default: false)
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env from multiple locations
const envPaths = [
  join(__dirname, '..', '.env'),              // root/.env
  join(__dirname, '..', 'rag', '.env'),       // rag/.env
  resolve(process.cwd(), '.env'),             // cwd/.env
];

for (const envPath of envPaths) {
  try {
    const result = config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ Loaded .env from: ${envPath}`);
      break;
    }
  } catch (e) {
    // Continue to next path
  }
}

// Validate environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nPlease set these variables in .env file or environment.');
  process.exit(1);
}

// Dynamic import of pg (postgresql client)
let pg;
try {
  pg = await import('pg');
} catch (error) {
  console.error('❌ ERROR: "pg" package not found. Installing...');
  console.error('Please run: npm install pg');
  process.exit(1);
}

const { Client } = pg;

async function executeDeletion() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read the SQL script
    const sqlPath = join(__dirname, 'delete-all-transacciones.sql');
    console.log(`📄 Reading SQL script from: ${sqlPath}`);
    const sqlScript = readFileSync(sqlPath, 'utf-8');

    console.log('\n⚠️  WARNING: This will delete ALL transaction data from the database!');
    console.log('⚠️  Tables affected:');
    console.log('   - public.transacciones');
    console.log('   - public.detalles_transaccion');
    console.log('   - public.movimientos_inventario');
    console.log('   - public.saga_eventos');
    console.log('   - public.transaccion_estado');
    console.log('\n⏳ Executing deletion script...\n');

    // Execute the SQL script
    await client.query(sqlScript);

    console.log('\n✅ Deletion script completed successfully!');
    console.log('📊 Check the output above for record counts.\n');

  } catch (error) {
    console.error('\n❌ ERROR during execution:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
    
    if (error.hint) {
      console.error('   Hint:', error.hint);
    }

    console.error('\nStack trace:');
    console.error(error.stack);
    
    process.exit(1);
  } finally {
    console.log('🔌 Closing database connection...');
    await client.end();
    console.log('✅ Database connection closed');
  }
}

// Run the script
executeDeletion();

#!/usr/bin/env node

/**
 * Script: find-fk-transacciones.mjs
 * Purpose: Find all tables with FK constraints referencing transacciones
 */

import '../../scripts/lib/load-framework-env.mjs';
import { Client } from 'pg';

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

async function findFKs() {
  try {
    await client.connect();
    console.log('🔍 Finding all FK constraints referencing transacciones...\n');

    const result = await client.query(`
      SELECT 
          tc.table_schema,
          tc.table_name,
          kcu.column_name,
          tc.constraint_name
      FROM 
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
      WHERE 
          tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'transacciones'
          AND ccu.table_schema = 'public'
      ORDER BY 
          tc.table_schema,
          tc.table_name
    `);

    console.log(`Found ${result.rows.length} tables referencing transacciones:\n`);
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.table_schema}.${row.table_name}`);
      console.log(`   Column: ${row.column_name}`);
      console.log(`   Constraint: ${row.constraint_name}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

findFKs();

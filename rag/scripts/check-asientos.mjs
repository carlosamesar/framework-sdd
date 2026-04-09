#!/usr/bin/env node

/**
 * Script: check-asientos.mjs
 * Purpose: Check remaining asientos_contables_encabezado records
 */

import { Client } from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  try {
    await client.connect();
    console.log('🔍 Checking remaining asientos_contables_encabezado records...\n');

    const result = await client.query(`
      SELECT *
      FROM public.asientos_contables_encabezado 
      LIMIT 10
    `);

    console.log(`Found ${result.rows.length} records:\n`);
    console.log('Columns:', Object.keys(result.rows[0] || {}).join(', '));
    console.log('\nData:\n');
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}.`, JSON.stringify(row, null, 2));
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

check();

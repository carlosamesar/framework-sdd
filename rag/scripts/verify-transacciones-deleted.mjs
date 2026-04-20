#!/usr/bin/env node

/**
 * Script: verify-transacciones-deleted.mjs
 * Purpose: Verify all transaction-related tables are empty
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

async function verify() {
  try {
    await client.connect();
    console.log('🔍 Verifying deletion results...\n');

    const tables = [
      'public.transacciones',
      'public.asientos_contables_encabezado',
      'public.aplicaciones_anticipo',
      'public.log_eventos_transaccion',
      'public.movimientos_cartera',
      'public.pagos_transaccion',
      'public.retenciones_transaccion',
      'public.transaccion_complemento',
      'public.transaccion_impuesto',
      'public.valores_campos_personalizados_transaccion',
      'public.saga_eventos',
    ];

    let allEmpty = true;
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      const status = count === 0 ? '✅' : '❌';
      console.log(`${status} ${table}: ${count} records`);
      if (count > 0) allEmpty = false;
    }

    console.log('\n' + '='.repeat(50));
    if (allEmpty) {
      console.log('✅ SUCCESS: All transaction-related tables are EMPTY');
    } else {
      console.log('⚠️  WARNING: Some tables still have data');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verify();

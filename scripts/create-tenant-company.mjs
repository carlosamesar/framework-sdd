import './lib/load-framework-env.mjs';
import pg from 'pg';
import crypto from 'crypto';

function uuidv4() {
  return crypto.randomUUID();
}

async function createTenantAndCompany() {
  const tenantId = uuidv4();
  const empresaId = uuidv4();
  const password = Math.random().toString(36).slice(-8) + 'A1!';
  
  console.log('=== Creating Tenant ===');
  console.log('tenant_id:', tenantId);
  console.log('empresa_id:', empresaId);
  console.log('temp password:', password);

  const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      INSERT INTO tenants_auth (id_tenant, empresa, contacto, correo, nit, celular, terms)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT DO NOTHING
    `, [tenantId, 'Inversiones Zona Ruedas', 'inversioneszonaruedas@gmail.com', 'inversioneszonaruedas@gmail.com', '101720930-6', '3001234567']);

    console.log('✅ Tenant created in tenants_auth');

    await pool.query(`
      INSERT INTO empresas (id_empresa, id_tenant, nombre_legal, nit_identificacion_fiscal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [empresaId, tenantId, 'Inversiones Zona Ruedas', '101720930-6']);

    console.log('✅ Empresa created in empresas');

    await pool.end();
    console.log('\n=== Summary ===');
    console.log('tenant_id:', tenantId);
    console.log('empresa_id:', empresaId);
    console.log('Password:', password);
    
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

createTenantAndCompany();
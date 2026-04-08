const { Client } = require('pg');
require('dotenv').config();

async function normalizeStates() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a Digital Ocean para normalización de estados.');

    const query = `
      UPDATE public.estados 
      SET 
        nombre = UPPER(nombre),
        codigo = UPPER(nombre)
      WHERE nombre IN ('Borrador', 'Aprobado', 'Anulado', 'BORRADOR', 'APROBADO', 'ANULADO');
    `;

    const res = await client.query(query);
    console.log(`Filas actualizadas: ${res.rowCount}`);

    const check = await client.query("SELECT id, nombre, codigo FROM public.estados WHERE nombre IN ('BORRADOR', 'APROBADO', 'ANULADO')");
    console.table(check.rows);

  } catch (err) {
    console.error('Error en normalización:', err);
  } finally {
    await client.end();
  }
}

normalizeStates();

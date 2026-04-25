/**
 * Masters for responsible persons: position type, employment type, unit role.
 * See scripts/sigat/sql/create_responsible_persons.sql
 *
 * Idempotent: inserts only missing (tenant_id, type, code).
 *
 * Usage: node scripts/sigat/seed-maestros-responsables.cjs
 */
const { readFileSync } = require("fs");
const path = require("path");
const { Client } = require("pg");

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
const ENV_PATH = path.join(__dirname, "../../develop/backend/sigat-orchestation/.env");

const MAESTROS = [
  { type: "RESP_POSITION_TYPE", code: "RC-01", name: "Profesional universitario" },
  { type: "RESP_POSITION_TYPE", code: "RC-02", name: "Técnico operativo" },
  { type: "RESP_POSITION_TYPE", code: "RC-03", name: "Profesional especializado" },
  { type: "RESP_EMPLOYMENT_TYPE", code: "RT-01", name: "Vinculado" },
  { type: "RESP_EMPLOYMENT_TYPE", code: "RT-02", name: "Contratista" },
  { type: "RESP_UNIT_ROLE", code: "RD-01", name: "Asesor" },
  { type: "RESP_UNIT_ROLE", code: "RD-02", name: "Aprobador" },
  { type: "RESP_UNIT_ROLE", code: "RD-03", name: "Enlace administrativo" },
];

function loadEnv(fpath) {
  const raw = readFileSync(fpath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnv(ENV_PATH);
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query("BEGIN");
    const types = ["RESP_POSITION_TYPE", "RESP_EMPLOYMENT_TYPE", "RESP_UNIT_ROLE"];
    for (const m of MAESTROS) {
      const ex = await client.query(
        `SELECT 1 FROM sigat.masters WHERE tenant_id = $1 AND type = $2 AND code = $3 LIMIT 1`,
        [TENANT_ID, m.type, m.code]
      );
      if (ex.rowCount > 0) continue;
      await client.query(
        `INSERT INTO sigat.masters (tenant_id, parent_id, type, code, name, is_active)
         VALUES ($1, NULL, $2, $3, $4, true)`,
        [TENANT_ID, m.type, m.code, m.name]
      );
    }
    const n = await client.query(
      `SELECT type, COUNT(*)::int c FROM sigat.masters WHERE tenant_id = $1 AND type = ANY($2::text[]) GROUP BY type ORDER BY type`,
      [TENANT_ID, types]
    );
    await client.query("COMMIT");
    console.log("Responsible-person masters:", n.rows);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

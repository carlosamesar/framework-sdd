/**
 * Jerarquía geográfica Antioquia como maestros en sigat.masters
 * (misma tabla y columnas que CONDICION, UND_ORGANIZACIONAL, etc.):
 * departamento → subregión → municipio.
 *
 * Fuente (red / servicio público Gobernación de Antioquia, ArcGIS REST):
 *   FeatureServer "División política de Antioquia" / capa Municipios (id=3)
 *   Campos: COD_MPIO, MPIO_NOMBRE, COD_SUBREGION, SUBREGION, REGION
 *
 * Uso:
 *   node scripts/sigat/seed-geo-antioquia.cjs --validate
 *   node scripts/sigat/seed-geo-antioquia.cjs
 */
const { readFileSync } = require("fs");
const path = require("path");
const { Client } = require("pg");

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
const ENV_PATH = path.join(__dirname, "../../develop/backend/sigat-orchestation/.env");
const isValidate = process.argv.includes("--validate") || process.argv.includes("--dry-run");

/** ArcGIS REST — capa Municipios con atributo SUBREGION (Gob. de Antioquia). */
const ARCGIS_MUNICIPIOS_QUERY =
  "https://services5.arcgis.com/K90UQIB09TmTjUL8/ArcGIS/rest/services/Divisi%C3%B3n_pol%C3%ADtica_de_Antioquia/FeatureServer/3/query";

/** Tipos de maestro en sigat.masters para división territorial (Antioquia). */
const TYPES = {
  DEPT: "MAESTRO_DEPARTAMENTO",
  SUB: "GEO_SUBREGION",
  MPIO: "GEO_MUNICIPIO",
};

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

/** Título legible a partir de texto DANE en mayúsculas (conectores en minúscula). */
function titleCaseGeo(upper) {
  if (!upper) return upper;
  const small = new Set(["de", "del", "la", "las", "los", "el", "y", "e"]);
  const words = upper.toLocaleLowerCase("es-CO").split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      if (i > 0 && small.has(w)) return w;
      return w.charAt(0).toLocaleUpperCase("es-CO") + w.slice(1);
    })
    .join(" ")
    .replace(/\baburra\b/i, "Aburrá");
}

async function fetchAllMunicipiosFeatures() {
  const outFields = "COD_MPIO,MPIO_NOMBRE,COD_SUBREGION,SUBREGION,REGION";
  const base = new URL(ARCGIS_MUNICIPIOS_QUERY);
  base.searchParams.set("f", "json");
  base.searchParams.set("where", "1=1");
  base.searchParams.set("outFields", outFields);
  base.searchParams.set("returnGeometry", "false");
  base.searchParams.set("orderByFields", "SUBREGION,MPIO_NOMBRE");

  const all = [];
  let offset = 0;
  const pageSize = 200;

  for (;;) {
    base.searchParams.set("resultOffset", String(offset));
    base.searchParams.set("resultRecordCount", String(pageSize));
    const res = await fetch(base.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`ArcGIS HTTP ${res.status}: ${await res.text()}`);
    const j = await res.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    const feats = j.features || [];
    for (const f of feats) {
      const a = f.attributes || {};
      all.push({
        codMpio: String(a.COD_MPIO || "").trim(),
        nombre: String(a.MPIO_NOMBRE || "").trim(),
        codSub: String(a.COD_SUBREGION || "").trim(),
        subregion: String(a.SUBREGION || "").trim(),
        region: String(a.REGION || "").trim(),
      });
    }
    if (!j.exceededTransferLimit && feats.length < pageSize) break;
    if (feats.length === 0) break;
    offset += feats.length;
  }

  return all;
}

/** Quita maestros territoriales previos (hojas → raíz; incluye tipos renombrados). */
async function deleteTerritorioMaestros(client) {
  const order = [
    "MUNICIPIO",
    "MAESTRO_MUNICIPIO",
    TYPES.MPIO,
    "MAESTRO_SUBREGION",
    TYPES.SUB,
    "GEO_DEPARTAMENTO",
    TYPES.DEPT,
  ];
  for (const t of order) {
    await client.query(`DELETE FROM sigat.masters WHERE tenant_id = $1 AND type = $2`, [TENANT_ID, t]);
  }
}

async function insertMaster(client, { parentId, type, code, name, metadata }) {
  const meta = metadata && Object.keys(metadata).length ? JSON.stringify(metadata) : "{}";
  const r = await client.query(
    `INSERT INTO sigat.masters (tenant_id, parent_id, type, code, name, metadata, is_active)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, true) RETURNING id`,
    [TENANT_ID, parentId, type, code, name, meta]
  );
  return r.rows[0].id;
}

async function main() {
  loadEnv(ENV_PATH);

  let rows = [];
  try {
    rows = await fetchAllMunicipiosFeatures();
  } catch (e) {
    console.error("Error consultando ArcGIS:", e.message);
    process.exit(1);
  }

  const bad = rows.filter((r) => !r.codMpio || !r.nombre || !r.codSub);
  if (bad.length) console.warn("Registros incompletos:", bad.length);

  const bySub = new Map();
  for (const r of rows) {
    const key = r.codSub;
    if (!bySub.has(key)) {
      bySub.set(key, { codSub: r.codSub, subregion: r.subregion, region: r.region, mpios: [] });
    }
    bySub.get(key).mpios.push(r);
  }

  if (isValidate) {
    console.log("=== VALIDACIÓN (sin escrituras en BD) ===\n");
    console.log("Fuente:", ARCGIS_MUNICIPIOS_QUERY);
    console.log("Municipios obtenidos:", rows.length);
    console.log("Subregiones distintas (COD_SUBREGION):", bySub.size);
    const med = rows.find((x) => x.codMpio === "05001");
    const andes = rows.find((x) => x.codMpio === "05034");
    console.log("\nEjemplos:");
    console.log("  Medellín:", med);
    console.log("  Andes:", andes);
    console.log("\nPlan: DELETE tipos", TYPES.MPIO, ",", TYPES.SUB, ",", TYPES.DEPT, "para tenant", TENANT_ID);
    console.log("      INSERT 1", TYPES.DEPT, "+", bySub.size, TYPES.SUB, "+", rows.length, TYPES.MPIO);
    return;
  }

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
    await deleteTerritorioMaestros(client);

    const deptId = await insertMaster(client, {
      parentId: null,
      type: TYPES.DEPT,
      code: "05",
      name: "Antioquia",
      metadata: {
        fuente: "Gobernación de Antioquia — División política de Antioquia (ArcGIS REST)",
        url: ARCGIS_MUNICIPIOS_QUERY,
        dane_departamento: "05",
      },
    });

    const subIdByCod = new Map();
    const subsSorted = [...bySub.values()].sort((a, b) => a.codSub.localeCompare(b.codSub));
    for (const s of subsSorted) {
      const sid = await insertMaster(client, {
        parentId: deptId,
        type: TYPES.SUB,
        code: s.codSub,
        name: titleCaseGeo(s.subregion || s.codSub),
        metadata: {
          cod_subregion: s.codSub,
          subregion_dane: s.subregion,
          region_planeacion: s.region,
        },
      });
      subIdByCod.set(s.codSub, sid);
    }

    for (const r of rows.sort((a, b) => a.codMpio.localeCompare(b.codMpio))) {
      const pid = subIdByCod.get(r.codSub);
      if (!pid) throw new Error(`Sin subregión para municipio ${r.codMpio} ${r.nombre}`);
      await insertMaster(client, {
        parentId: pid,
        type: TYPES.MPIO,
        code: r.codMpio,
        name: titleCaseGeo(r.nombre),
        metadata: {
          cod_mpio: r.codMpio,
          cod_subregion: r.codSub,
          region_planeacion: r.region,
        },
      });
    }

    const summary = await client.query(
      `SELECT type, COUNT(*)::int AS c FROM sigat.masters WHERE tenant_id = $1
       AND type IN ($2, $3, $4) GROUP BY type ORDER BY type`,
      [TENANT_ID, TYPES.DEPT, TYPES.SUB, TYPES.MPIO]
    );
    await client.query("COMMIT");
    console.log("Maestros territorio Antioquia (sigat.masters). Resumen:", summary.rows);
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

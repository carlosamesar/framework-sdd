/**
 * Carga en sigat.masters la jerarquía de docs/maestros-aoat.md
 * para un tenant dado. Borra previamente todos los maestros de ese tenant.
 *
 * Uso:
 *   node scripts/sigat/seed-masters-aoat-tenant.cjs --validate   (solo lectura + plan)
 *   node scripts/sigat/seed-masters-aoat-tenant.cjs              (vacía sigat.masters y deja solo Gobernación)
 * Requiere: pg (npm), .env en develop/backend/sigat-orchestation/.env
 */
const { readFileSync } = require("fs");
const path = require("path");
const { Client } = require("pg");

const TENANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
const isValidate = process.argv.includes("--validate") || process.argv.includes("--dry-run");
const ENV_PATH = path.join(__dirname, "../../develop/backend/sigat-orchestation/.env");

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

const estados = [
  ["01", "Borrador"],
  ["02", "En proceso"],
  ["03", "En revisión"],
  ["04", "Aprobado"],
  ["05", "Devuelto"],
  ["06", "Cerrado"],
];

const tiposIntervencion = [
  ["INT-01", "Asesoría técnica"],
  ["INT-02", "Asistencia técnica"],
  ["INT-03", "Acción participativa"],
  ["INT-04", "Otra"],
];

const tiposActividad = [
  ["TA-01", "Actividad de campo"],
  ["TA-02", "Reunión de supervisión/coordinación"],
  ["TA-03", "Taller/Capacitación participativo"],
  ["TA-04", "Acompañamiento operativo/administrativo"],
];

const poblacion = [
  ["POB-01", "Adulto mayor"],
  ["POB-02", "Niñez y adolescencia"],
  ["POB-03", "Población vulnerable"],
  ["POB-04", "Comunidad general"],
  ["POB-05", "Personas con discapacidad"],
];

const unidades = [
  {
    n: "Departamento Administrativo De Planeación",
    c: [
      { n: "Dirección De Gestión Territorial De Las TIC" },
      { n: "Gerencia De Catastro" },
      { n: "Dirección De Planeación Territorial" },
      { n: "Dirección De Proyectos E Inversión Pública" },
      { n: "Dirección De Información Y Estudios Económicos" },
      { n: "Dirección De Seguimiento Y Evaluación De La Gestión Y Políticas Públicas" },
    ],
  },
  {
    n: "Secretaría De Educación",
    c: [
      {
        n: "Subsecretaría Administrativa Y Financiera",
        c: [
          { n: "Dirección Financiera" },
          { n: "Dirección De Talento Humano" },
          { n: "Dirección De Nómina Y Prestaciones Sociales" },
        ],
      },
      { n: "Dirección De Inspección, Vigilancia Y Control Del Servicio Educativo" },
      { n: "Dirección De Asuntos Legales" },
      {
        n: "Subsecretaría De Calidad Educativa",
        c: [
          { n: "Dirección De Infraestructura Física Y Tecnológica" },
          { n: "Dirección De Permanencia Escolar E Inclusión Educativa" },
          { n: "Dirección De Calidad Y Trayectorias Educativas" },
        ],
      },
    ],
  },
  {
    n: "Secretaría De Salud E Inclusión Social",
    c: [
      {
        n: "Subsecretaría De Protección Social",
        c: [
          { n: "Dirección De Aseguramiento Y Prestación De Servicios" },
          { n: "Dirección De Calidad Y Redes De Servicios" },
          { n: "Dirección De Personas Mayores" },
          { n: "Dirección De Personas Con Discapacidad" },
        ],
      },
      {
        n: "Subsecretaría De Salud Pública",
        c: [
          { n: "Dirección De Salud Colectiva" },
          { n: "Dirección De Salud Ambiental Y Factores De Riesgo" },
          { n: "Dirección Del Laboratorio Departamental De Salud Pública" },
        ],
      },
      { n: "Dirección Administrativa Y Financiera" },
      { n: "Dirección De Asuntos Legales" },
      { n: "Despacho" },
    ],
  },
  {
    n: "Departamento Administrativo De Gestión Del Riesgo De Desastres - DAGRAN",
    c: [
      { n: "Dirección De Manejo De Desastres" },
      { n: "Dirección De Conocimiento Y Reducción Del Riesgo" },
    ],
  },
  {
    n: "Secretaría De Las Mujeres",
    c: [
      { n: "Dirección De Transversalización" },
      { n: "Dirección De Desarrollo Y Autonomía Económica" },
      { n: "Despacho" },
    ],
  },
  {
    n: "Secretaría De Ambiente",
    c: [
      { n: "Dirección De Recursos Naturales" },
      { n: "Dirección De Sostenibilidad Ambiental Y Cambio Climático" },
      { n: "Dirección De Agua Y Saneamiento" },
      { n: "Gerencia De Protección Y Bienestar Animal" },
      { n: "Dirección De Electrificación" },
      { n: "Despacho" },
    ],
  },
  {
    n: "Secretaría De Desarrollo Económico",
    c: [
      { n: "Dirección De Productividad Y Competitividad" },
      { n: "Dirección De Turismo" },
      { n: "Dirección De Desarrollo Rural" },
      { n: "Dirección De Minería Y Energía" },
      { n: "Dirección De Planificación Y Comercialización Agropecuaria" },
      { n: "Despacho" },
    ],
  },
  { n: "Secretaría De La Juventud", c: [{ n: "Dirección De Transversalización" }] },
  {
    n: "Secretaría De Seguridad, Justicia Y Paz",
    c: [
      { n: "Dirección Operativa De Seguridad" },
      { n: "Dirección De Planeación Y Administración De La Seguridad" },
      { n: "Dirección De Acceso A La Justicia" },
      { n: "Dirección De Derechos Humanos Y Paz" },
      { n: "Gerencia De Seguridad Vial" },
    ],
  },
  {
    n: "Secretaría De Gobierno",
    c: [
      { n: "Gerencia De Afrodescendientes" },
      { n: "Gerencia Indígena" },
      { n: "Gerencia De Municipios" },
      { n: "Dirección De Asuntos Institucionales" },
      { n: "Dirección De Participación Comunitaria Y Ciudadana" },
    ],
  },
  {
    n: "Secretaría De Hacienda",
    c: [
      { n: "Subsecretaría Financiera", c: [{ n: "Dirección De Contabilidad" }, { n: "Dirección De Presupuesto" }] },
      { n: "Subsecretaría De Ingresos", c: [{ n: "Dirección De Fiscalización Y Control" }] },
      { n: "Subsecretaría De Tesorería" },
    ],
  },
  {
    n: "Secretaría De Infraestructura Física",
    c: [
      { n: "Subsecretaría De Calidad Educativa", c: [{ n: "Dirección De Infraestructura Física Y Tecnológica" }] },
      { n: "Dirección Administrativa Y Financiera" },
      { n: "Dirección De Asuntos Legales" },
      {
        n: "Subsecretaría Operativa De Infraestructura Física",
        c: [
          { n: "Dirección De Desarrollo Físico" },
          { n: "Dirección De Gestión Social Ambiental Y Predial" },
          { n: "Dirección De Infraestructura Y Apoyo Territorial" },
        ],
      },
      {
        n: "Subsecretaría De Planeación Proyectos Estratégicos Y APPS",
        c: [
          { n: "Dirección De Estructuración De Proyectos" },
          { n: "Dirección De Instrumentos De Financiación" },
        ],
      },
    ],
  },
  {
    n: "Secretaría De Talento Humano Y Servicios Administrativos",
    c: [
      {
        n: "Subsecretaría De Talento Humano",
        c: [
          { n: "Dirección De Compensación Y Sistema Pensional" },
          { n: "Dirección De Desarrollo Del Talento Humano" },
          { n: "Dirección De Desarrollo Organizacional" },
          { n: "Dirección De Personal" },
          { n: "Dirección De Relación Estado-Ciudadano" },
        ],
      },
      { n: "Dirección De Gestión Documental" },
      {
        n: "Subsecretaría De Servicios Administrativos",
        c: [
          { n: "Dirección De Tecnología E Información" },
          { n: "Dirección De Servicios Generales" },
          { n: "Dirección De Bienes Y Seguros" },
          { n: "Dirección De Pasaportes" },
        ],
      },
    ],
  },
  {
    n: "Secretaría General",
    c: [
      { n: "Subsecretaría De Servicios Administrativos", c: [{ n: "Dirección De Servicios Generales" }] },
      {
        n: "Subsecretaría Jurídica",
        c: [
          { n: "Dirección De Defensa Jurídica" },
          { n: "Dirección De Asesoría Legal Y De Control" },
          { n: "Dirección Contractual" },
          { n: "Dirección De Instrucción Disciplinaria" },
        ],
      },
    ],
  },
  {
    n: "Oficina Privada",
    c: [
      { n: "Gerencia De Proyectos Especiales", c: [{ n: "Dirección De Gestión De Proyectos" }, { n: "Dirección Del Conglomerado" }] },
      {
        n: "Unidad De Programas Sociales",
        c: [
          { n: "Dirección De Infancia, Adolescencia Y Familia" },
          { n: "Dirección De Seguridad Alimentaria Y Nutricional" },
        ],
      },
      {
        n: "Gerencia De Relacionamiento",
        c: [
          { n: "Dirección De Cooperación E Internacionalización" },
          { n: "Dirección De Comunicaciones" },
        ],
      },
    ],
  },
  { n: "Gerencia De Auditoría Interna", c: [{ n: "Despacho Del Gerente" }] },
];

let depSeq = 0;
function nextDepCode() {
  depSeq += 1;
  return `DEP-${String(depSeq).padStart(3, "0")}`;
}

async function insertOne(client, tenantId, parentId, type, code, name) {
  const r = await client.query(
    `INSERT INTO sigat.masters (tenant_id, parent_id, type, code, name, is_active)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
    [tenantId, parentId, type, code, name]
  );
  return r.rows[0].id;
}

async function insertUnidadNode(client, tenantId, node, parentId) {
  const code = nextDepCode();
  const id = await insertOne(client, tenantId, parentId, "UND_ORGANIZACIONAL", code, node.n);
  for (const ch of node.c || []) {
    await insertUnidadNode(client, tenantId, ch, id);
  }
}

/** Borra toda la tabla respetando FK self (parent_id): hojas primero. */
async function deleteAllMasters(client) {
  let total = 0;
  for (;;) {
    const r = await client.query(
      `DELETE FROM sigat.masters m
       WHERE NOT EXISTS (SELECT 1 FROM sigat.masters c WHERE c.parent_id = m.id)`
    );
    total += r.rowCount;
    if (r.rowCount === 0) break;
  }
  return total;
}

function countDepNodes(nodes) {
  let n = 0;
  function walk(x) {
    n += 1;
    for (const ch of x.c || []) walk(ch);
  }
  for (const root of nodes) walk(root);
  return n;
}

const EXPECTED_DEP = countDepNodes(unidades);
const EXPECTED_FLAT = estados.length + tiposIntervencion.length + tiposActividad.length + poblacion.length;
const EXPECTED_TOTAL = EXPECTED_FLAT + EXPECTED_DEP;

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

  if (isValidate) {
    const total = await client.query("SELECT COUNT(*)::int AS c FROM sigat.masters");
    const byTenant = await client.query(
      "SELECT tenant_id::text, COUNT(*)::int AS c FROM sigat.masters GROUP BY tenant_id ORDER BY tenant_id"
    );
    console.log("=== VALIDACIÓN (sin escrituras) ===\n");
    console.log("Estado actual sigat.masters: total filas =", total.rows[0].c);
    console.log("Por tenant_id:", JSON.stringify(byTenant.rows, null, 2));
    console.log("\n--- Coincidencia con docs/maestros-aoat.md (Educación, L46-L56) ---");
    console.log(
      "Script: Secretaría De Educación → (1) Subsecretaría Administrativa Y Financiera → " +
        "Dirección Financiera, Dirección De Talento Humano, Dirección De Nómina Y Prestaciones Sociales; " +
        "(2) Dirección De Inspección…; (3) Dirección De Asuntos Legales; " +
        "(4) Subsecretaría De Calidad Educativa → 3 direcciones."
    );
    console.log("\n--- Plan al ejecutar sin --validate ---");
    console.log("1) DELETE en oleadas (solo nodos hoja) hasta vaciar sigat.masters.");
    console.log("2) INSERT solo tenant", TENANT_ID, "(Gobernación de Antioquia).");
    console.log("3) Conteos esperados del script: UND_ORGANIZACIONAL", EXPECTED_DEP, "+ flat", EXPECTED_FLAT, "= total", EXPECTED_TOTAL);
    await client.end();
    return;
  }

  try {
    await client.query("BEGIN");
    const removed = await deleteAllMasters(client);
    console.log("Filas eliminadas (toda la tabla, por capas):", removed);

    for (const [code, name] of estados) {
      await insertOne(client, TENANT_ID, null, "CONDICION", code, name);
    }
    for (const [code, name] of tiposIntervencion) {
      await insertOne(client, TENANT_ID, null, "INTERVENCION", code, name);
    }
    for (const [code, name] of tiposActividad) {
      await insertOne(client, TENANT_ID, null, "TIPO_ACTIVIDAD", code, name);
    }
    for (const [code, name] of poblacion) {
      await insertOne(client, TENANT_ID, null, "POBLACION", code, name);
    }
    for (const root of unidades) {
      await insertUnidadNode(client, TENANT_ID, root, null);
    }

    const n = await client.query(
      "SELECT type, COUNT(*)::int AS c FROM sigat.masters WHERE tenant_id = $1 GROUP BY type ORDER BY type",
      [TENANT_ID]
    );
    const total = await client.query("SELECT COUNT(*)::int AS c FROM sigat.masters WHERE tenant_id = $1", [TENANT_ID]);
    const allTenants = await client.query("SELECT COUNT(DISTINCT tenant_id)::int AS c FROM sigat.masters");
    await client.query("COMMIT");
    console.log("Resumen por type:", n.rows);
    console.log("Total filas insertadas (tenant):", total.rows[0].c);
    console.log("Tenants distintos en la tabla (debe ser 1):", allTenants.rows[0].c);
    if (total.rows[0].c !== EXPECTED_TOTAL) {
      console.warn("Advertencia: total esperado", EXPECTED_TOTAL, "obtenido", total.rows[0].c);
    }
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

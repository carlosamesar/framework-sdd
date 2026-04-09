# Orquestador agente SDD (LangGraph) — instalación y puesta en marcha

Este documento describe cómo **instalar** el paquete [`packages/sdd-agent-orchestrator/`](../packages/sdd-agent-orchestrator/README.md), **activar** la CLI `sdd-agent` y ejecutar el **pipeline** y el **agente LLM** opcional.

**Producción (CI, servidores, secretos, checklist):** [**`orquestador-produccion.md`**](orquestador-produccion.md).

## Requisitos

- **Node.js ≥ 20**
- Clon del repo **Framework-SDD** (el orquestador vive *dentro* del monorepo y reutiliza `scripts/` y `openspec/tools-manifest.yaml` de la raíz).

## Entornos de instalación

| Entorno | Comando raíz | Notas |
|---------|--------------|--------|
| **Desarrollo** | `npm install` + `npm run agent:install` | Crea `.env` desde `.env.example` si falta. |
| **Producción / CI endurecido** | `npm ci` + `npm run agent:install:production` | `npm ci --omit=dev` en el orquestador; **no** crea `.env`; secretos por variables de entorno. Ver [orquestador-produccion.md](orquestador-produccion.md). |

## Instalación para desarrolladores

Desde la **raíz del clon** `Framework-SDD`:

```bash
npm install
npm run agent:install
```

Qué hace `agent:install`:

1. Ejecuta `npm ci` (o `npm install` si no hay lockfile) en `packages/sdd-agent-orchestrator/`.
2. Si existe `.env.example` y no hay `.env`, copia la plantilla a `packages/sdd-agent-orchestrator/.env`.

Producción: `npm run agent:install:production` o `node scripts/install-sdd-agent.mjs --production`.

Verificación rápida:

```bash
npm run orchestrator:test
npx sdd-agent list-tools
```

## Activar el agente (CLI)

El binario **`sdd-agent`** está declarado en el `package.json` raíz. Uso típico **desde la raíz del framework**:

```bash
npx sdd-agent list-tools
npx sdd-agent pipeline "validar cambio X"
npx sdd-agent demo "tarea tipo gd:start"
npx sdd-agent gd-cycle "descripción de la feature o fix (ciclo /gd:* completo)"
```

Si trabajás en **otro repo** que tenga carpeta `openspec/`:

```bash
cd /ruta/al/tu-producto
npx /ruta/al/Framework-SDD/bin/sdd-agent.mjs --project-root "$(pwd)" pipeline
```

Equivalente con variable de entorno:

```bash
export FRAMEWORK_SDD_PROJECT_ROOT=/ruta/al/tu-producto
npx sdd-agent pipeline
```

La raíz del **framework** (donde están `scripts/` y `openspec/` del framework) se infiere desde la ubicación de `bin/sdd-agent.mjs`. Para forzarla:

```bash
export FRAMEWORK_SDD_ROOT=/ruta/al/Framework-SDD
```

### Auditoría lambdas inventario × SAGA (CLI)

Auditoría asistida por LLM sobre `lib/lambda/inventarios` (o `lib/lambda/inventario`), alineada a **AGENTS.md**, **transacciones** y **SAGA** (prompt: `.claude/commands/gd/auditar-inventario-lambdas.md`).

```bash
npx sdd-agent audit-inventario
# ruta alternativa:
SDD_AUDIT_INVENTARIO_PATH=lib/lambda/inventario npx sdd-agent audit-inventario
npm run orchestrator:audit-inventario
```

Requiere **`OPENAI_API_KEY`**. Si el árbol no está en el clon, el informe es un **checklist** aplicable cuando exista el código.

### OpenSpec multi-proyecto

Si usás **`openspec/config.yaml`** con varias entradas en `projects`, definí qué producto validar:

```bash
export FRAMEWORK_SDD_OPENSPEC_PROJECT=framework   # o sigat_orchestation, etc.
```

Detalle: [`docs/openspec-proyectos.md`](openspec-proyectos.md).

## Comandos sin `npx` (scripts npm)

| Objetivo | Comando (desde raíz del framework) |
|----------|-------------------------------------|
| Instalar deps del orquestador | `npm run agent:install` |
| Tests del paquete | `npm run orchestrator:test` |
| Pipeline read-only (CI) | `npm run orchestrator:pipeline` |
| Ciclo **/gd:* completo** (LLM + gates + verify) | `npm run orchestrator:gd-cycle -- "tarea"` |
| **Catálogo** de prompts `gd/*` y `gd:razonar/*` (JSON) | `npm run orchestrator:gd-catalog` o `npx sdd-agent gd-catalog` |
| **Una fase** cualquiera del catálogo | `npx sdd-agent gd-phase razonar/pre-mortem "contexto"` |
| **Flujo extendido** (YAML `openspec/gd-full-pipeline.yaml`, incluye 15× `/gd:razonar:*`) | `npm run orchestrator:gd-mega-flow -- "tarea"` · `SDD_PIPELINE_SKIP_RAZONAR=1` omite razonamiento |
| Agente LLM ReAct (opcional) | `npm run orchestrator:llm` |

Los scripts `orchestrator:*` usan `npm --prefix packages/sdd-agent-orchestrator`.

## Ciclo completo tipo `/gd:start` (`gd-cycle`)

Objetivo: **misma secuencia lógica que `/gd:start`** en el IDE, pero ejecutable en terminal: el modelo lee los mismos textos que los slash-commands bajo **`.claude/commands/gd/*.md`**, encadena fases y corre los **scripts del framework** al final.

**Requisito:** `OPENAI_API_KEY` (varias llamadas al modelo → coste y latencia).

Flujo resumido:

1. **Ingest** + **human gate** (omitible con `SDD_SKIP_HUMAN_GATE=1`, por defecto en CLI igual que `pipeline`).
2. **Detección de complejidad** (LLM + contenido de `start.md`): nivel 0–1 → rama **corta** (`implement` acotado → `spec_validate` → `review` → verify); nivel ≥2 → rama **completa** (`specify` → `spec_validate` → `clarify` → `plan` → `breakdown` → `implement` → `review`).
3. **Verify batch:** `spec_validate`, `spec_implements`, `spec_validate_react`, `test_implements_e2e`, `spec_verify_report --all`.
4. **Cierre:** fase LLM con `archive.md` (checklist / pasos de archivo OpenSpec; la ejecución material del archivo sigue siendo manual o vía flujos que defináis).

Salida por defecto: JSON **resumido** (trazas, resultados de gates, claves de `phaseOutputs`, preview del texto `archive`). Para volcar el estado completo (muy grande):

```bash
SDD_GD_CYCLE_FULL_JSON=1 npx sdd-agent gd-cycle "mi tarea"
```

**Límites honestos (hoy):**

- No **escribe** solo en `openspec/changes/` ni en el código del producto: la salida queda en consola/estado para que el equipo la traslade.
- **`implement`** es **guía** del modelo (TDD, pasos); no ejecuta `npm test` de un microservicio bajo `develop/` salvo que ampliéis el manifiesto con herramientas de proyecto.
- **`/gd:archive`** material (copiar specs delta → main) no está automatizado en Node aquí; el último paso orienta con el mismo prompt que el comando.

**CI:** no se ejecuta `gd-cycle` en el workflow por defecto (API key + coste). Usad `pipeline` para gates sin LLM.

## Pipeline vs human-in-the-loop

El nodo `human_gate` del grafo solo omite el `interrupt()` cuando **`SDD_SKIP_HUMAN_GATE` vale exactamente `1`**.

- **`npm run graph:pipeline`**, **`npx sdd-agent pipeline`** y **`npx sdd-agent gd-cycle`**: si la variable **no está definida**, `bin/sdd-agent.mjs` fuerza `SDD_SKIP_HUMAN_GATE=1` (en `pipeline` también lo hace `run-graph-pipeline.mjs`), para no bloquear en desarrollo/CI.
- **Puerta humana activa:** definí `SDD_SKIP_HUMAN_GATE=0` **antes** de llamar a `npx sdd-agent` (el binario no pisa la variable si ya existe) o ejecutá el `.mjs` con Node directamente sin ese prefijo en el binario — p. ej. `SDD_SKIP_HUMAN_GATE=0 node packages/sdd-agent-orchestrator/src/run-graph-pipeline.mjs "tarea"`.

## Agente LLM (OpenAI)

1. Definí **`OPENAI_API_KEY`** en `packages/sdd-agent-orchestrator/.env` (recomendado; el runner la carga al inicio si el archivo existe) o exportala en el shell.
2. Ejecutá:

```bash
npm run orchestrator:llm -- "tu instrucción"
# o
npx sdd-agent llm "tu instrucción"
```

Sin API key, el proceso **sale 0** con un JSON `skipped: true` (útil en CI sin secretos).

Variable opcional: **`SDD_LLM_MODEL`** (por defecto `gpt-4o-mini`).

## Integración con la suite del framework

`npm run framework:test` ya incluye tests del orquestador y una corrida del pipeline read-only. Mantener eso verde antes de merge.

## Referencias

- **Producción:** [`docs/orquestador-produccion.md`](orquestador-produccion.md)
- README del paquete: [`packages/sdd-agent-orchestrator/README.md`](../packages/sdd-agent-orchestrator/README.md)
- Arquitectura: [`packages/sdd-agent-orchestrator/design/ARQUITECTURA-CERO-DEV-LANGRAPH.md`](../packages/sdd-agent-orchestrator/design/ARQUITECTURA-CERO-DEV-LANGRAPH.md)
- Fases `/gd:*`: [`packages/sdd-agent-orchestrator/design/GD-PHASE-SCHEMAS.md`](../packages/sdd-agent-orchestrator/design/GD-PHASE-SCHEMAS.md)
- Manifiesto de tools: [`openspec/tools-manifest.yaml`](../openspec/tools-manifest.yaml)
- OpenSpec por proyecto: [`docs/openspec-proyectos.md`](openspec-proyectos.md)

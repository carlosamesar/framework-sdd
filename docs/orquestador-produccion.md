# Orquestador agente SDD — puesta en producción

Guía para **instalar y operar** el paquete [`packages/sdd-agent-orchestrator/`](../packages/sdd-agent-orchestrator/README.md) y la CLI **`sdd-agent`** en entornos **CI, servidores o imágenes**, con criterios de seguridad y coste.

Documentación complementaria (desarrollo local y flujos): [**`orquestador-agente-sdd.md`**](orquestador-agente-sdd.md).

---

## 1. Qué entendemos por “producción”

| Modo | Descripción |
|------|-------------|
| **CI / gates** | Ejecutar validaciones **sin LLM** (`pipeline`, `framework:test`, `react:smoke`): determinista, sin `OPENAI_API_KEY`. |
| **Jobs con LLM** | `gd-cycle`, `llm`: requieren **secretos**, **salida HTTPS** a OpenAI (u otro proveedor si adaptáis el código), **presupuesto** y **revisión humana** para tareas sensibles. |
| **Servidor dedicado** | Máquina o contenedor que corre `npx sdd-agent` sobre un **working copy** del repo (framework + proyecto con `openspec/`). |

El orquestador **no** es un servicio HTTP incluido: se invoca como **proceso** (`node`, `npx`). Para API REST habría que envolverlo (no incluido en este repo).

---

## 2. Requisitos

- **Node.js ≥ 20** (misma línea base que `AGENTS.md` / CI).
- **Clon completo** del repo Framework-SDD **o** paquete **`npm pack`** que incluya `scripts/`, `openspec/`, `packages/sdd-agent-orchestrator/`, `bin/sdd-agent.mjs` y **`.claude/commands/gd/*.md`** (necesarios para `gd-cycle`).
- **Git** si el flujo monta un repo en caliente (checkout de tag/sha).

---

## 3. Instalación endurecida

### 3.1 Monorepo (servidor o runner self-hosted)

```bash
git clone <url> Framework-SDD && cd Framework-SDD
git checkout <tag-o-sha-fijado>   # recomendado en prod

npm ci                          # raíz: dependencias del framework (ajustar si vuestro pipeline usa solo subconjunto)
npm run agent:install:production
```

- **`agent:install:production`** ejecuta `npm ci --omit=dev` en `packages/sdd-agent-orchestrator` (hoy el paquete no declara `devDependencies`; el flag queda como **práctica lista** para cuando se añadan).
- Alternativa: `npm run agent:install -- --production`.

### 3.2 Consumo vía tarball (`npm pack`)

En el entorno de build:

```bash
npm pack   # en el clon Framework-SDD → framework-sdd-<version>.tgz
npm install /ruta/framework-sdd-<version>.tgz --save-dev
```

En el **job** que ejecuta el agente:

```bash
npm ci
npx sdd-agent list-tools
npx sdd-agent pipeline "smoke"
```

Asegurá que el tarball publicado incluye los **`files`** del `package.json` raíz (orquestador + `.claude/commands/gd`). Tras instalar desde tarball, si el orquestador no trae `node_modules` empaquetados, ejecutad **`npm run agent:install`** o **`npm ci --prefix node_modules/framework-sdd/packages/sdd-agent-orchestrator`** según cómo quede la ruta tras `npm install` del tgz (en la práctica, **clonar el monorepo** en runners suele ser más simple que depender de la estructura interna del paquete instalado).

**Recomendación producción:** clonar el repo en un **tag de release** y usar `npm run agent:install:production` para evitar ambigüedades de rutas.

---

## 4. Secretos y configuración

| Secreto / variable | Uso | Buenas prácticas |
|--------------------|-----|------------------|
| `OPENAI_API_KEY` | `gd-cycle`, `graph:llm` | **Nunca** en git. GitHub Actions: *Secrets*; GitLab: *CI/CD variables* (masked); K8s: `Secret` montado como env; rotación periódica. |
| `SDD_LLM_MODEL` | Modelo OpenAI | Fijar explícitamente en prod (ej. `gpt-4o-mini`) para evitar sorpresas de coste/cambio de default. |
| `FRAMEWORK_SDD_ROOT` | Raíz del clon framework | Obligatorio si el binario no está bajo el árbol esperado (symlinks, contenedores). |
| `FRAMEWORK_SDD_PROJECT_ROOT` | Repo con `openspec/` | Apuntar al **proyecto bajo validación**, no mezclar con el framework salvo que sea el mismo clon. |
| `FRAMEWORK_SDD_OPENSPEC_PROJECT` | Clave en `openspec/config.yaml` → `projects` | En monorepos con varios árboles de changes; ver [`openspec-proyectos.md`](openspec-proyectos.md). |

**Archivo `.env` en disco:** solo en servidores controlados; permisos `chmod 600`. En contenedores, preferir **solo variables de entorno** inyectadas por el orquestador (Kubernetes, ECS, etc.) y **no** copiar `.env` en capas de imagen.

Los runners **`run-gd-cycle.mjs`** y **`run-llm-react-agent.mjs`** pueden leer `packages/sdd-agent-orchestrator/.env` si existe; en producción suele ser preferible **exportar** las mismas claves desde el secret store y **no** depender del archivo.

---

## 5. Qué ejecutar en cada contexto

| Contexto | Comando típico | Notas |
|----------|----------------|-------|
| **CI pull request** | `npm run framework:test` | Incluye orquestador + `pipeline` read-only; **sin** coste LLM. |
| **CI release** | Igual + `npm run spec:verify -- --all` si aplica | Artefactos `reports/*.json`. |
| **Job manual con LLM** | `OPENAI_API_KEY=… npx sdd-agent gd-cycle "…"` | Workflow **workflow_dispatch** o equivalente; límites de concurrencia; logs sin volcar prompts completos si hay datos sensibles. |
| **Solo gates rápidos** | `npx sdd-agent pipeline "…"` | Sin API key. |

**No** recomendamos `gd-cycle` en cada push: coste, latencia y variabilidad del modelo. Reservarlo para **cierres**, **auditorías** o **branches** protegidos con aprobación.

---

## 6. Red y cumplimiento

- Salida **HTTPS** hacia la API del proveedor LLM (p. ej. `api.openai.com`) desde el runner.
- Políticas de **retención de logs**: la salida de `gd-cycle` puede contener **resúmenes de código o negocio**; tratadla como **dato interno**.
- Si la organización exige **sin cloud LLM**, no definir `OPENAI_API_KEY` y limitar el uso a **`pipeline`** / **`framework:ci`**; la extensión a Bedrock u otro proveedor sería un cambio de código explícito.

---

## 7. Human-in-the-loop en automatización

- Con **`SDD_SKIP_HUMAN_GATE=1`** (por defecto en `bin/sdd-agent` para `pipeline` y `gd-cycle` si no se define otra cosa), el grafo **no** bloquea en `interrupt()`.
- Para **aprobar** antes de ejecutar pipelines sensibles en prod, usad **aprobación del pipeline** (GitHub Environments, GitLab protected branches) o ejecutad el `.mjs` con **`SDD_SKIP_HUMAN_GATE=0`** y el flujo de **reanudación** de LangGraph (API `Command({ resume })`) según vuestra integración.

---

## 8. Checklist previo a “go-live”

- [ ] Node 20+ fijado en la imagen o en `actions/setup-node`.
- [ ] Repo en **tag/sha** conocido, no `main` flotante sin control.
- [ ] `npm run framework:test` verde en el mismo tipo de runner.
- [ ] Secretos configurados fuera del repositorio; `.env` en `.gitignore` (ya en el paquete orquestador).
- [ ] Decisión explícita: **¿`gd-cycle` en CI o solo en manual?**
- [ ] Límites de **coste** / alertas en el panel del proveedor LLM.
- [ ] Documentación interna: quién dispara `gd-cycle` y con qué **entrada** (`task` string).

---

## 9. Referencias rápidas

| Recurso | Ruta |
|---------|------|
| Instalación y uso diario | [`docs/orquestador-agente-sdd.md`](orquestador-agente-sdd.md) |
| CI framework | [`.github/workflows/sdd-framework.yml`](../.github/workflows/sdd-framework.yml) |
| Manifiesto de herramientas | [`openspec/tools-manifest.yaml`](../openspec/tools-manifest.yaml) |
| Arquitectura orquestador | [`packages/sdd-agent-orchestrator/design/ARQUITECTURA-CERO-DEV-LANGRAPH.md`](../packages/sdd-agent-orchestrator/design/ARQUITECTURA-CERO-DEV-LANGRAPH.md) |
| Instalador | [`scripts/install-sdd-agent.mjs`](../scripts/install-sdd-agent.mjs) |

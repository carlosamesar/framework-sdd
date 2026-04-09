# GOODERP — Índice Maestro OpenSpec

> Fuente de verdad del estado de todos los módulos y cambios activos del proyecto.
> Última actualización: 2026-04-11
>
> 📋 **Para referencia rápida por ID**: ver [`registry.md`](./registry.md) — Sistema de numeración `M.C.S`

---

## Layout OpenSpec en este repositorio (fuente de verdad)

- **Configuración**: [`openspec/config.yaml`](./openspec/config.yaml) define rutas, **`projects`** (OpenSpec por producto) y `active_project` / **`FRAMEWORK_SDD_OPENSPEC_PROJECT`** — ver [`docs/openspec-proyectos.md`](./docs/openspec-proyectos.md).
- **Cambios (delta specs)**: [`openspec/changes/`](./openspec/changes/) — núcleo framework; otros productos pueden usar [`openspec/projects/…/changes/`](./openspec/projects/README.md) espejando `develop/` — changes activos por `<slug>`; los cerrados suelen vivir en [`openspec/changes/archive/`](./openspec/changes/archive/) (el validador no trata `archive` como un único change, sino cada subcarpeta).
- **Gates npm (framework)**: `npm run framework:ci` (OpenSpec + ReAct + `spec:implements`); `npm run framework:test` (+ E2E `implements:` + extract + **path sandbox**); `npm run react:smoke` ejecuta un plan contra [`openspec/tools-manifest.yaml`](./openspec/tools-manifest.yaml); **`npx framework-sdd` / `npx sdd`** (bin publicado, v2.1+); **`packages/sdd-agent-orchestrator`** — orquestación LangGraph hacia fábrica “cero dev” (demo `npm run graph:demo`); `npm run framework:platform-smoke` = test + react smoke. Madurez: [`docs/AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md`](./docs/AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md) (~**4,0/5** global, 2026-04-11).
- **Módulos numerados** (`openspec/modules/01-module-menu/...`): layout completo ERP descrito abajo; **opcional** si el clon solo incluye framework + backend parcial. Cuando no exista `openspec/modules/`, el estado canónico de specs son únicamente `openspec/changes/`.
- **Guía rápida OpenSpec**: [`openspec/README.md`](./openspec/README.md).
- **Índice de documentación del framework**: [`docs/INDICE-DOCUMENTACION-FRAMEWORK.md`](./docs/INDICE-DOCUMENTACION-FRAMEWORK.md).
- **Memoria SDD (enlaces)**: [`openspec/MEMORY.md`](./openspec/MEMORY.md).
- **Prerrequisitos** (RAG en repo, Engram, opcionales): [`docs/framework-prerequisites.md`](./docs/framework-prerequisites.md).

---

## Maestro, memoria infinita y ultra-economizer

- **Maestro único**: [`AGENTS.md`](AGENTS.md) en la raíz del repo. Define arquitectura, multi-tenant, ResponseBuilder, SAGA, TDD/BDD, pruebas y prohibiciones. Todas las specs e implementaciones deben alinearse a él.
- **Memoria infinita**: Este archivo (`project.md`) + [`registry.md`](./registry.md) + `AGENTS.md` + [`openspec/config.yaml`](./openspec/config.yaml) forman el estado canónico. Al cerrar o cambiar estado de un change, **actualizar** `registry.md` y este `project.md` para que cualquier modelo (Claude, Gemini, Copilot) tenga el estado actual sin redescubrir.
- **Ultra-economizer**: Lectura quirúrgica (máx. 3–5 archivos por tarea, bloques 100–150 líneas); SPEC antes de código; copiar patrón espejo de lambdas/contabilidad; al final de cada bloque de trabajo emitir **AUDITORÍA DE EFICIENCIA** (tokens consumidos/ahorrados, eficacia, técnica). Ver [`openspec/MEMORY.md`](./openspec/MEMORY.md) y [`docs/INDICE-DOCUMENTACION-FRAMEWORK.md`](./docs/INDICE-DOCUMENTACION-FRAMEWORK.md).

---

## Estructura de directorios

```
openspec/
├── project.md                          ← este archivo (índice maestro)
├── registry.md                         ← índice global con IDs numéricos (M.C.S)
└── modules/
    ├── 01-module-menu/                    ← Menú global: sidebar, launchpad, módulos ERP
    ├── 02-module-configurations/          ← Maestros y configuración del tenant
    ├── 03-module-items/                   ← Catálogo de artículos
    ├── 04-module-contacts/                ← Clientes, proveedores, terceros
    ├── 05-module-inventory/               ← Existencias, traslados, movimientos
    ├── 06-module-transactions/            ← 21 tipos de transacciones comerciales (SAGA)
    └── 07-module-treasury/                ← Tesorería y flujo de caja
```

Cada módulo contiene:
```
XX-module-<nombre>/
├── README.md           ← estado actual, endpoints, rutas, decisiones
└── changes/
    ├── XX-build-<nombre>/ ← construcción inicial (Fases 0-N)
    ├── XX-improve-<nombre>/ ← mejoras iterativas
    └── XX-fix-<slug>/     ← correcciones puntuales
```

Cada change contiene:
```
XX-<slug>/
├── proposal.md         ← qué y por qué (OBLIGATORIO)
├── design.md           ← arquitectura y contratos (si aplica)
├── tasks.md            ← tareas ejecutables con criterios de aceptación
└── specs/
    └── spec-<nombre>.md ← Dado/Cuando/Entonces + campos + endpoints
```

---

## Estado de módulos

| ID | Módulo | Carpeta | Estado | URL Angular |
|:--:|--------|---------|:------:|-------------|
| 0 | Dev Tools | `00-module-devtools/` | ⏳ En progreso | `run/dev-server/`, `run/github-commands/sh/` |
| 1 | Menú Global | `01-module-menu/` | ✅ Activo | `nav.service`, `header-options`, `modules-menu` |
| 2 | Configuración | `02-module-configurations/` | ⏳ En progreso | `/configuration`, `/settings` |
| 3 | Artículos | `03-module-items/` | ✅ Completado | `/items` |
| 4 | Contactos | `04-module-contacts/` | ✅ Operativo | `/contacts/:contact` |
| 5 | Inventario | `05-module-inventory/` | ⏳ Pendiente | `/inventory/*` |
| 6 | Transacciones | `06-module-transactions/` | ⚠️ Bugs críticos | `/purchases/*`, `/sales/*` |
| 7 | Tesorería | `07-module-treasury/` | ⏳ En progreso | `/tesoreria`, `/treasury` |

---

## Cambios activos

> Para ver **todos** los changes numerados, consultar [`registry.md`](./registry.md).

| ID | Cambio | Módulo | Estado | Ruta |
|:--:|--------|--------|:------:|------|
| **0.1** | `01-build-dev-scripts` | 00-module-devtools | ✅ APPROVED | `00-module-devtools/changes/01-build-dev-scripts/` |
| **1.1** | `01-add-treasury-menu-items` | 01-module-menu | ✅ IMPL | `01-module-menu/changes/01-add-treasury-menu-items/` |
| **1.2** | `02-add-treasury-cash-bank-menu` | 01-module-menu | ✅ IMPL | `01-module-menu/changes/02-add-treasury-cash-bank-menu/` |
| **1.3** | `03-fix-launchpad-smart-context` | 01-module-menu | ✅ IMPL | `01-module-menu/changes/03-fix-launchpad-smart-context/` |
| **1.4** | `04-restore-menu-hover-behavior` | 01-module-menu | ✅ IMPL | `01-module-menu/changes/04-restore-menu-hover-behavior/` |
| **1.5** | `05-change-treasury-bank-url` | 01-module-menu | ✅ IMPL | `01-module-menu/changes/05-change-treasury-bank-url/` |
| **1.6** | `06-improve-submodule-title-button` | 01-module-menu | 📝 DRAFT | `01-module-menu/changes/06-improve-submodule-title-button/` |
| **2.1** | `01-redesign-tabs` | 02-module-configurations | ✅ DONE | `02-module-configurations/changes/01-redesign-tabs/` |
| **2.2** | `02-sub-navigation-shell` | 02-module-configurations | ⏳ PEND | `02-module-configurations/changes/02-sub-navigation-shell/` |
| **2.3** | `03-treasury-sub-navigation` | 02-module-configurations | ⏳ PEND | `02-module-configurations/changes/03-treasury-sub-navigation/` |
| **3.1** | `01-build-items` | 03-module-items | ✅ DONE | `03-module-items/changes/01-build-items/` |
| **3.2** | `02-improve-items/01-fix-form-sections-layout` | 03-module-items | ⏳ REV | `03-module-items/changes/02-improve-items/01-fix-form-sections-layout/` |
| **3.3** | `02-improve-items/02-fix-form-style` | 03-module-items | ⏳ REV | `03-module-items/changes/02-improve-items/02-fix-form-style/` |
| **3.4** | `02-improve-items/03-fix-list-style` | 03-module-items | ⏳ REV | `03-module-items/changes/02-improve-items/03-fix-list-style/` |
| **3.5** | `02-improve-items/04-lagos-form-redesign` | 03-module-items | ⏳ REV | `03-module-items/changes/02-improve-items/04-lagos-form-redesign/` |
| **6.1** | `01-update-transaction-types-20260306` | 06-module-transactions | ✅ DONE | `06-module-transactions/changes/01-update-transaction-types-20260306/` |
| **6.2** | `02-fix-save-button` | 06-module-transactions | ⏳ REV | `06-module-transactions/changes/02-fix-save-button/` |
| **6.3** | `03-fix-retention-calculation` | 06-module-transactions | ⏳ REV | `06-module-transactions/changes/03-fix-retention-calculation/` |
| **6.4** | `04-improve-transactions-ui` | 06-module-transactions | ⏳ PEND | `06-module-transactions/changes/04-improve-transactions-ui/` |
| **6.5** | `05-improve-tercero-lookup-create-button` | 06-module-transactions | ✅ IMPL | `06-module-transactions/changes/05-improve-tercero-lookup-create-button/` |
| **7.1** | `01-build-treasury` | 07-module-treasury | ✅ IMPL | `07-module-treasury/changes/01-build-treasury/` |
| **7.2** | `02-fix-treasury-header-layout` | 07-module-treasury | ✅ IMPL | `07-module-treasury/changes/02-fix-treasury-header-layout/` |
| **7.3** | `03-implement-bank-cash-submodules` | 07-module-treasury | ✅ IMPL | `07-module-treasury/changes/03-implement-bank-cash-submodules/` |
| **7.4** | `04-build-banks-accounts-cash` | 07-module-treasury | ⏸️ POSP | `07-module-treasury/changes/04-build-banks-accounts-cash/` |
| **7.5** | `05-refactor-banks-cash-lagos` | 07-module-treasury | ⏳ REV | `07-module-treasury/changes/05-refactor-banks-cash-lagos/` |

> Los cambios completados se archivan aquí como historial.
> Los cambios en progreso o pendientes se listan aquí hasta su cierre.

---

## Protocolo de cambios

### Clasificación

| Tipo | Criterio | Protocolo |
|------|----------|-----------| 
| `SIMPLE CODE` | 1-3 archivos, comportamiento evidente | Directo — tarea en `tasks.md` |
| `COMPLEX CODE` | Múltiples archivos, nuevos contratos o endpoints | `proposal.md` → aprobación → implementación |
| `DESIGN/UI` | Cambio visual significativo, nuevas secciones | `proposal.md` + `design.md` → aprobación |
| `FIX` | Bug con causa clara | Directo — sin spec |
| `REFACTOR` | Sin cambio funcional | `proposal.md` breve → aprobación |

### Flujo obligatorio para COMPLEX / DESIGN

```
1. OpenCode crea:
   modules/XX-<modulo>/changes/YY-<slug>/
     proposal.md   → qué y por qué  (Estado: EN REVISIÓN)
     design.md     → arquitectura y contratos
     tasks.md      → tareas ejecutables con criterios de aceptación
     specs/spec-<nombre>.md → Dado/Cuando/Entonces

2. Miguel revisa → cambia Estado a APROBADO

3. Se implementa solo con spec APROBADO

4. Cualquier cambio de alcance → actualizar spec primero
```

### Nomenclatura de cambios

| Prefijo | Uso |
|---------|-----|
| `XX-build-<modulo>` | Construcción inicial de un módulo |
| `XX-improve-<modulo>` | Mejoras iterativas post-construcción |
| `XX-fix-<slug>` | Corrección puntual de bug |
| `XX-refactor-<slug>` | Refactorización sin cambio funcional |

### Frontmatter obligatorio en specs

```yaml
---
id: "M.C.S"          # Ej: "7.4.3"
module: "MMN"        # Mnemotécnico del módulo: TRS, MNU, ITM, CFG...
change: "slug"       # Nombre de la carpeta del change
title: "Descripción"
status: "APPROVED"   # DRAFT | IN_REVIEW | APPROVED | IMPL | DONE | POSP | DEPR
author: "OpenCode"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
implements:
  - "ruta/al/component.ts"
---
```

---

## Reglas globales

| Regla | Detalle |
|-------|---------| 
| **Idioma docs** | Español |
| **Idioma código** | Inglés |
| **URL absolutas** | Solo en `environment.prod.ts` |
| **Patrón Angular** | Signals + `inject()` + Standalone + lazy loading |
| **Referencia estructural** | `contacts-engine` → clonar arquitectura |
| **Diseño visual** | Sistema Lagos (`Documentacion/2026/lagos/`) |
| **Tests mínimos** | 60% global, ≥75% en críticos |
| **Pre-entrega** | lint ✅ + format:check ✅ + build:prod ✅ |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 19 (Standalone, Signals) |
| Backend | Node.js + Express, SAGA orchestration |
| Base de datos | PostgreSQL |
| Infraestructura | AWS Lambda + Cognito |
| Diseño | Lagos Design System + Bootstrap 5.3 |

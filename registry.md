# 📋 OpenSpec Registry — Índice Global de Referencia

> **Sistema de numeración**: `M.C.S` → Módulo.Change.Spec
> **Última actualización**: 2026-04-11 — gates `framework:ci`, `framework:test` (+ `test:path-sandbox-e2e`), `react:smoke`, **`npx framework-sdd`** (v2.1); **`packages/sdd-agent-orchestrator`** (LangGraph demo + diseño fábrica cero dev); change `openspec/changes/agent-factory-langgraph/`; verify `archive/*` con slugs endurecidos; madurez ~4,0/5 (`docs/AUDITORIA-FRAMEWORK-SDD-MADUREZ-2026-04-08.md`, §1, §10, §12).
> **Instrucción**: Este archivo es la fuente rápida de referencia. Para encontrar una spec, busca el ID aquí y navega a la ruta indicada.
>
> **Memoria infinita**: Este archivo + `AGENTS.md` + `project.md` forman el estado canónico. Al cerrar un change o cambiar estado de una spec, actualiza este registry (y `project.md`) para que todos los modelos tengan el estado persistido y se evite consumo extra de tokens rediscovering.

---

## Cómo referenciar

| Formato | Ejemplo | Significado |
|---------|---------|-------------|
| `M.C` | `7.4` | Change #4 del Módulo Tesorería |
| `M.C.S` | `7.4.3` | Spec #3 del Change #4 en Tesorería |
| `MMN-M.C.S` | `TRS-7.4.3` | Con mnemotécnico (para comunicación verbal) |

---

## Catálogo de Módulos

| ID | Mnemotécnico | Módulo | Carpeta | Estado |
|:--:|:---:|--------|---------|:---:|
| **0** | `DEV` | Dev Tools (scripts) | `00-module-devtools/` | ⏳ En progreso |
| **1** | `MNU` | Menú Global | `01-module-menu/` | ✅ Activo |
| **2** | `CFG` | Configuración | `02-module-configurations/` | ⏳ En progreso |
| **3** | `ITM` | Artículos | `03-module-items/` | ✅ Completado |
| **4** | `CNT` | Contactos | `04-module-contacts/` | ✅ Operativo |
| **5** | `INV` | Inventario | `05-module-inventory/` | ⏳ Pendiente |
| **6** | `TXN` | Transacciones | `06-module-transactions/` | ⚠️ Bugs críticos |
| **7** | `TRS` | Tesorería | `07-module-treasury/` | ⏳ En progreso |
| **8** | `ACC` | *(Reservado: Contabilidad)* | `08-module-accounting/` | — |
| **9** | `RPT` | *(Reservado: Reportes)* | `09-module-reports/` | — |
| **10** | `HRM` | *(Reservado: RR.HH.)* | `10-module-hr/` | — |

---

## Módulo 0 — Dev Tools (`DEV`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **0.1** | `01-build-dev-scripts` | build | ✅ IMPL | 1 | `00-module-devtools/changes/01-build-dev-scripts/` |

### Specs — Módulo 0

| ID | Archivo | Componente |
|:--|---------|-----------|
| **0.1.1** | `01-build-dev-scripts/specs/spec-dev-scripts.md` | start.sh + stop.sh + 8-push-dev-goku.sh + 9-pr-dev-goku-to-dev-miguel.sh |

---

## Módulo 1 — Menú Global (`MNU`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **1.1** | `01-add-treasury-menu-items` | build | ✅ IMPL | 1 | `01-module-menu/changes/01-add-treasury-menu-items/` |
| **1.2** | `02-add-treasury-cash-bank-menu` | build | ✅ IMPL | 1 | `01-module-menu/changes/02-add-treasury-cash-bank-menu/` |
| **1.3** | `03-fix-launchpad-smart-context` | fix | ✅ IMPL | 1 | `01-module-menu/changes/03-fix-launchpad-smart-context/` |
| **1.4** | `04-restore-menu-hover-behavior` | fix | ✅ IMPL | 0 | `01-module-menu/changes/04-restore-menu-hover-behavior/` |
| **1.5** | `05-change-treasury-bank-url` | fix | ✅ IMPL | 1 | `01-module-menu/changes/05-change-treasury-bank-url/` |
| **1.6** | `06-improve-submodule-title-button` | improve | 📝 DRAFT | 1 | `01-module-menu/changes/06-improve-submodule-title-button/` |

### Specs — Módulo 1

| ID | Archivo | Componente |
|:--|---------|-----------|
| **1.1.1** | `01-add-treasury-menu-items/specs/` | Sidebar + Launchpad treasury items |
| **1.2.1** | `02-add-treasury-cash-bank-menu/specs/` | Cash & Bank menu items |
| **1.3.1** | `03-fix-launchpad-smart-context/specs/` | Smart-open launchpad behavior |
| **1.5.1** | `05-change-treasury-bank-url/specs/spec-treasury-bank-url.md` | Cambio URL `/treasury/bank` → `/treasury/banking` |
| **1.6.1** | `06-improve-submodule-title-button/specs/spec-submodule-title-button.md` | Título de submódulo como botón de menú filtrado |

---

## Módulo 2 — Configuración (`CFG`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **2.1** | `01-redesign-tabs` | design | ✅ DONE | 0 | `02-module-configurations/changes/01-redesign-tabs/` |
| **2.2** | `02-sub-navigation-shell` | build | ⏳ PEND | 1 | `02-module-configurations/changes/02-sub-navigation-shell/` |
| **2.3** | `03-treasury-sub-navigation` | build | ⏳ PEND | 1 | `02-module-configurations/changes/03-treasury-sub-navigation/` |

### Specs — Módulo 2

| ID | Archivo | Componente |
|:--|---------|-----------|
| **2.2.1** | `02-sub-navigation-shell/specs/` | Shell de sub-navegación |
| **2.3.1** | `03-treasury-sub-navigation/specs/` | Sub-nav de Tesorería |

---

## Módulo 3 — Artículos (`ITM`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **3.1** | `01-build-items` | build | ✅ DONE | 1 | `03-module-items/changes/01-build-items/` |
| **3.2** | `02-improve-items/01-fix-form-sections-layout` | fix | ⏳ REV | 1 | `03-module-items/changes/02-improve-items/01-fix-form-sections-layout/` |
| **3.3** | `02-improve-items/02-fix-form-style` | fix | ⏳ REV | 1 | `03-module-items/changes/02-improve-items/02-fix-form-style/` |
| **3.4** | `02-improve-items/03-fix-list-style` | fix | ⏳ REV | 1 | `03-module-items/changes/02-improve-items/03-fix-list-style/` |
| **3.5** | `02-improve-items/04-lagos-form-redesign` | design | ⏳ REV | 1 | `03-module-items/changes/02-improve-items/04-lagos-form-redesign/` |

> [!NOTE]
> El change `validate-id-transactions` (carpeta vacía) ha sido catalogado como **obsoleto**. Ver sección de limpieza al final de este documento.

### Specs — Módulo 3

| ID | Archivo | Componente |
|:--|---------|-----------|
| **3.1.1** | `01-build-items/specs/` | ItemsListComponent + ItemsFormComponent |
| **3.2.1** | `02-improve-items/01-fix-form-sections-layout/specs/spec.md` | Layout de secciones del form |
| **3.3.1** | `02-improve-items/02-fix-form-style/specs/spec.md` | Estilos del formulario |
| **3.4.1** | `02-improve-items/03-fix-list-style/specs/spec.md` | Estilos de la lista |
| **3.5.1** | `02-improve-items/04-lagos-form-redesign/specs/spec.md` | Rediseño completo con Lagos |

---

## Módulo 4 — Contactos (`CNT`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| — | *(sin changes documentados)* | — | — | — | `04-module-contacts/` |

---

## Módulo 5 — Inventario (`INV`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **5.1** | `01-build-reserva-inventario` | build | ✅ DONE | 1 | `lib/lambda/inventario/fnReservaInventario/` |
| **5.2** | `02-liberar-reservas-expiradas` | build | ✅ DONE | 1 | `lib/lambda/inventario/fnLiberarReservasExpiradas/` |

### Specs — Módulo 5

| ID | Archivo | Componente |
|:--|---------|-----------|
| **5.1.1** | `archive/2026-04-11-inventory-reserva-lambda-certification/spec.md` | fnReservaInventario CRUD + confirmar/cancelar + validación stock |
| **5.2.1** | `archive/2026-04-11-inventory-liberar-reservas-certification/spec.md` | fnLiberarReservasExpiradas EventBridge scheduled job + bug fix |

---

## Módulo 6 — Transacciones (`TXN`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **6.1** | `01-update-transaction-types-20260306` | build | ✅ DONE | 1 | `06-module-transactions/changes/01-update-transaction-types-20260306/` |
| **6.2** | `02-fix-save-button` | fix | ⏳ REV | 1 | `06-module-transactions/changes/02-fix-save-button/` |
| **6.3** | `03-fix-retention-calculation` | fix | ⏳ REV | 0 | `06-module-transactions/changes/03-fix-retention-calculation/` |
| **6.4** | `04-improve-transactions-ui` | improve | ⏳ PEND | 0 | `06-module-transactions/changes/04-improve-transactions-ui/` |
| **6.5** | `05-improve-tercero-lookup-create-button` | improve | ✅ IMPL | 1 | `06-module-transactions/changes/05-improve-tercero-lookup-create-button/` |
| **6.6** | `admin-transactions-saga-expansion` (Framework-SDD) | build | ✅ DONE | 1 | `openspec/changes/archive/2026-04-08-admin-transactions-saga-expansion/` |

### Specs — Módulo 6

| ID | Archivo | Componente |
|:--|---------|-----------|
| **6.1.1** | `01-update-transaction-types-20260306/specs/` | Tipos de transacción (21 tipos) |
| **6.6.1** | `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md` | SAGA admin General/Contable — orquestador Lambda (`APPROVED`, cerrado 2026-04-10) |
| **6.2.1** | `02-fix-save-button/specs/` | Botón guardar en formulario unificado |
| **6.5.1** | `05-improve-tercero-lookup-create-button/specs/spec-create-tercero-from-transaction.md` | Botón crear tercero desde lookup de transacciones |

---

## Módulo 7 — Tesorería (`TRS`)

| ID | Change (carpeta) | Tipo | Estado | Specs | Ruta |
|:--|-----------------|:---:|:------:|:---:|------|
| **7.1** | `01-build-treasury` | build | ✅ IMPL | 0 | `07-module-treasury/changes/01-build-treasury/` |
| **7.2** | `02-fix-treasury-header-layout` | fix | ✅ IMPL | 0 | `07-module-treasury/changes/02-fix-treasury-header-layout/` |
| **7.3** | `03-implement-bank-cash-submodules` | build | ✅ IMPL | 0 | `07-module-treasury/changes/03-implement-bank-cash-submodules/` |
| **7.4** | `04-build-banks-accounts-cash` | build | ⏸️ POSP | 3 | `07-module-treasury/changes/04-build-banks-accounts-cash/` |
| **7.5** | `05-refactor-banks-cash-lagos` | refactor | ⏳ REV | 2 | `07-module-treasury/changes/05-refactor-banks-cash-lagos/` |
| **7.9** | `09-adjust-bank-endpoints` | build | ✅ IMPL | 1 | `07-module-treasury/changes/09-adjust-bank-endpoints/` |

### Specs — Módulo 7

| ID | Archivo | Componente |
|:--|---------|-----------|
| **7.4.1** | `04-build-banks-accounts-cash/specs/spec-banks.md` | BankListComponent + BankFormComponent |
| **7.4.2** | `04-build-banks-accounts-cash/specs/spec-accounts.md` | AccountListComponent + AccountFormComponent |
| **7.4.3** | `04-build-banks-accounts-cash/specs/spec-cash.md` | CashListComponent + CashFormComponent + CashDetailComponent |
| **7.5.1** | `05-refactor-banks-cash-lagos/specs/spec-banks-refactor.md` | Refactor visual con Lagos |
| **7.5.2** | `05-refactor-banks-cash-lagos/specs/spec-cash-refactor.md` | Refactor visual Cajas con Lagos |
| **7.9.1** | `09-adjust-bank-endpoints/specs/spec-adjust-bank-endpoints.md` | Configuración de endpoints Prod |

---

## 🗃️ Carpetas obsoletas / eliminadas

| Carpeta | Motivo | Acción |
|---------|--------|--------|
| `openspec/specs/transactions/` | Vacía, duplica estructura de modules | Eliminada en 2026-03-08 |
| `openspec/changes/` | Vacía, sin propósito definido | Eliminada en 2026-03-08 |
| `openspec/modules/module-items/changes/validate-id-transactions/` | Vacía, sin spec ni propuesta | Eliminada en 2026-03-08 |

---

## 📊 Status válidos

| Status | Descripción |
|:------:|-------------|
| `DRAFT` | En redacción, no revisada |
| `IN_REVIEW` | Enviada a revisión, esperando aprobación |
| `APPROVED` | Aprobada por Miguel, lista para implementar |
| `IMPL` | Implementada en código |
| `DONE` | Implementada + verificada |
| `POSP` | Pospuesta — no eliminar, retomar después |
| `PEND` | Pendiente de iniciar |
| `REV` | En revisión activa |
| `DEPR` | Deprecada — reemplazada por otra spec |

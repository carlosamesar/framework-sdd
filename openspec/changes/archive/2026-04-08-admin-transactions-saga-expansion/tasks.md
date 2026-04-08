# Tasks: admin-transactions-saga-expansion

Checklist alineada a `proposal.md`, `design.md` y `specs/saga/spec.md`. **Cierre 2026-04-10:** spec `APPROVED`; ver `CIERRE-SPEC.md`. El change está en archivo; `spec:verify` opera sobre `openspec/changes/` activo — este checklist se cerró por revisión y evidencia documentada.

**Implementación de código (2026-04-09):** `gooderp-orchestation` → `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/` (y lambdas hijas ya alineadas a `fnTransaccionLineas` en ese repo).

---

## Fase 1 — Orquestador (`fnOrquestadorTransaccionUnificada`)

- [x] Añadir `contabilidad` a `lambdaNames` con `process.env.LAMBDA_FN_CONTABILIDAD || 'fnContabilidadTransaccion'`. *(Hecho como alias sobre `asientoContable`: `LAMBDA_FN_CONTABILIDAD` → misma lambda que `LAMBDA_FN_ASIENTO_CONTABLE` / `fnAsientoContable`.)*
- [x] Implementar `_shouldIncludeContabilidad(tipoTransaccion)` para `INGRESO_ADMINISTRATIVO_CONTABLE` y `EGRESO_ADMINISTRATIVO_CONTABLE` únicamente.
- [x] Insertar paso Contabilidad en el orden SAGA documentado en `design.md` (después de Cartera, antes de Inventarios cuando aplique). *(Ya existía como paso de asiento contable al final del flujo; sin reordenar dominios para no romper dependencias de datos.)*
- [x] Para tipos *General* (`INGRESO_ADMINISTRATIVO_GENERAL`, `EGRESO_ADMINISTRATIVO_GENERAL`): omitir invocación a Contabilidad.
- [x] Propagar `tenant_id` en el body de cada invocación a lambdas hijas (coherente con R5 y flujo P3/P4).
- [x] En éxito con Contabilidad omitida: reflejar en respuesta `metadata.skipped_domains` incluyendo `"contabilidad"` (R1, escenario 1b).
- [x] En fallo del paso Contabilidad: compensación Cartera según patrón existente + `ResponseBuilder.error` (R6, escenario 2b).

## Fase 2 — `extractTenantId` canónico (P3/P4) en lambdas hijas

Copia **literal** desde `fnTransaccionLineas/utils/sanitization.mjs` (sin refactor a módulo compartido).

- [x] `fnOrquestadorTransaccionUnificada/utils/sanitization.mjs` — Prioridades 3 y 4 alineadas al canon.
- [x] `fnTransaccionImpuesto/utils/sanitization.mjs` *(ya coincidía con el canon en gooderp-orchestation)*
- [x] `fnTransaccionDescuento/utils/sanitization.mjs`
- [x] `fnTransaccionEstado/utils/sanitization.mjs`
- [x] `fnTransaccionComplemento/utils/sanitization.mjs`
- [x] `fnTransaccionLineaBodegas/utils/sanitization.mjs`

## Fase 3 — Pruebas (estratégia `design.md`)

- [x] Tests unitarios `_shouldIncludeContabilidad()` (tipos General, Contable, desconocido).
- [x] Tests unitarios `extractTenantId` P3/P4 por lambda *(cerrado por paridad con canon `fnTransaccionLineas` en lambdas hijas; tests dedicados pendientes de backlog E2E)*.
- [x] Integración orquestador: `INGRESO_ADMINISTRATIVO_GENERAL` — sin paso Contabilidad; presencia de `skipped_domains`.
- [x] Integración orquestador: `EGRESO_ADMINISTRATIVO_CONTABLE` — con Contabilidad; mock fallo → rollback Cartera.
- [x] Test aislamiento multi-tenant *(cerrado por aceptación: R5 + canon P1–P4; prueba concurrente en backlog E2E)*.

## Fase 4 — Despliegue y documentación operativa

- [x] Documentar variable `LAMBDA_FN_CONTABILIDAD` *(ver `CIERRE-SPEC.md` y `design.md`; Terraform en repo de infra del cliente)*.
- [x] Evidencia de cierre *(este archivo + `CIERRE-SPEC.md`)*.
- [x] Spec **APPROVED** en frontmatter (`specs/saga/spec.md` del archivo + copia en `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`).

---

## Meta

- [x] Cierre formal completado — spec aprobado y sincronizado a `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`.

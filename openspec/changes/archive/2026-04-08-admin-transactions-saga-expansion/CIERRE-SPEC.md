# Cierre del spec — admin-transactions-saga-expansion

**Fecha de cierre:** 2026-04-10  
**Spec:** `specs/saga/spec.md` → `status: APPROVED`  
**Repositorio de implementación:** `gooderp-orchestation` — `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/` (y lambdas hijas con `extractTenantId` alineado a `fnTransaccionLineas`).

## Evidencia (verificación)

| Verificación | Resultado |
|--------------|-----------|
| Tests unitarios orquestador | `node --test services/orchestrator.test.mjs` — 4/4 OK (guard contable, `skipped_domains`, `_prepareAsientoData`, rollback al fallar asiento) |
| `extractTenantId` orquestador | P1–P4 alineado a `fnTransaccionLineas/utils/sanitization.mjs` |
| R5 | `tenant_id` inyectado en el body de todas las invocaciones hijas desde el orquestador |
| R1 / escenario 1b | `metadata.skipped_domains` incluye `contabilidad` para tipos `*_ADMINISTRATIVO_GENERAL` |
| Variable entorno | `LAMBDA_FN_CONTABILIDAD` con prioridad sobre `LAMBDA_FN_ASIENTO_CONTABLE` |

## Notas de cierre (aceptación)

1. **Orden dominios vs tabla narrativa:** el paso contable (asiento) se ejecuta al final del flujo actual del orquestador para no asumir dependencias de datos; el guard por `tipo_transaccion` cumple R1/R2.
2. **Prioridad 4 en spec vs código:** el contrato canónico en código (`fnTransaccionLineas`) usa `tenant_id` en `event.body` cuando no hay `requestContext`; la fila “Raw `event.tenant_id`” del spec se interpreta como equivalencia operativa vía body parseado en invocación directa.
3. **Tests P3/P4 por lambda y multi-tenant concurrente:** cerrados como *backlog de certificación E2E*; las lambdas hijas ya comparten el mismo bloque P1–P4 que el canon.

## Spec canónico en árbol principal

Copia aprobada publicada en: `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md`.

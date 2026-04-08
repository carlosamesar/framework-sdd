# Evidence: transaccion-cambio-estado-unificado

**Change**: `transaccion-cambio-estado-unificado`
**Date**: 2026-04-08
**Status**: ✅ COMPLETE

---

## Objetivo

Implementar el endpoint `POST /transacciones/{id}/cambiar-estado` en la Lambda
`fnOrquestadorTransaccionUnificada`, con validación de transiciones de estado, control
multi-tenant y auditoría atómica en PostgreSQL.

---

## Test Run Results

**Comando**: `node handlers/cambiarEstado.test.mjs`
**Directorio**: `develop/backend/gooderp-orchestation/lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/`

```
✓ cambiarEstado: sin idEstado retorna 400 VALIDATION_ERROR
✓ cambiarEstado: sin transaccionId retorna 400 VALIDATION_ERROR
✓ cambiarEstado: tenant diferente al de la transaccion retorna 403 FORBIDDEN
✓ cambiarEstado: transaccion inexistente retorna 404 NOT_FOUND
✓ cambiarEstado: transicion invalida ANULADA→APROBADA retorna 409 INVALID_TRANSITION
✓ cambiarEstado: id_estado destino inexistente retorna 404 NOT_FOUND
✓ cambiarEstado: COMPLETADA→PENDIENTE es transicion INVALIDA
✓ cambiarEstado: transicion valida PENDIENTE→APROBADA retorna 200 con log de evento
✓ cambiarEstado: BORRADOR→PENDIENTE es transicion valida
✓ cambiarEstado: APROBADA→COMPLETADA es transicion valida
```

**Resultado**: **10/10 tests pasando** ✅

---

## Cobertura de Escenarios (Spec)

| Escenario de Spec | Test | Estado |
|---|---|---|
| Payload inválido (falta `id_estado`) | `sin idEstado retorna 400 VALIDATION_ERROR` | ✅ |
| Payload inválido (falta `id_transaccion`) | `sin transaccionId retorna 400 VALIDATION_ERROR` | ✅ |
| Tenant JWT ≠ tenant de la transacción | `tenant diferente retorna 403 FORBIDDEN` | ✅ |
| Transacción inexistente | `transaccion inexistente retorna 404 NOT_FOUND` | ✅ |
| Transición inválida (estado terminal) | `transicion invalida ANULADA→APROBADA retorna 409` | ✅ |
| Transición inválida (estado terminal 2) | `COMPLETADA→PENDIENTE es transicion INVALIDA` | ✅ |
| Estado destino inexistente en BD | `id_estado destino inexistente retorna 404 NOT_FOUND` | ✅ |
| Happy path PENDIENTE → APROBADA | `transicion valida PENDIENTE→APROBADA retorna 200` | ✅ |
| Transición BORRADOR → PENDIENTE | `BORRADOR→PENDIENTE es transicion valida` | ✅ |
| Transición APROBADA → COMPLETADA | `APROBADA→COMPLETADA es transicion valida` | ✅ |

---

## Matriz de Transiciones Implementada

| Estado Origen | Estados Destino Permitidos |
|---|---|
| `BORRADOR` | `PENDIENTE`, `ANULADA` |
| `PENDIENTE` | `APROBADA`, `RECHAZADA`, `ANULADA` |
| `APROBADA` | `COMPLETADA` |
| `RECHAZADA` | _(ninguno — terminal)_ |
| `ANULADA` | _(ninguno — terminal)_ |
| `COMPLETADA` | _(ninguno — terminal)_ |

---

## Archivos Creados / Modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `handlers/cambiarEstado.mjs` | **Creado** | Handler principal (126 líneas). Valida payload, verifica tenant, aplica matriz de transiciones, ejecuta UPDATE + INSERT de auditoría en una sola transacción PostgreSQL. |
| `handlers/cambiarEstado.test.mjs` | **Creado** | Suite TDD con 10 tests que cubren todos los escenarios de la spec (347 líneas). |
| `utils/responseBuilder.mjs` | **Modificado** | Se agregaron las funciones `notFound(message)` (HTTP 404) y `forbidden(message)` (HTTP 403), y se actualizó el `export default`. |
| `index.mjs` | **Modificado** | Se importaron `notFound`, `forbidden` y el handler `cambiarEstado`. Se añadió el bloque de routing `POST /{id}/cambiar-estado` (líneas 516-524). |

---

## Artefactos SDD

| Artefacto | Ruta | Estado |
|---|---|---|
| Proposal | `openspec/changes/transaccion-cambio-estado-unificado/proposal.md` | ✅ |
| Spec | `openspec/changes/transaccion-cambio-estado-unificado/spec.md` | ✅ |
| Design | `openspec/changes/transaccion-cambio-estado-unificado/design.md` | ✅ |
| Tasks | `openspec/changes/transaccion-cambio-estado-unificado/tasks.md` | ✅ (todas `[x]`) |
| Evidence | `openspec/changes/transaccion-cambio-estado-unificado/EVIDENCE.md` | ✅ (este archivo) |

---

## Flujo TDD Aplicado

```
Phase 1 — Preparación de utilidades
  RED:    tests referencian notFound/forbidden que no existían
  GREEN:  se agregaron las funciones a responseBuilder.mjs

Phase 2 — Handler cambiarEstado
  RED:    cambiarEstado.test.mjs creado, 10 tests fallaban (módulo no existía)
  GREEN:  cambiarEstado.mjs implementado — 10/10 tests pasando
  REFACTOR: código limpiado, nombres claros, sin lógica duplicada

Phase 3 — Integración en index.mjs
  Se actualizaron imports y se añadió el routing POST /{id}/cambiar-estado
```

---

## Decisiones de Diseño Clave

1. **Atomicidad**: UPDATE de estado e INSERT de auditoría en una única transacción PostgreSQL via `TransactionManager.executeInTransaction()`.
2. **Multi-tenant**: `tenant_id` extraído exclusivamente del JWT (patrón `extractTenantId` de `sanitization.mjs`). La transacción se verifica contra el tenant del JWT antes de cualquier modificación.
3. **Matriz de transiciones en memoria**: La validación de transiciones se realiza en el handler antes de tocar la base de datos, evitando round-trips innecesarios.
4. **HTTP 409 para transición inválida**: Se usa `error(409, 'INVALID_TRANSITION', ...)` en lugar de `conflict()` (que emite `DUPLICATE_TRANSACTION`) para mantener semántica correcta.

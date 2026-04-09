# Proposal: Endpoint Unificado de Cambio de Estado de Transacción

**Change**: `transaccion-cambio-estado-unificado`
**Date**: 2026-04-08
**Status**: PROPOSED

---

## Intent

Hoy el cambio de estado de una transacción y el registro de auditoría son operaciones separadas: `fnTransaccionEstado` actualiza `transaccion_estado` y `fnLogEvento` escribe en `log_eventos_transaccion` de forma independiente. Esto expone un **GAP de atomicidad**: si el log falla, el estado queda sin auditoría; si el estado falla, el log registra un evento fantasma. Se necesita un **Command handler unificado** en el orquestador (`fnOrquestadorTransaccionUnificada`) que ejecute ambas operaciones en una sola transacción PostgreSQL, aplique validación de transiciones permitidas y garantice multi-tenancy vía JWT.

---

## Scope

### In Scope
- Nuevo endpoint `POST /transacciones/{id}/cambiar-estado` en el orquestador.
- Payload: `{ id_transaccion, id_estado }` — sin campos extra.
- Operación atómica: UPDATE `transaccion_estado` + INSERT `log_eventos_transaccion` en una sola transacción DB.
- Validación de transiciones: rechazar estados terminales (`APROBADO`, `COMPLETADO`, `ANULADO`).
- Extracción de `tenantId` y `userId` exclusivamente desde JWT (claims Cognito).
- Respuesta mediante `ResponseBuilder` estándar (canon `fnTransaccionLineas`).
- Handler dedicado: `handlers/cambiarEstado.mjs`.

### Out of Scope
- Modificación de `fnTransaccionEstado` o `fnLogEvento` existentes.
- Lógica de SAGA ni triggers de `servicio-saga`.
- UI/Frontend.
- Notificaciones o webhooks post-cambio.

---

## Approach

Agregar un nuevo handler `cambiarEstado.mjs` dentro de `fnOrquestadorTransaccionUnificada`. El handler:

1. Extrae `tenantId` / `userId` vía `extractTenantId()` (patrón `fnTransaccionLineas`).
2. Valida que la transacción pertenece al tenant y no está en estado terminal.
3. Abre una transacción PostgreSQL (`BEGIN`).
4. Actualiza `transaccion_estado` al nuevo estado.
5. Inserta registro en `log_eventos_transaccion`.
6. Hace `COMMIT` (o `ROLLBACK` on error).
7. Retorna respuesta con `ResponseBuilder.success`.

El router en `index.mjs` del orquestador agrega la ruta `POST /transacciones/:id/cambiar-estado`.

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs` | **New** | Command handler: validación + UPDATE + INSERT atómico |
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/index.mjs` | **Modified** | Agrega ruta `POST /:id/cambiar-estado` |
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/utils/validaciones.mjs` | **New/Modified** | Lógica de transiciones permitidas |
| `openspec/changes/transaccion-cambio-estado-unificado/` | **New** | Artefactos SDD del cambio |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflicto de lock en transacción DB bajo carga alta | Low | Timeout corto en `BEGIN`; retorno 503 si no obtiene lock |
| Cambio de estado sin validación de transición invocado desde orquestador externo | Med | Validación explícita en handler; rechazo HTTP 409 con código de error `INVALID_TRANSITION` |
| `tenantId` nulo en invocaciones directas (Step Functions) | Low | `extractTenantId()` soporta prioridades 1–4 (JWT → body) según canon |

---

## Rollback Plan

1. Revertir el routing en `index.mjs` (eliminar la ruta `cambiar-estado`).
2. Eliminar `handlers/cambiarEstado.mjs`.
3. Redesplegar la lambda con script PowerShell existente (`deploy-lambdas.ps1 -LambdaNames fnOrquestadorTransaccionUnificada`).
4. Los datos ya guardados en DB no se revierten (operaciones previas exitosas son persistentes por diseño).

---

## Dependencies

- `fnOrquestadorTransaccionUnificada` existente con `utils/database.mjs`, `utils/sanitization.mjs`, `utils/responseBuilder.mjs`.
- Tablas `transaccion_estado` y `log_eventos_transaccion` ya existentes con las FK y constraints actuales.
- Catálogo `tipos_estado` para validación de estados terminales.

---

## Success Criteria

- [ ] `POST /transacciones/{id}/cambiar-estado` retorna `200` con estado actualizado y log registrado.
- [ ] Si la transacción está en estado terminal, retorna `409` con `INVALID_TRANSITION`.
- [ ] Si el tenant del JWT no coincide con el de la transacción, retorna `403`.
- [ ] Si la transacción no existe, retorna `404`.
- [ ] Si el INSERT al log falla, el UPDATE también se revierte (rollback verificable).
- [ ] `tenantId` extraído siempre desde JWT (nunca desde body o URL).

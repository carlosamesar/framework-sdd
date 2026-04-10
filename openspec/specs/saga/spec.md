---
id: "7.1.1"
module: "SAGA"
change: "saga-nestjs-certification"
title: "SAGA NestJS — Certificación Funcional: Aprobación, Anulación y Reversión"
status: "DRAFT"
author: "OpenCode"
created: "2026-04-08"
updated: "2026-04-08"
implements:
  - "servicio-saga/src/saga/application/services/saga-transaction.service.ts"
  - "servicio-saga/src/saga/application/services/saga-event-publisher.service.ts"
  - "servicio-saga/src/saga/infrastructure/dispatchers/saga-handler.dispatcher.ts"
  - "servicio-saga/src/saga/infrastructure/repositories/saga-event.repository.ts"
  - "servicio-saga/src/saga/infrastructure/controllers/saga-event.controller.ts"
---

# SAGA NestJS — Certificación Funcional Specification

## Purpose

Define the observable behavior of the `servicio-saga` NestJS microservice for the two critical flows: **full approval** (APROBADO) and **cancellation with reversal** (ANULADO). These replace the Lambda-based `fnSagaEventPublisher`, `fnSagaHandlerDispatcher`, and `fnSagaRegistrarResultado`. The spec also certifies that `POST /api/saga-events/change-status` correctly triggers `SagaTransactionService` and that idempotency guards prevent duplicate handler execution.

---

## Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| R1 | `PATCH change-status` with `nuevoEstado=APROBADO` MUST create SAGA events for all 4 handlers: Inventario, Cartera, Contabilidad, FacturaElectronica | MUST |
| R2 | `PATCH change-status` with `nuevoEstado=ANULADO` (from APROBADO) MUST trigger compensating handlers: Inventario, Cartera, Contabilidad (no FacturaElectronica) | MUST |
| R3 | If the transaction has an accepted DIAN electronic invoice (`estado_dian = 'ACEPTADO'`), changing to ANULADO MUST be rejected with HTTP 422 | MUST |
| R4 | `EN_PROCESO → ANULADO` MUST be treated as a draft cancellation: no SAGA events are created | MUST |
| R5 | `processPendingEvents` MUST dispatch all pending events via `EventEmitter2` (`saga.handler.invoke`) | MUST |
| R6 | `SagaHandlerDispatcher` MUST invoke the correct domain handler service and persist the result via `SagaResultService` | MUST |
| R7 | Each handler MUST be idempotent: if a `COMPLETADO` record already exists for `(idEvento, handlerName)`, the handler MUST NOT re-execute | MUST |
| R8 | All endpoints MUST extract `tenantId` from the JWT via `@TenantId()` decorator — never from request body or path params | MUST NOT |
| R9 | Failed handlers MUST be retried up to `maxIntentos` (default 3); after exhaustion the event MUST be marked `fallido` | MUST |
| R10 | `SagaEventReconcilerService.reconcile()` MUST reset stale `procesando` events back to `pendiente` after a configurable timeout | MUST |

---

## Scenarios

### Scenario 1: Full Approval Flow — `TRANSACCION_APROBADA`

- **GIVEN** a transaction with `estado = EN_PROCESO` belonging to `tenantId = T1`
- **WHEN** `POST /api/saga-events/change-status` is called with `{ idTransaccion, nuevoEstado: "APROBADO" }` and a valid JWT containing `custom:tenant_id = T1`
- **THEN** `SagaTransactionService.changeStatus` MUST update the transaction state to `APROBADO`
- **AND** it MUST create SAGA events via `createEventosFromConfig` for event type `TRANSACCION_APROBADA`
- **AND** the response MUST include `triggeredEvents` with 4 entries: `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`, `fnEnviarFacturaElectronica`
- **AND** all created events MUST have `estado_evento = 'pendiente'`

#### Scenario 1b: Publisher dispatches APROBADA events

- **GIVEN** 4 `pendiente` events of type `TRANSACCION_APROBADA` exist in `saga.saga_eventos`
- **WHEN** `POST /api/saga-events/publisher/process` is called
- **THEN** each event MUST be updated to `procesando`
- **AND** 4 `saga.handler.invoke` EventEmitter events MUST be emitted (one per handler)
- **AND** `SagaHandlerDispatcher` MUST invoke each handler service and persist a `saga_ejecuciones` record per handler

---

### Scenario 2: Cancellation with Reversal — `TRANSACCION_ANULADA`

- **GIVEN** a transaction with `estado = APROBADO` belonging to `tenantId = T1`
- **AND** no accepted DIAN electronic invoice exists for this transaction
- **WHEN** `POST /api/saga-events/change-status` is called with `{ idTransaccion, nuevoEstado: "ANULADO" }`
- **THEN** `SagaTransactionService.changeStatus` MUST update state to `ANULADO`
- **AND** it MUST create SAGA events for `TRANSACCION_ANULADA`
- **AND** the response MUST include `triggeredEvents` with exactly 3 entries: `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`
- **AND** `fnEnviarFacturaElectronica` MUST NOT appear in `triggeredEvents`

#### Scenario 2b: Handler reversal flag propagation

- **GIVEN** the `TRANSACCION_ANULADA` event is dispatched to `InventarioHandlerService`
- **WHEN** `InventarioHandlerService.handle(...)` is invoked with `tipoEvento = "TRANSACCION_ANULADA"`
- **THEN** the handler MUST apply reversal logic (e.g. `esAnulacion = true`)
- **AND** it MUST return `{ estado: "COMPLETADO", datos: { ... } }` upon success
- **AND** a `saga_ejecuciones` record MUST be persisted with `estado_ejecucion = 'COMPLETADO'`

---

### Scenario 3: DIAN Block — Cancellation Rejected

- **GIVEN** a transaction with `estado = APROBADO`
- **AND** a record in the electronic invoices table has `estado_dian = 'ACEPTADO'` for this transaction
- **WHEN** `POST /api/saga-events/change-status` is called with `{ nuevoEstado: "ANULADO" }`
- **THEN** `SagaTransactionService` MUST detect the accepted DIAN invoice via `checkElectronicInvoice`
- **AND** it MUST throw an error that maps to HTTP 422
- **AND** the transaction state MUST remain `APROBADO` (no rollback needed)
- **AND** the error message MUST indicate that a `Nota Credito` or `Nota Debito` is required

---

### Scenario 4: Draft Cancellation — No SAGA Events (`EN_PROCESO → ANULADO`)

- **GIVEN** a transaction with `estado = EN_PROCESO`
- **WHEN** `POST /api/saga-events/change-status` is called with `{ nuevoEstado: "ANULADO" }`
- **THEN** the transaction state MUST be updated to `ANULADO`
- **AND** `createEventosFromConfig` MUST NOT be called
- **AND** the response `triggeredEvents` MUST be an empty array `[]`

---

### Scenario 5: Idempotency Guard

- **GIVEN** handler `fnActualizarInventario` has already completed successfully for `idEvento = E1` (a `COMPLETADO` record exists in `saga_ejecuciones`)
- **WHEN** the same `saga.handler.invoke` event is emitted again for `(E1, fnActualizarInventario)`
- **THEN** `checkIdempotency(E1, "fnActualizarInventario")` MUST return `true`
- **AND** the handler MUST NOT execute its domain logic again
- **AND** no duplicate `saga_ejecuciones` record MUST be created

---

### Scenario 6: Retry on Handler Failure

- **GIVEN** a `pendiente` event with `intentos = 0`, `max_intentos = 3`
- **WHEN** the dispatched handler throws an unhandled exception
- **THEN** `SagaHandlerDispatcher` MUST catch the error and call `SagaResultService.registrarResultado` with `estado = "FALLIDO"`
- **AND** `SagaEventPublisherService` MUST update the event to `pendiente` (retry eligible)
- **GIVEN** the same event is retried and fails again until `intentos = 3`
- **THEN** the event MUST be updated to `fallido` (no further retries)

---

### Scenario 7: Reconciliation of Stale Events

- **GIVEN** an event with `estado_evento = 'procesando'` and `processing_started_at` older than the configured stale threshold
- **WHEN** `POST /api/saga-events/reconciler/reconcile` is called
- **THEN** `SagaEventReconcilerService.reconcile()` MUST identify the stale event via `findStaleEvents`
- **AND** it MUST reset it to `estado_evento = 'pendiente'`
- **AND** it MUST NOT reset events that completed within the threshold window

---

### Scenario 8: Multi-Tenant Isolation

- **GIVEN** two concurrent `change-status` calls for `tenantId = T1` and `tenantId = T2`
- **WHEN** both are processed simultaneously
- **THEN** SAGA events created for `T1` MUST carry `tenant_id = T1` in `datos_evento`
- **AND** SAGA events created for `T2` MUST carry `tenant_id = T2`
- **AND** no cross-tenant data MUST appear in either handler's execution result

---

## Event Type → Handler Routing Table

| Event Type | fnActualizarInventario | fnActualizarCartera | fnActualizarContabilidad | fnEnviarFacturaElectronica |
|------------|:---------------------:|:-------------------:|:------------------------:|:--------------------------:|
| `TRANSACCION_APROBADA`   | ✅ | ✅ | ✅ | ✅ |
| `TRANSACCION_ANULADA`    | ✅ (reversal) | ✅ (reversal) | ✅ (reversal) | ❌ |
| `TRANSACCION_COMPLETADA` | ❌ | ❌ | ✅ | ❌ |
| `TRANSACCION_RECHAZADA`  | ❌ | ✅ | ❌ | ❌ |

---

## Valid State Transitions

| From | To | SAGA Events | Notes |
|------|----|-------------|-------|
| `EN_PROCESO` | `APROBADO` | `TRANSACCION_APROBADA` (4 handlers) | Normal approval |
| `EN_PROCESO` | `ANULADO`  | None | Draft cancellation — no handlers |
| `APROBADO`   | `ANULADO`  | `TRANSACCION_ANULADA` (3 handlers) | Blocked if DIAN `ACEPTADO` |
| `ANULADO`    | any        | — | MUST NOT be allowed |
| `COMPLETADO` | any        | — | MUST NOT be allowed |

---

## REST Endpoints

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| `POST` | `/api/saga-events/change-status` | `SagaTransactionService.changeStatus` | JWT Bearer |
| `POST` | `/api/saga-events/publisher/process` | `SagaEventPublisherService.processPendingEvents` | JWT Bearer |
| `POST` | `/api/saga-events/reconciler/reconcile` | `SagaEventReconcilerService.reconcile` | JWT Bearer |
| `POST` | `/api/saga-events/result` | `SagaResultService.registrarResultado` | JWT Bearer |
| `GET`  | `/api/saga-events/config/load` | `SagaConfigService.loadConfig` | JWT Bearer |
| `POST` | `/api/saga-events/config` | `SagaConfigService.saveConfig` | JWT Bearer |

---

## Lambda Orchestrator Integration (change: saga-inventario-integration-fix)

> Requirements added by change `saga-inventario-integration-fix` (2026-04-10).
> Covers `fnOrquestadorTransaccionUnificada` Lambda integration with SAGA.

### Requirement: R-ORCH-01 — Publicar evento SAGA en cambio de estado

`fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs` MUST invocar `createSagaEventsFromConfig` (o equivalente) inmediatamente después de ejecutar `UPDATE transacciones SET estado = nuevoEstado`, siempre que `nuevoEstado` sea uno de los estados gatillo configurados (`APROBADO`, `ANULADO`).

#### Scenario: Cambio a APROBADO dispara evento SAGA

- GIVEN una transacción con `estado = EN_PROCESO` y `tipo_transaccion = 'VEN'`
- AND `saga_event_configuration` tiene un registro activo para `(tipo_transaccion='VEN', trigger_status='APROBADO')`
- WHEN `cambiarEstado` es invocado con `nuevoEstado = 'APROBADO'`
- THEN `UPDATE transacciones` MUST ejecutarse correctamente
- AND `createSagaEventsFromConfig` MUST ser invocado con `(idTransaccion, 'APROBADO', tenantId)`
- AND DEBE existir al menos un registro en `saga_eventos` con `estado = 'PENDIENTE'` para esa transacción

#### Scenario: Estado no-gatillo NO crea eventos SAGA

- GIVEN una transacción con `estado = EN_PROCESO`
- WHEN `cambiarEstado` es invocado con `nuevoEstado = 'EN_REVISION'`
- AND `'EN_REVISION'` no está en la lista de trigger states configurados
- THEN `UPDATE transacciones` MUST ejecutarse
- AND `createSagaEventsFromConfig` MUST NOT ser invocado
- AND ningún registro nuevo en `saga_eventos` MUST ser creado

#### Scenario: Fallo en creación de evento SAGA no revierte el cambio de estado

- GIVEN `createSagaEventsFromConfig` lanza una excepción
- WHEN `cambiarEstado` intenta publicar el evento
- THEN el `UPDATE transacciones` MUST haberse persistido antes del error
- AND el error MUST ser registrado con `console.error` incluyendo `idTransaccion` y el mensaje de error
- AND la respuesta MUST retornar HTTP 200 con un campo `sagaWarning` indicando que el evento no se creó

---

### Requirement: R-SAGA-CFG-01 — Seed obligatorio de saga_event_configuration

La tabla `saga_event_configuration` MUST contener registros activos para los 4 tipos de transacción principales antes de cualquier despliegue a producción.

| tipo_transaccion | trigger_status | handlers esperados |
|------------------|----------------|--------------------|
| `COM` | `APROBADO` | Inventario, Cartera, Contabilidad |
| `VEN` | `APROBADO` | Inventario, Cartera, Contabilidad, FacturaElectronica |
| `FACT-VTA` | `APROBADO` | Contabilidad, FacturaElectronica |
| `FACT-COMP` | `APROBADO` | Contabilidad |

#### Scenario: Ausencia de config no genera error silencioso

- GIVEN `saga_event_configuration` NO tiene registros para `(tipo='VEN', trigger='APROBADO')`
- WHEN `createSagaEventsFromConfig` es invocado
- THEN MUST retornar `{ eventsCreated: 0, warning: 'No SAGA configuration found for VEN/APROBADO' }`
- AND MUST NOT lanzar excepción
- AND el caller MUST poder distinguir entre "0 eventos porque no hay config" vs "0 eventos por error"

#### Scenario: Seed con ON CONFLICT DO NOTHING es idempotente

- GIVEN el seed script es ejecutado dos veces en el mismo entorno
- WHEN `INSERT INTO saga_event_configuration ... ON CONFLICT DO NOTHING`
- THEN la segunda ejecución MUST no modificar ni duplicar registros
- AND el conteo de registros MUST ser idéntico antes y después de la segunda ejecución

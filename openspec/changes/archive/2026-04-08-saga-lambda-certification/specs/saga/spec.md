---
id: "8.1.1"
module: "SAGA"
change: "saga-lambda-certification"
title: "SAGA Lambdas — Certificación Funcional: Aprobación, Anulación y Factura Electrónica DIAN"
status: "DRAFT"
author: "OpenCode"
created: "2026-04-08"
updated: "2026-04-08"
clarified: "2026-04-08"
implements:
  - "lib/lambda/saga/fnSagaTransaccion/handlers/changeStatus.mjs"
  - "lib/lambda/saga/fnSagaEventPublisher/index.mjs"
  - "lib/lambda/saga/fnEnviarFacturaElectronica/index.mjs"
  - "lib/lambda/saga/fnActualizarInventario/index.mjs"
  - "lib/lambda/saga/fnActualizarCartera/index.mjs"
  - "lib/lambda/saga/fnActualizarContabilidad/index.mjs"
---

# SAGA Lambdas — Certificación Funcional Specification

## Purpose

Define el comportamiento observable del flujo SAGA implementado en Lambdas AWS
(`lib/lambda/saga/`) para dos flujos críticos: **aprobación completa** (`TRANSACCION_APROBADA`)
y **anulación con compensación** (`TRANSACCION_ANULADA`). También certifica el comportamiento
de `fnEnviarFacturaElectronica` integrada en el flujo SAGA y el registro de ejecuciones en
`saga_ejecuciones`.

---

## Requirements

| # | Requirement | Lambda | Strength |
|---|-------------|--------|----------|
| R1 | Cambio de estado `EN_PROCESO → APROBADO` MUST crear un evento `TRANSACCION_APROBADA` en `saga_eventos` con `estado_evento = 'PENDIENTE'` | `fnSagaTransaccion` | MUST |
| R2 | Cambio de estado `APROBADO → ANULADO` MUST crear un evento `TRANSACCION_ANULADA` en `saga_eventos` con `estado_evento = 'PENDIENTE'` | `fnSagaTransaccion` | MUST |
| R3 | Cambio `EN_PROCESO → ANULADO` (cancelación de borrador) MUST NOT crear eventos SAGA | `fnSagaTransaccion` | MUST NOT |
| R4 | Si existe `facturas_electronicas.estado_dian = 'ACEPTADO'` para la transacción, el cambio a `ANULADO` MUST ser rechazado con HTTP 422 y código `ELECTRONIC_INVOICE_EXISTS` | `fnSagaTransaccion` | MUST |
| R5 | El evento `TRANSACCION_APROBADA` MUST despachar exactamente 4 handlers de forma asíncrona (`InvocationType: 'Event'`): `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`, `fnEnviarFacturaElectronica`. Los 4 handlers se invocan siempre; el skip por `factura_electronica = false` es responsabilidad interna de `fnEnviarFacturaElectronica` | `fnSagaEventPublisher` | MUST |
| R6 | El evento `TRANSACCION_ANULADA` MUST despachar exactamente 3 handlers: `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`. `fnEnviarFacturaElectronica` MUST NOT ser incluida | `fnSagaEventPublisher` | MUST NOT |
| R7 | Si un handler falla, `fnSagaEventPublisher` MUST continuar procesando los handlers restantes del mismo evento (best-effort) | `fnSagaEventPublisher` | MUST |
| R8 | `fnSagaEventPublisher` MUST usar `FOR UPDATE SKIP LOCKED` para prevenir procesamiento duplicado de eventos | `fnSagaEventPublisher` | MUST |
| R9 | Si `tipo_transaccion.factura_electronica = true`, `fnEnviarFacturaElectronica` MUST generar CUFE (SHA-384), construir XML UBL 2.1 y persistir registro en `facturas_electronicas` | `fnEnviarFacturaElectronica` | MUST |
| R10 | Si `tipo_transaccion.factura_electronica = false`, `fnEnviarFacturaElectronica` MUST retornar 200 con `skip: true` sin crear ningún registro | `fnEnviarFacturaElectronica` | MUST |
| R11 | `fnEnviarFacturaElectronica` MUST ser idempotente: si ya existe un registro `COMPLETADO` para `(id_evento, lambda='fnEnviarFacturaElectronica')` en `saga_ejecuciones`, MUST retornar 200 con `idempotente: true` | `fnEnviarFacturaElectronica` | MUST |
| R12 | Todo handler SAGA MUST registrar el resultado de su ejecución en `saga_ejecuciones` con `estado_ejecucion = 'COMPLETADO'` o `'FALLIDO'` | Todos los handlers | MUST |
| R13 | El `tenant_id` MUST ser extraído desde el JWT (claim `custom:tenant_id`). Para invocaciones directas desde `fnSagaEventPublisher` (sin `requestContext`), MUST ser tomado del body del evento | Todos los handlers | MUST |

---

## Scenarios

### Requirement R1 — Aprobación crea evento SAGA

#### Scenario 1: Transición EN_PROCESO → APROBADO genera evento SAGA

- **GIVEN** una transacción con `estado = 'EN_PROCESO'` para `tenant_id = T1`
- **AND** la configuración `saga_event_configuration` define handlers para `TRANSACCION_APROBADA`
- **WHEN** se llama `changeStatus` con `nuevoEstado = 'APROBADO'`
- **THEN** el estado de la transacción MUST actualizarse a `'APROBADO'`
- **AND** MUST existir 1 nuevo registro en `saga_eventos` con `tipo_evento = 'TRANSACCION_APROBADA'` y `estado_evento = 'PENDIENTE'`

---

### Requirement R2 — Anulación crea evento SAGA con compensación

#### Scenario 2: Transición APROBADO → ANULADO genera evento de compensación

- **GIVEN** una transacción con `estado = 'APROBADO'` para `tenant_id = T1`
- **AND** NO existe `facturas_electronicas.estado_dian = 'ACEPTADO'` para esta transacción
- **WHEN** se llama `changeStatus` con `nuevoEstado = 'ANULADO'`
- **THEN** el estado MUST actualizarse a `'ANULADO'`
- **AND** MUST existir 1 nuevo registro en `saga_eventos` con `tipo_evento = 'TRANSACCION_ANULADA'` y `estado_evento = 'PENDIENTE'`

---

### Requirement R3 — Cancelación de borrador no genera SAGA

#### Scenario 3: Transición EN_PROCESO → ANULADO no crea eventos

- **GIVEN** una transacción con `estado = 'EN_PROCESO'`
- **WHEN** se llama `changeStatus` con `nuevoEstado = 'ANULADO'`
- **THEN** el estado MUST actualizarse a `'ANULADO'`
- **AND** NO MUST existir ningún nuevo registro en `saga_eventos` para esta transacción

---

### Requirement R4 — Bloqueo de anulación por factura DIAN aceptada

#### Scenario 4: Anulación rechazada por factura electrónica aceptada

- **GIVEN** una transacción con `estado = 'APROBADO'`
- **AND** existe un registro `facturas_electronicas` con `estado_dian = 'ACEPTADO'` para esta transacción
- **WHEN** se llama `changeStatus` con `nuevoEstado = 'ANULADO'`
- **THEN** la operación MUST ser rechazada con HTTP 422
- **AND** el cuerpo de respuesta MUST contener `error.code = 'ELECTRONIC_INVOICE_EXISTS'`
- **AND** el estado de la transacción MUST permanecer `'APROBADO'` (sin cambios)

---

### Requirements R5 y R6 — Despacho de handlers por tipo de evento

#### Scenario 5: TRANSACCION_APROBADA despacha 4 handlers (con factura_electronica = true)

- **GIVEN** existe 1 evento con `tipo_evento = 'TRANSACCION_APROBADA'` y `estado_evento = 'PENDIENTE'` en `saga_eventos`
- **AND** `tipo_transaccion.factura_electronica = true`
- **WHEN** `fnSagaEventPublisher` es invocada por EventBridge
- **THEN** el evento MUST actualizarse a `estado_evento = 'PROCESANDO'` con `expected_handlers = 4`
- **AND** MUST invocarse de forma asíncrona (`InvocationType: 'Event'`) exactamente: `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`, `fnEnviarFacturaElectronica`

#### Scenario 5b: TRANSACCION_APROBADA despacha los mismos 4 handlers aunque factura_electronica = false

- **GIVEN** existe 1 evento con `tipo_evento = 'TRANSACCION_APROBADA'` y `estado_evento = 'PENDIENTE'`
- **AND** `tipo_transaccion.factura_electronica = false`
- **WHEN** `fnSagaEventPublisher` es invocada
- **THEN** `expected_handlers = 4` (los mismos 4 handlers se invocan siempre)
- **AND** `fnEnviarFacturaElectronica` MUST ser invocada y retornar `skip: true` internamente
- **AND** MUST NOT crearse ningún registro en `facturas_electronicas`

#### Scenario 6: TRANSACCION_ANULADA despacha 3 handlers (sin factura electrónica)

- **GIVEN** existe 1 evento con `tipo_evento = 'TRANSACCION_ANULADA'` y `estado_evento = 'PENDIENTE'`
- **WHEN** `fnSagaEventPublisher` es invocada por EventBridge
- **THEN** el evento MUST actualizarse a `estado_evento = 'PROCESANDO'` con `expected_handlers = 3`
- **AND** MUST invocarse: `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad`
- **AND** `fnEnviarFacturaElectronica` MUST NOT ser invocada

---

### Requirement R7 — Best-effort: fallo de un handler no detiene los demás

#### Scenario 7: Handler fallido no interrumpe los restantes

- **GIVEN** un evento `TRANSACCION_APROBADA` con 4 handlers a despachar
- **AND** la invocación de `fnActualizarInventario` falla con error de Lambda
- **WHEN** `fnSagaEventPublisher` procesa el evento
- **THEN** `fnActualizarCartera`, `fnActualizarContabilidad` y `fnEnviarFacturaElectronica` MUST ser invocadas igualmente
- **AND** el error del handler fallido MUST registrarse en logs/métricas sin detener el flujo

---

### Requirement R8 — Idempotencia de despacho con SKIP LOCKED

#### Scenario 8: Dos invocaciones concurrentes no procesan el mismo evento

- **GIVEN** dos invocaciones simultáneas de `fnSagaEventPublisher` con el mismo evento pendiente
- **WHEN** ambas ejecutan la query `SELECT ... FOR UPDATE SKIP LOCKED`
- **THEN** solo una instancia MUST obtener el lock y procesar el evento
- **AND** la segunda instancia MUST ignorar el evento (SKIP) sin error

---

### Requirements R9 y R10 — Factura Electrónica DIAN

#### Scenario 9a: Generación de factura para transacción con factura_electronica = true (modo producción/simulación)

- **GIVEN** `fnEnviarFacturaElectronica` recibe un evento SAGA con `tipo_transaccion.factura_electronica = true`
- **AND** NO existe registro previo `COMPLETADO` en `saga_ejecuciones` para `(id_evento, 'fnEnviarFacturaElectronica')`
- **AND** `DIAN_SANDBOX_ENABLED = false` y `DIAN_PRODUCTION_ENABLED = false` (modo simulación)
- **WHEN** el handler procesa el evento
- **THEN** MUST generarse un CUFE usando SHA-384 con los datos de la transacción
- **AND** MUST construirse un XML UBL 2.1 válido
- **AND** MUST persistirse un registro en `facturas_electronicas` con `estado_dian = 'PENDIENTE'`
- **AND** el handler MUST retornar HTTP 200 con `success: true`

#### Scenario 9b: Generación de factura en modo sandbox DIAN

- **GIVEN** `fnEnviarFacturaElectronica` recibe un evento con `tipo_transaccion.factura_electronica = true`
- **AND** `DIAN_SANDBOX_ENABLED = true`
- **WHEN** el handler procesa el evento
- **THEN** MUST generarse CUFE y XML UBL 2.1
- **AND** MUST persistirse un registro en `facturas_electronicas` con `estado_dian = 'ENVIADO'`
- **AND** el handler MUST retornar HTTP 200 con `success: true`

#### Scenario 10: Skip silencioso para transacciones sin factura electrónica

- **GIVEN** `fnEnviarFacturaElectronica` recibe un evento con `tipo_transaccion.factura_electronica = false`
- **WHEN** el handler procesa el evento
- **THEN** MUST retornar HTTP 200 con `skip: true`
- **AND** NO MUST crearse ningún registro en `facturas_electronicas`

---

### Requirement R11 — Idempotencia de fnEnviarFacturaElectronica

#### Scenario 11: Segunda invocación con mismo id_evento retorna idempotente

- **GIVEN** existe registro `COMPLETADO` en `saga_ejecuciones` para `(id_evento = E1, lambda = 'fnEnviarFacturaElectronica')`
- **WHEN** `fnEnviarFacturaElectronica` es invocada nuevamente con `id_evento = E1`
- **THEN** MUST retornar HTTP 200 con `idempotente: true`
- **AND** MUST NOT generarse un nuevo CUFE ni un nuevo registro en `facturas_electronicas`

---

### Requirement R12 — Registro de ejecuciones en saga_ejecuciones

#### Scenario 12: Handler exitoso registra COMPLETADO

- **GIVEN** `fnActualizarInventario` procesa exitosamente un evento SAGA
- **WHEN** la ejecución finaliza
- **THEN** MUST existir un registro en `saga_ejecuciones` con `estado_ejecucion = 'COMPLETADO'` y `output_data->>'lambda' = 'fnActualizarInventario'`

#### Scenario 13: Handler fallido registra FALLIDO

- **GIVEN** `fnActualizarContabilidad` falla durante el procesamiento de un evento
- **WHEN** la ejecución finaliza con error
- **THEN** MUST existir un registro en `saga_ejecuciones` con `estado_ejecucion = 'FALLIDO'` para ese evento y handler

---

### Requirement R13 — Extracción de tenant_id

#### Scenario 14: Invocación directa desde fnSagaEventPublisher (sin requestContext)

- **GIVEN** `fnActualizarInventario` recibe un payload de invocación directa sin `requestContext.authorizer`
- **AND** el payload contiene `tenant_id` en el body del evento
- **WHEN** el handler extrae el tenant
- **THEN** MUST usar `tenant_id` del body del evento (prioridad 4 del patrón `extractTenantId`)
- **AND** MUST filtrar todos los queries de BD por ese `tenant_id`

#### Scenario 15: Invocación via API Gateway con JWT

- **GIVEN** `fnSagaTransaccion` recibe una request HTTP con `Authorization: Bearer <JWT>` conteniendo `custom:tenant_id = T1`
- **WHEN** se procesa la request
- **THEN** MUST extraerse `tenant_id = T1` desde el claim JWT (prioridad 1)
- **AND** MUST NOT usarse ningún valor de `tenant_id` del body o query params de la request

---

### Transiciones de estado inválidas

#### Scenario 16: Transición de estado inválida es rechazada

- **GIVEN** una transacción con `estado = 'ANULADO'`
- **WHEN** se llama `changeStatus` con `nuevoEstado = 'APROBADO'` (retrograde inválido)
- **THEN** la operación MUST ser rechazada con HTTP 400 o 422
- **AND** el estado de la transacción MUST permanecer `'ANULADO'` (sin cambios)
- **AND** MUST NOT crearse ningún evento en `saga_eventos`

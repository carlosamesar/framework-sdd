---
id: "8.1"
module: "SAGA"
change: "saga-lambda-certification"
title: "SAGA Lambdas — Certificación Funcional: Aprobación, Anulación y Factura Electrónica"
status: "DRAFT"
author: "OpenCode"
created: "2026-04-08"
updated: "2026-04-08"
scope: "lib/lambda/saga"
complexity: "2"
---

# Proposal: SAGA Lambda Certification

## Intent

Certificar el comportamiento funcional del flujo SAGA implementado en las Lambdas de
`lib/lambda/saga/` del proyecto `gooderp-orchestation`. El análisis del código real reveló que
los 3 GAPs documentados en `ANALISIS-SAGA-GAPS.md` ya están cerrados; este change formaliza
las especificaciones verificables que permiten validar y mantener ese comportamiento.

## Scope

Lambdas en `lib/lambda/saga/` — NO el microservicio NestJS `servicio-saga`.

- `fnSagaTransaccion` — cambio de estado y creación de eventos SAGA
- `fnSagaEventPublisher` — despacho de handlers por tipo de evento (EventBridge trigger)
- `fnEnviarFacturaElectronica` — generación CUFE + XML UBL 2.1 + registro DIAN
- `fnActualizarInventario`, `fnActualizarCartera`, `fnActualizarContabilidad` — handlers compensadores

## Out of Scope

- `servicio-saga` (NestJS) — cubierto por `saga-nestjs-certification`
- Firma digital del certificado DIAN (TODO en `enviarDocumentoDIAN()`)
- Integración BPMN/Camunda (fase posterior)

## Key Findings from Code Analysis

| GAP | Estado en código | Decisión de diseño |
|-----|-----------------|-------------------|
| GAP #1: `TRANSACCION_ANULADA` sin handlers | ✅ CERRADO | 3 handlers (sin `fnEnviarFacturaElectronica` por diseño DIAN) |
| GAP #2: `fnEnviarFacturaElectronica` sin integrar | ✅ CERRADO | Lambda de 600 líneas, CUFE SHA-384, XML UBL 2.1 |
| GAP #3: `fnEnviarFacturaElectronica` no en `APROBADA` | ✅ CERRADO | Incluida en `EVENT_LAMBDA_HANDLERS['TRANSACCION_APROBADA']` |

## Affected Areas

- `lib/lambda/saga/fnSagaTransaccion/handlers/changeStatus.mjs`
- `lib/lambda/saga/fnSagaEventPublisher/index.mjs`
- `lib/lambda/saga/fnEnviarFacturaElectronica/index.mjs`
- PostgreSQL tables: `saga_eventos`, `saga_ejecuciones`, `facturas_electronicas`

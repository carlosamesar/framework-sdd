---
id: "7.2.1"
module: "SAGA"
change: "saga-inventario-integration-fix"
title: "SAGA — Orquestador publica eventos al cambiar estado de transacción"
status: "DRAFT"
author: "OpenCode"
created: "2026-04-10"
updated: "2026-04-10"
implements:
  - "lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs"
  - "lib/lambda/saga/fnSagaTransaccion/utils/sagaEventCreator.mjs"
---

# Delta for SAGA — Orquestador + Configuración

## ADDED Requirements

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

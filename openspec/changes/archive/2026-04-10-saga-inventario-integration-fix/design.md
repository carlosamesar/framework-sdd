# Design: SAGA Inventario Integration Fix

**Change**: saga-inventario-integration-fix | **Fecha**: 2026-04-10

## Technical Approach

Integrar `createSagaEventsFromConfig` directamente en `cambiarEstado.mjs` usando el `client` de la transacción activa, para que los eventos SAGA se creen de forma atómica con el cambio de estado. Si falla la creación del evento SAGA, el cambio de estado **se preserva** (no rollback) y se retorna un campo `sagaWarning` en la respuesta.

## Architecture Decisions

| Decisión | Opción elegida | Alternativas rechazadas | Rationale |
|----------|----------------|-------------------------|-----------|
| Dónde crear eventos SAGA | Inline en `cambiarEstado.mjs` usando el client de la TX activa | Invocar `fnSagaTransaccion` como Lambda separada | Evita doble roundtrip de red; usa la misma transacción BD; patrón ya existe en `fnSagaTransaccion/handlers/changeStatus.mjs` |
| Fallo SAGA vs fallo de negocio | SAGA falla silenciosamente (sagaWarning), estado persiste | SAGA falla → rollback total | El cambio de estado es operación de negocio válida; SAGA es efecto secundario eventual |
| Import path de sagaEventCreator | Ruta relativa `../../../saga/fnSagaTransaccion/utils/sagaEventCreator.mjs` | Duplicar código | DRY; el creador ya existe y está probado |
| Seed de configuración | SQL con `INSERT ON CONFLICT DO NOTHING` | Migración TypeORM | Lambdas son Node.js puro sin ORM; seed script es la convención del proyecto |

## Data Flow

```
API Gateway → fnOrquestadorTransaccionUnificada
  └─ cambiarEstado(transaccionId, idEstado, tenantId, userId, tm)
       │
       ├─ [1] SELECT transaccion (verifica existencia + tenant)
       ├─ [2] SELECT estado_destino
       ├─ [3] Validar transición en TRANSICIONES_PERMITIDAS
       ├─ [4] UPDATE transacciones SET id_estado = $1
       ├─ [5] INSERT transaccion_estado (auditoría)
       │
       ├─ [6] mapEstadoToSagaEventType(estadoDestinoNombre)
       │       ├─ APROBADO/APROBADA → 'TRANSACCION_APROBADA'
       │       ├─ ANULADO/ANULADA   → 'TRANSACCION_ANULADA'
       │       └─ otros             → null (skip)
       │
       ├─ [7] IF tipoEvento != null:
       │       createSagaEventsFromConfig(client, tenantId, transaccionId,
       │                                  idTipoTransaccion, estadoMapeado)
       │         └─ SELECT saga_event_configuration WHERE tenant+tipo+trigger
       │         └─ INSERT saga_eventos (estado='PENDIENTE') por cada config
       │
       └─ [8] return success({ ..., sagaEventsCreated: N })
                        OR success({ ..., sagaWarning: 'No SAGA config found' })

[Async, 1 min después]
fnSagaEventPublisher (EventBridge) → poll saga_eventos PENDIENTE
  └─ InvokeCommand fnActualizarInventario (Event, async)
       └─ INSERT movimientos_inventario (creado_por='SISTEMA_SAGA')
       └─ UPDATE inventario SET cantidad_disponible
       └─ INSERT saga_ejecuciones (COMPLETADO/FALLIDO)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs` | Modify | Añadir paso 6-7: publicar evento SAGA post-cambio de estado |
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.test.mjs` | Modify | Añadir tests para escenarios SAGA (con y sin config, fallo silencioso) |
| `lib/lambda/saga/fnActualizarInventario/index.mjs` | Modify | Extender `TIPO_MOVIMIENTO_MAP` con NC-VTA, ND-COMP + logging estructurado en catch |
| `lib/lambda/saga/fnSagaEventPublisher/index.mjs` | Modify | Logging estructurado en `invocarLambdaHandlers` failures |
| `lib/lambda/saga/seeds/saga_event_configuration.sql` | Create | Seed datos base para 4 tipos de transacción |

## Interfaces / Contracts

### cambiarEstado — respuesta extendida

```js
// Éxito con SAGA
{ statusCode: 200, body: { success: true, data: {
  id_transaccion, estado_anterior, estado_nuevo,
  sagaEventsCreated: 1   // número de eventos creados
}}}

// Éxito sin config SAGA (warning no-bloqueante)
{ statusCode: 200, body: { success: true, data: {
  id_transaccion, estado_anterior, estado_nuevo,
  sagaWarning: 'No SAGA configuration found for ...'
}}}

// Éxito con fallo SAGA (non-fatal)
{ statusCode: 200, body: { success: true, data: {
  id_transaccion, estado_anterior, estado_nuevo,
  sagaWarning: 'SAGA event creation failed: <message>'
}}}
```

### TIPO_MOVIMIENTO_MAP extendido (fnActualizarInventario)

```js
const TIPO_MOVIMIENTO_MAP = {
  'COM': 'ENTRADA', 'VEN': 'SALIDA',
  'FACT-VTA': 'SALIDA', 'FACT-COMP': 'ENTRADA',
  'NC-VTA': 'ENTRADA',   // Nota Crédito Venta → devuelve stock
  'ND-COMP': 'SALIDA',   // Nota Débito Compra → reduce stock
  'NC-COMP': 'SALIDA',   // Nota Crédito Compra → reduce stock
  'ND-VTA': 'SALIDA',    // Nota Débito Venta → reduce stock adicional
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `cambiarEstado` con SAGA habilitado | Mock `createSagaEventsFromConfig`, verificar que se llama con args correctos |
| Unit | `cambiarEstado` con SAGA fallo silencioso | Mock que lanza excepción → verificar `sagaWarning` en respuesta y `statusCode=200` |
| Unit | `cambiarEstado` sin config SAGA (0 eventos) | Mock que retorna `[]` → verificar `sagaWarning` |
| Unit | `fnActualizarInventario` tipo no mapeado | Retorna FALLIDO estructurado, no excepción |
| Unit | `fnActualizarInventario` NC-VTA aplica ENTRADA | cantidad_disponible += N |

## Migration / Rollout

1. Ejecutar seed `saga_event_configuration.sql` en staging antes del deploy
2. Deploy de lambdas: `fnOrquestadorTransaccionUnificada` → `fnActualizarInventario` → `fnSagaEventPublisher`
3. Verificar en staging: cambiar estado de una transacción VEN a APROBADA → observar `saga_eventos`
4. Si hay problema: el campo `sagaWarning` confirma que SAGA no está funcionando pero el estado sí cambió

## Open Questions

- [ ] ¿`idTipoTransaccion` está disponible en el contexto de `cambiarEstado`? (Necesita JOIN adicional o se pasa como param) → Investigar en `index.mjs`

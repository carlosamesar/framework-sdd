# Proposal: SAGA Inventario Integration Fix

**Complejidad**: 2 (Standard) | **Fecha**: 2026-04-10 | **Estado**: DRAFT

## Intent

El orquestador de transacciones (`fnOrquestadorTransaccionUnificada`) **no publica eventos SAGA** al cambiar estado, rompiendo la cadena de actualización de inventario. Además, la tabla `saga_event_configuration` puede estar vacía para ciertos tipos de transacción, dejando el inventario sin actualizar silenciosamente.

Este cambio cierra los 4 gaps críticos identificados en `lib/lambda/saga/ANALISIS-SAGA-GAPS.md`.

## Scope

### In Scope
- Integrar llamada a SAGA en `fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs`
- Seed de `saga_event_configuration` para tipos: `COM`, `VEN`, `FACT-VTA`, `FACT-COMP`
- Mejorar observabilidad: logging estructurado en `fnSagaEventPublisher` y `fnActualizarInventario`
- Extender `TIPO_MOVIMIENTO_MAP` para cubrir todos los tipos de transacción relevantes

### Out of Scope
- Migrar `fnAjusteInventario`, `fnTrasladoInventario`, `fnEntradaInventario`, `fnSalidaInventario` al patrón SAGA (cambio separado)
- Cambiar `InvocationType: 'Event'` a síncrono (decisión de arquitectura diferida)
- Frontend / UI de monitoreo SAGA

## Approach

1. **Patch `cambiarEstado.mjs`**: Después del `UPDATE transacciones`, invocar `fnSagaTransaccion` vía `InvokeCommand` (o directamente llamar `createSagaEventsFromConfig`) para publicar el evento SAGA correspondiente al nuevo estado.
2. **Seed script**: Crear `lib/lambda/saga/seeds/saga_event_configuration.sql` con registros para los 4 tipos de transacción + estados relevantes (`APROBADO`, `CONFIRMADO`).
3. **Logging estructurado**: Añadir `console.error` con contexto (`evento_id`, `handler`, `error`) en paths silenciosos.
4. **Ampliar `TIPO_MOVIMIENTO_MAP`**: Añadir mappings faltantes (ej. `NC-VTA`, `ND-COMP`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/handlers/cambiarEstado.mjs` | Modified | Publicar evento SAGA post-cambio de estado |
| `lib/lambda/saga/fnActualizarInventario/index.mjs` | Modified | Ampliar TIPO_MOVIMIENTO_MAP + logging |
| `lib/lambda/saga/fnSagaEventPublisher/index.mjs` | Modified | Logging estructurado en failures |
| `lib/lambda/saga/seeds/saga_event_configuration.sql` | New | Seed datos de configuración SAGA |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Doble-escritura si ya existe otro path que llame SAGA | Med | Validar con `SELECT` previo en `saga_eventos` por `(entidad_id, trigger_status)` |
| Seed rompe configuración existente para otros tenants | Low | Usar `INSERT ... ON CONFLICT DO NOTHING` |
| Latencia agregada en `cambiarEstado` por invoke SAGA | Low | SAGA sigue siendo async (`InvocationType: 'Event'`) |

## Rollback Plan

1. Revertir `cambiarEstado.mjs` al commit anterior (git revert)
2. Truncar registros del seed: `DELETE FROM saga_event_configuration WHERE creado_por = 'SEED_V1'`
3. Los `saga_eventos` ya creados se pueden desactivar con `UPDATE saga_eventos SET estado = 'CANCELADO'`

## Dependencies

- Acceso a BD para ejecutar seed (entorno de staging/prod)
- `fnSagaTransaccion` desplegada y funcional (ya verificado)

## Success Criteria

- [ ] `cambiarEstado` con estado `APROBADO` → registro en `saga_eventos` (estado `PENDIENTE`)
- [ ] Dentro de 2 min: `movimientos_inventario` tiene registro con `creado_por = 'SISTEMA_SAGA'`
- [ ] `inventario.cantidad_disponible` refleja el cambio correctamente
- [ ] `saga_ejecuciones` muestra estado `COMPLETADO` (no `PROCESANDO` indefinido)
- [ ] Tests unitarios cubren el nuevo path en `cambiarEstado.mjs` (≥85% coverage)

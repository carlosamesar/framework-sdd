# EVIDENCE — parqueaderos-cerrar-caja-fix

**Archivado**: 2026-04-14  
**Estado final**: DONE — todos los tasks completados y desplegados en producción

---

## Tasks completados

| Task | Descripción | Estado |
|------|-------------|--------|
| T1 | Fix URL cerrarCaja: `POST /caja/${id}/cerrar` → `POST /caja/cerrar` con body `{ idCajaTurno }` | ✅ |
| T2 | Cargar parqueadero real en control-caja.component.ts (eliminar UUID hardcodeado) | ✅ |
| T3 | Eliminar validación de operador exclusivo en cerrar-caja-diaria.handler.ts | ✅ |

## Bug adicional resuelto (no en spec original)

**Transacciones duplicadas en caja**: el handler `registrar-salida-vehiculo.handler.ts` registraba automáticamente una transacción en `transacciones_caja` además del registro que hace el frontend. Eliminado el bloque duplicado (líneas 128-146 del handler).

## Versiones desplegadas en producción

| Versión | Cambios |
|---------|---------|
| v19 | T1 — Fix URL cerrar caja |
| v20 | T3 — Eliminar validación operador |
| v21 | Caja activa: `montoTotal` en tiempo real (montoApertura + SUM transacciones) |
| v22 | Bug fix: eliminar registro automático de transacción en handler de salida |

## Archivos modificados

### Backend
- `servicio-parqueaderos/src/application/commands/registrar-salida-vehiculo.handler.ts` — eliminado registro automático de caja (v22)
- `servicio-parqueaderos/src/application/commands/cerrar-caja-diaria.handler.ts` — eliminada validación de operador exclusivo (T3)
- `servicio-parqueaderos/src/presentation/controllers/caja.controller.ts` — enriquece `montoTotal` en tiempo real para cajas ABIERTA (v21)

### Frontend
- `gooderp-client/src/app/features/parqueaderos/services/api/caja-api.service.ts` — URL fix (T1)
- `gooderp-client/src/app/features/parqueaderos/components/smart/control-caja/control-caja.component.ts` — `idParqueadero` real del tenant (T2)

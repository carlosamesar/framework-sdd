# Tasks: parqueaderos-cerrar-caja-fix

**Fecha**: 2026-04-14  
**Nivel**: 1 (Micro)

---

## Tasks de implementación

### T1 — Fix URL de cerrarCaja en caja-api.service.ts [CRÍTICO]
**Archivo**: `develop/frontend/gooderp-client/src/app/features/parqueaderos/services/api/caja-api.service.ts`  
**Cambio**: Reemplazar `POST /caja/${idCaja}/cerrar` → `POST /caja/cerrar` con body `{ idCajaTurno: idCaja }`  
**Por qué**: El backend expone `POST /caja/cerrar` (sin id en path), no `POST /caja/:id/cerrar`

### T2 — Cargar parqueadero real en control-caja.component.ts [BLOQUEANTE para producción]
**Archivo**: `develop/frontend/gooderp-client/src/app/features/parqueaderos/components/smart/control-caja/control-caja.component.ts`  
**Cambio**: 
- Inyectar `ParqueaderoApiService`
- En `ngOnInit`, cargar la lista de parqueaderos y usar `parqueaderos[0].id` como `idParqueadero`
- Reemplazar el UUID ficticio hardcodeado

### T3 — Quitar validación de operador exclusivo en cerrar-caja-diaria.handler.ts [Backend]
**Archivo**: `develop/backend/gooderp-orchestation/servicio-parqueaderos/src/application/commands/cerrar-caja-diaria.handler.ts`  
**Cambio**: Eliminar el bloque `if (caja.idUsuarioOperador !== command.userId)` (líneas 35-37)  
**Por qué**: La restricción impide que administradores cierren cajas. Los roles ya se validan en el controlador.

---

## Orden de ejecución

T1 → T3 → T2 (T1 es el crítico, T3 no depende de nada, T2 es el más complejo)

## Archivos a modificar (3 total)

1. `develop/frontend/gooderp-client/src/app/features/parqueaderos/services/api/caja-api.service.ts`
2. `develop/frontend/gooderp-client/src/app/features/parqueaderos/components/smart/control-caja/control-caja.component.ts`
3. `develop/backend/gooderp-orchestation/servicio-parqueaderos/src/application/commands/cerrar-caja-diaria.handler.ts`

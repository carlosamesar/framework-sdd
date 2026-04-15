# Proposal: parqueaderos-cerrar-caja-fix

**Fecha**: 2026-04-14  
**Nivel SDD**: 1 (Micro) — 3 archivos, < 2h  
**Estado**: Propuesta

---

## Intent

El botón "Cerrar caja" en el módulo de parqueaderos no funciona. El usuario presiona el botón pero la caja no se cierra.

## Root Cause Analysis (3 problemas identificados)

### Problema 1 — Mismatch crítico de URL (BLOQUEANTE)
- **Frontend** (`caja-api.service.ts`): llama `POST /caja/{id}/cerrar`
- **Backend** (`caja.controller.ts`): expone `POST /caja/cerrar` con `idCajaTurno` en el body
- **Resultado**: 404 Not Found en cada intento de cerrar caja

### Problema 2 — Validación de operador restrictiva
- El handler `cerrar-caja-diaria.handler.ts` valida `caja.idUsuarioOperador !== command.userId`
- Si el administrador quiere cerrar la caja de un operador, la operación es rechazada
- El `userId` llega del JWT — si el operador que abrió ≠ usuario que cierra, error

### Problema 3 — `idParqueadero` hardcodeado en el componente
- `control-caja.component.ts` tiene `private readonly idParqueadero = 'aaaaaaaa-1111-1111-1111-111111111111'`
- Esto es un placeholder de desarrollo que nunca fue reemplazado
- **Impacto**: al abrir/cargar historial, siempre usa un UUID ficticio, nunca el parqueadero real del usuario

## Scope

### Archivos afectados

**Frontend (2 archivos):**
- `src/app/features/parqueaderos/services/api/caja-api.service.ts`
  - Fix: cambiar URL de `POST /caja/{id}/cerrar` → `POST /caja/cerrar` con body `{ idCajaTurno: id }`
- `src/app/features/parqueaderos/components/smart/control-caja/control-caja.component.ts`
  - Fix: reemplazar `idParqueadero` hardcodeado por la referencia al parqueadero real del usuario
  - Para MVP: obtener el primer parqueadero disponible desde el API de parqueaderos o desde el facade del dashboard

**Backend (1 archivo):**
- `src/application/commands/cerrar-caja-diaria.handler.ts`
  - Fix: hacer la validación de operador opcional/flexible — permitir que administradores cierren cajas de operadores

## Approach

### Fix 1 — URL mismatch (CRÍTICO)
Alinear el frontend al contrato del backend:
```typescript
// ANTES (incorrecto):
this.http.post(`${this.baseUrl}/${idCaja}/cerrar`, {})

// DESPUÉS (correcto):
this.http.post(`${this.baseUrl}/cerrar`, { idCajaTurno: idCaja })
```

### Fix 2 — Validación de operador
Quitar la restricción de operador en el handler: permitir que cualquier usuario autenticado del tenant cierre la caja (la autorización de roles ya está en el controlador con `@Roles('operador', 'administrador')`).

### Fix 3 — idParqueadero real
Agregar al componente la inyección del `ParqueaderoApiService` para obtener el primer parqueadero del tenant, o usar el parqueadero seleccionado del estado de la aplicación.

**Decisión MVP**: inyectar `ParqueaderoApiService`, cargar los parqueaderos en `ngOnInit` y usar el primero disponible. Si no hay parqueaderos, mostrar mensaje de error.

## Out of Scope

- UI para seleccionar qué parqueadero gestionar (pantalla de selección)
- Resumen visual del cierre (totales, transacciones)
- Tests automatizados (el proyecto no tiene suite de tests para frontend Angular activa)

## Riesgos

- Fix 3 asume que el usuario tiene exactamente 1 parqueadero o usa el primero. Si tiene varios, necesitará una pantalla de selección (fuera de scope).
- La eliminación de la validación de operador en Fix 2 es un cambio de política de negocio — se documenta explícitamente.

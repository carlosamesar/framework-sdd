# Proposal: Functional Test Coverage for fnAjusteInventario

## Intent

La lambda `fnAjusteInventario` carece de pruebas funcionales end-to-end. Aunque existen tests unitarios para `errors.mjs` y `sanitization.mjs`, no hay validación real de los handlers contra la BD ni del routing completo del `index.mjs`. Este cambio cierra esa brecha ejecutando todos los escenarios del router con un JWT real y generando evidencia trazable (`CONSUMO.md`).

## Scope

### In Scope
- Script de pruebas funcionales `tests/functional.test.mjs` que invoca el handler local con eventos tipo API Gateway
- Cobertura de los 7 escenarios del router: POST (create), GET list, GET by id, PUT→501, DELETE→501, OPTIONS (CORS), método inválido→405
- Extracción de `tenant_id` desde `requestContext.authorizer.claims` (JWT real)
- Reporte `CONSUMO.md` con input/output/status de cada escenario

### Out of Scope
- Cambios al código de producción de `fnAjusteInventario`
- Tests de carga o performance
- Despliegue de nueva versión de la lambda
- Tests de otros handlers de inventario

## Approach

Crear un único script Jest (`functional.test.mjs`) que simule eventos API Gateway con JWT real en `requestContext.authorizer.claims['custom:tenant_id']`. Cada test invoca directamente `handler(event)` del `index.mjs` local, contra la BD real (usando las mismas variables de entorno de la lambda). Al finalizar, generar `CONSUMO.md` desde los resultados capturados.

**Complejidad**: Nivel 1 — Micro (1-3 archivos nuevos, sin cambios de producción)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnAjusteInventario/tests/functional.test.mjs` | New | Script de pruebas funcionales con 7 escenarios |
| `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnAjusteInventario/CONSUMO.md` | New | Reporte de evidencia con resultados reales |
| `develop/backend/gooderp-orchestation/lib/lambda/inventario/fnAjusteInventario/` | Read-only | No se modifica código de producción |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| JWT expirado al momento de ejecutar | Med | El usuario provee token fresco; documentar pasos de renovación en `CONSUMO.md` |
| Datos creados por POST contaminan la BD | Low | Usar `observacion` con prefijo `[TEST]` para identificar y limpiar fácilmente |
| Timeout de conexión a BD desde entorno local | Low | Verificar variables de entorno antes de ejecutar; tests incluyen mensaje de error claro |

## Rollback Plan

No se modifica código de producción. Si los archivos nuevos causan problemas:
1. Eliminar `tests/functional.test.mjs` y `CONSUMO.md`
2. El estado de la lambda queda idéntico al previo

## Dependencies

- Variables de entorno de la lambda configuradas localmente (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- JWT válido con claim `custom:tenant_id` (User Pool `us-east-1_fQl9BKSxq`)

## Success Criteria

- [ ] Los 7 escenarios del router ejecutan sin errores de runtime
- [ ] POST devuelve 201 con el recurso creado
- [ ] GET list devuelve 200 con array (puede estar vacío)
- [ ] GET by id devuelve 200 o 404 (según si el ID existe)
- [ ] PUT y DELETE devuelven 501 NOT_IMPLEMENTED
- [ ] OPTIONS devuelve 200 con headers CORS
- [ ] Método inválido (PATCH) devuelve 405 METHOD_NOT_ALLOWED
- [ ] `CONSUMO.md` generado con input/output real de cada escenario

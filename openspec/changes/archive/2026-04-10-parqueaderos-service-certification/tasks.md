# Tasks: servicio-parqueaderos — Certificación Funcional

**Change**: `parqueaderos-service-certification`
**Total**: 7 tareas | **Completadas**: 7/7 ✅

---

## Fase 1 — Auditoría y Corrección

- [x] **1.1** Auditar código fuente — identificar bugs, stubs e inconsistencias
- [x] **1.2** Corregir SnakeNamingStrategy, CORS, stubs en handlers
- [x] **1.3** Corregir bug `fechaFin` en `obtener-visibilidad-operacion.handler.ts` (TypeORM `date` → string)
- [x] **1.4** Agregar `app.setGlobalPrefix('api')` en `main.ts`

## Fase 2 — Tests

- [x] **2.1** Escribir y pasar 6 tests unitarios (TDD: RED → GREEN → REFACTOR)
  - `parqueadero.service.spec.ts`
  - `caja.service.spec.ts`
  - `mensualidades.service.spec.ts`
  - `tarifa.service.spec.ts`
  - `movimiento.service.spec.ts`
  - `obtener-visibilidad-operacion.handler.spec.ts`

## Fase 3 — Infraestructura y Deploy

- [x] **3.1** Build imagen Docker single-arch v8 (`DOCKER_BUILDKIT=0 --platform linux/amd64`)
- [x] **3.2** Push a ECR `068858795558.dkr.ecr.us-east-1.amazonaws.com/parqueaderos-service:v8`
- [x] **3.3** Actualizar Lambda `parqueaderos-service` a imagen v8
- [x] **3.4** Fix routing API Gateway: eliminar `/api/{proxy+}`, usar `/{proxy+}` en raíz

## Fase 4 — Verificación y Documentación

- [x] **4.1** Verificar 18 endpoints en producción (API Gateway `kbbjapuhzj`)
- [x] **4.2** Crear `CONSUMO.md` con documentación de todos los endpoints
- [x] **4.3** Crear `CERTIFICACION-FUNCIONAL.md` con evidencias y tabla resumen

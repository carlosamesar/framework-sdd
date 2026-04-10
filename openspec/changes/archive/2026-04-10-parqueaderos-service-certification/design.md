# Design: servicio-parqueaderos — Certificación Funcional

**Change**: `parqueaderos-service-certification`
**Fecha**: 2026-04-10
**Estado**: ✅ DONE

---

## Arquitectura

```
API Gateway kbbjapuhzj
  └── /{proxy+} (autorizador ptly4p — Cognito us-east-1_gmre5QtIx)
        └── Lambda parqueaderos-service
              └── @vendia/serverless-express
                    └── NestJS 11 App
                          ├── ParqueaderoModule
                          ├── MovimientoModule
                          ├── TarifaModule
                          ├── CajaModule
                          └── MensualidadModule
```

## Decisiones Clave

### 1. Routing: `/{proxy+}` en raíz (no `/api/{proxy+}`)
- **Problema**: Tener el recurso `/api` con `{proxy+}` hacía que el path enviado a Lambda fuera solo `parqueaderos/uuid` — NestJS no encontraba la ruta.
- **Solución**: Eliminar recurso `/api`. Con `/{proxy+}` en raíz, `proxy = api/parqueaderos/uuid` → NestJS recibe `/api/parqueaderos/uuid` ✅

### 2. Docker single-arch (`DOCKER_BUILDKIT=0`)
- **Problema**: `docker buildx` genera manifest list → Lambda rechaza con `InvalidParameterValueException: image manifest not supported`.
- **Solución**: `DOCKER_BUILDKIT=0 docker build --platform linux/amd64`

### 3. Bug fechaFin TypeORM `date` → string
- **Archivo**: `src/application/queries/obtener-visibilidad-operacion.handler.ts`
- **Causa**: `type: 'date'` en PostgreSQL retorna `string` vía TypeORM. `.getTime()` fallaba con `NaN`.
- **Fix**:
  ```typescript
  const fechaFin = m.fechaFin instanceof Date ? m.fechaFin : new Date(m.fechaFin as any);
  ```

### 4. Multi-tenant
- `JwtTenantGuard` como `APP_GUARD` global en `AppModule`
- `@TenantId()` en todos los controllers
- `tenant_id` NUNCA desde body ni params — siempre desde JWT claim `custom:tenant_id`

### 5. Cognito User Pool
- NestJS: `us-east-1_gmre5QtIx` (NO usar `us-east-1_fQl9BKSxq` — ese es para Lambdas)

## Imagen Docker

| Versión | Digest | Estado |
|---------|--------|--------|
| v8 | `sha256:bddcfea9751b6d59fe1d3bbce0288243b3e8e17db42890e0d5d208a6c4ad7d57` | ✅ ACTIVA en Lambda |

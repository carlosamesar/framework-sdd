# Proposal: servicio-parqueaderos — Certificación Funcional

**Change**: `parqueaderos-service-certification`
**Fecha**: 2026-04-10
**Complejidad**: Nivel 2 (Standard) — microservicio multi-módulo NestJS → Lambda Container
**Estado**: ✅ DONE

---

## Intent

Implementar, desplegar y certificar el microservicio `servicio-parqueaderos` como Lambda Container en AWS, verificando el funcionamiento completo de los 18 endpoints del dominio de parqueaderos (gestión de parqueaderos, movimientos de vehículos, tarifas, caja y mensualidades).

## Problema

El microservicio `servicio-parqueaderos` existía en el código pero no estaba desplegado ni certificado. Contenía:
- Inconsistencias en naming strategy (SnakeNamingStrategy faltante)
- CORS no configurado
- Stubs sin implementar en algunos handlers
- Bug en cálculo de `diasRestantes` (TypeORM `date` retorna `string`, no `Date`)
- Imagen Docker construida con BuildKit generaba manifest list incompatible con Lambda

## Scope

**Módulos afectados:**
- `develop/backend/gooderp-orchestation/servicio-parqueaderos/` — servicio completo
- AWS Lambda `parqueaderos-service` — deploy imagen v8
- API Gateway `kbbjapuhzj` — routing `/{proxy+}` → Lambda

**Fuera de scope:**
- Frontend (sin scope frontend en este change)
- Integración con SAGA (futuro)

## Approach

1. Auditoría del código fuente — identificar inconsistencias
2. Corrección de bugs y stubs
3. Tests unitarios TDD (6 servicios)
4. Build Docker single-arch (`DOCKER_BUILDKIT=0`)
5. Deploy a ECR + Lambda
6. Verificación manual de 18 endpoints
7. Documentación: `CONSUMO.md` + `CERTIFICACION-FUNCIONAL.md`

## Rollback

Revertir Lambda a imagen anterior (`v7`) via:
```bash
aws lambda update-function-code \
  --function-name parqueaderos-service \
  --image-uri 068858795558.dkr.ecr.us-east-1.amazonaws.com/parqueaderos-service:v7 \
  --region us-east-1
```

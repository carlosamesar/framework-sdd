# Cierre del spec — servicio-contabilidad-fix

**Fecha de cierre:** 2026-04-13  
**Tipo:** Bug fix + deployment  
**Repositorio:** `gooderp-orchestation`  
**Servicio:** servicio-contabilidad  

---

## Objetivo

Corregir el servicio-contable que generateba errores, hacer funcional el endpoint y actualizar la documentación API. El tenantId debe extraerse del JWT, NO recibida como parámetro.

---

## Problemas resueltos

| # | Problema | Solución |
|---|---------|----------|
| 1 | Security Group no tenía puerto 443 (HTTPS) abierto | Corregido previamente |
| 2 | HTTP server no iniciaba en ECS (bug en main.ts promise) | Corregido en task definition rev 11 |
| 3 | Entity usaba `tenant_id` pero BD tiene `id_tenant` | Corregido previamente |
| 4 | Controladores recibían tenantId via @Query/@Param/@Body | Cambiados a `@TenantId()` decorator |

---

## Controladores corregidos

- `cuenta-bancaria.controller.ts`
- `comprobante.controller.ts`
- `periodo.controller.ts`
- `reportes-contables.controller.ts`
- `libros-oficiales.controller.ts`
- `reportes-legales.controller.ts`
- `cierre-contable.controller.ts`
- `documentos.controller.ts`
- `contabilidad-ia.controller.ts`
- `formulario-dinamico.controller.ts`
- `documento-upload.controller.ts`

---

## Deployment

| Componente | Valor |
|-----------|-------|
| Task Definition | Revision 11 |
| ECR | 068858795558.dkr.ecr.us-east-1.amazonaws.com/servicio-contabilidad |
| ALB | gooderp-dev-alb-668241879.us-east-1.elb.amazonaws.com |
| Target Group | gooderp-dev-cont-tg (puerto 3003) |
| Endpoint | `https://api.thegooderp.com/api/contabilidad/cuentas-bancarias` |

---

## Documentación actualizada

- `CONSUMO.md` — Removido tenantId de query parameters en todos los endpoints

### Remociones en CONSUMO.md:

| Endpoint | Cambio |
|----------|--------|
| PUT /cuentas-bancarias/:id | Removido tenantId query param |
| DELETE /cuentas-bancarias/:id | Removido tenantId query param |
| GET /comprobantes | Removido tenantId query param |
| GET /plan-cuentas | Removido tenantId query param |
| GET /periodos | Removido tenantId query param |
| GET /reportes/libro-diario | Removido tenantId query param |
| GET /asientos | Removido tenantId query param |

También se corrigió:
- Error example (400): "Se requiere tenantId" → "Token JWT inválido o expirado"
- Sección Notas: Actualizada para indicar que tenantId se extrae del JWT

---

## Verificación

```bash
GET https://api.thegooderp.com/api/contabilidad/cuentas-bancarias
Authorization: Bearer <TOKEN_JWT>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id_cuenta_bancaria": "...",
      "nombreCuenta": "...",
      ...
    }
  ]
}
```

---

## Estado final

```
✅ SERVICIO-CONTABILIDAD — FUNCIONAL Y CERRADO
   Task Definition: Revision 11
   Endpoints: 11 controladores corregidos
   Documentación: CONSUMO.md actualizado
   Fecha: 2026-04-13
```
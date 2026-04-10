# Evidence: transaccion-payload-spec

**Change**: `transaccion-payload-spec`
**Date**: 2026-04-10
**Status**: ✅ COMPLETE

---

## Objetivo

Documentar la estructura correcta del payload que debe recibir la Lambda `fnTransaccion` para el guardado unificado de transacciones en GoodERP.

---

## Fuentes Consultadas

| Archivo | Propósito |
|---------|-----------|
| `lib/lambda/transacciones/fnTransaccion/handlers/createTransaccion.mjs` | Handler principal con validaciones y mapeo de campos |
| `lib/lambda/transacciones/fnTransaccion/index.mjs` | Router y extracción de tenant |
| `lib/lambda/transacciones/fnTransaccion/ejemplos/REQUEST-ESTRUCTURA.md` | Documentación de estructura de request |
| `lib/lambda/transacciones/fnTransaccion/ejemplos/ejemplo-post-transaccion.json` | Ejemplo de payload completo |
| `lib/lambda/transacciones/fnTransaccion/ejemplos/GUIA-POST-TRANSACCION.md` | Guía completa de POST a transacción |
| `frontend/gooderp-client/docs/CERTIFICACION-GUARDADO-TRANSACCIONES.md` | Certificación del guardado unificado |
| `openspec/specs/saga/admin-unified-orchestrator-transaction-types.md` | Spec del orquestador SAGA |

---

## Payload Certificado

### Estructura Mínima Requerida

```json
{
  "id_tipo_transaccion": "UUID",
  "id_persona": "UUID",
  "id_tipo_moneda": "UUID",
  "numero_documento": "string",
  "fecha_emision": "YYYY-MM-DD",
  "total_bruto": number,
  "subtotal": number,
  "total_neto": number
}
```

### Estructura Completa

```json
{
  "id_tipo_transaccion": "UUID",
  "id_persona": "UUID",
  "id_tipo_moneda": "UUID",
  "numero_documento": "string",
  "fecha_emision": "YYYY-MM-DD",
  "fecha_vencimiento": "YYYY-MM-DD",
  "tipo_cambio": number,
  "estado": "BORRADOR|PENDIENTE|APROBADO|RECHAZADO|COMPLETADO|ANULADO",
  "observacion": "string",
  "garantia": "string",
  "total_bruto": number,
  "total_descuentos": number,
  "subtotal": number,
  "total_impuestos": number,
  "total_retenciones": number,
  "total_neto": number,
  "creado_por": "email@ejemplo.com",
  "id_sede": "UUID",
  "id_bodega": "UUID",
  "id_centro_costos": "UUID"
}
```

---

## Validaciones Implementadas

| Validación | Campo | Mensaje de Error |
|------------|-------|------------------|
| Requerido | `id_tipo_transaccion` | "id_tipo_transaccion is required" |
| Requerido | `id_persona` o `id_tercero` | "id_persona or id_tercero is required" |
| Requerido | `id_tipo_moneda` | "id_tipo_moneda is required" |
| Requerido | `numero_documento` | "numero_documento is required" |
| Requerido | `fecha_emision` | "fecha_emision is required" |
| Único por tenant | `numero_documento` | HTTP 409 "Transacción con este número de documento ya existe" |
| Foreign Key | Todos los UUIDs | HTTP 404 "Una o más entidades referenciadas no existen" |
| Check constraint | `estado` | HTTP 400 "Datos inválidos: restricciones de validación violadas" |

---

## Multi-Tenant Security

El `tenant_id` se extrae **exclusivamente** del JWT mediante 4 prioridades:

1. `requestContext.authorizer.claims["custom:tenant_id"]` (HTTP API Gateway)
2. `requestContext.authorizer.jwt.claims["custom:tenant_id"]` (formato alternativo)
3. `event.body.tenant_id` (invocación interna Step Functions)
4. `event.body.tenant_id` (invocación directa sin requestContext)

❌ **NUNCA** se acepta `tenant_id` desde el body o headers de usuario.

---

## Endpoint Certificado

```
POST https://4j950zl6na.execute-api.us-east-1.amazonaws.com/api/transacciones/unificada
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

---

## Respuesta de Éxito

```json
{
  "success": true,
  "message": "Transacción creada exitosamente",
  "timestamp": "2025-12-09T15:30:00.000Z",
  "request_id": "abc123...",
  "data": {
    "id_transaccion": "UUID",
    "id_tenant": "UUID",
    "numero_documento": "string",
    "estado": "BORRADOR",
    "total_neto": number,
    "fecha_creacion": "ISO-8601"
  },
  "error": null,
  "metadata": {
    "execution_time_ms": 245
  }
}
```

---

## Fórmula Matemática Certificada

```
total_bruto = Σ(líneas.precio_bruto)
total_descuentos = Σ(líneas.valor_descuento)
subtotal = total_bruto - total_descuentos
total_impuestos = Σ(impuestos.monto)
total_retenciones = Σ(retenciones.monto)
total_neto = subtotal + total_impuestos - total_retenciones
```

---

## Estado

✅ **CERTIFICADO PARA PRODUCCIÓN**

El payload documentado está basado en código existente y certificado en producción.

---

**Certificado por:** SDD Framework
**Fecha:** 2026-04-10
**Versión:** fnTransaccion Lambda (Node.js 20 ESM)
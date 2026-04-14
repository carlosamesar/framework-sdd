# Cierre del spec — orquestador-consumo-documentation

**Fecha de cierre:** 2026-04-13  
**Tipo:** Documentación (no hay spec Gherkin — change de nivel 1)  
**Repositorio:** `gooderp-orchestation`  
**Archivo principal:** `lib/lambda/transacciones/fnOrquestadorTransaccionUnificada/CONSUMO.md`

---

## Objetivo

Documentar con máximo detalle y nivel de madurez todos los contratos de request/response de `fnOrquestadorTransaccionUnificada`, incluyendo la evidencia de los 54 tests que pasan al 100%, y los payloads completos de todos los métodos (POST, GET, PUT, cambiar-estado).

---

## Evidencia de calidad

| Verificación | Resultado |
|--------------|-----------|
| Suite de tests | `54/54 pass — 0 fail — 526ms` |
| Coherencia del CONSUMO.md final (3 edits encadenados) | ✅ Verificado sin duplicados ni inconsistencias |
| Campo `referencia_externa` corregido en body completo | ✅ Reemplazado por campos reales del código (`tipo_documento_externo` + `numero_documento_externo`) |
| Contratos de todos los métodos documentados | ✅ POST, GET lista, GET por ID, PUT, cambiar-estado, OPTIONS |
| Sub-ruta especial `GET /edit/{id}` | ✅ Documentada |
| Discrepancia Swagger vs código resuelta | ✅ `estado` (swagger) → `transaccion_estado` (código real) |
| Query params GET completos | ✅ `correlation_id`, `id_tipo_transaccion`, `id_persona`, `numero_documento`, `fecha_desde`, `fecha_hasta` |
| Campos de sub-entidades corregidos | ✅ `impuestos`, `retenciones`, `descuentos`, `complemento`, `lineas`, `linea_bodegas` |
| Response shapes de PUT y GET por ID | ✅ Verificados contra código fuente |

---

## Fuentes consultadas

| Archivo | Propósito |
|---------|-----------|
| `index.test.mjs` | 13 tests — routing, CORS, errores |
| `handlers/cambiarEstado.test.mjs` | 13 tests — transiciones, SAGA, multi-tenant |
| `services/orchestrator.test.mjs` | 11 tests — orden SAGA, rollback compensatorio |
| `utils/sanitization.test.mjs` | 13 tests — extractTenantId, sanitizeRequest |
| `utils/validation.test.mjs` | 17 tests — validatePayloadStructure, validateRequiredFields, validateDataTypes |
| `utils/validation.mjs` | Campos reales validados por la lambda |
| `services/orchestrator.mjs` | Orden de creación SAGA y rollback |

---

## Descubrimientos documentados en CONSUMO.md v2.0

1. **Campos del encabezado faltantes**: `id_sede`, `id_bodega`, `id_centro_costos`, `id_estado`, `observacion`, `garantia`, `tipo_cambio`, `id_transaccion` (auto-generado si se omite).
2. **Nombres correctos de sub-entidades** (el swagger anterior tenía nombres incorrectos):
   - `impuestos[n]`: `id_concepto_tributario`, `base_imponible`, `tasa_impuesto`, `monto_impuesto`
   - `retenciones[n]`: `id_tipo_impuesto`, `base_retencion`, `tasa_retencion`, `monto_retencion`
   - `descuentos[n]`: `id_tipo_descuento`, `nombre`, más `porcentaje` O `valor`
   - `lineas[n]`: campos adicionales obligatorios `monto_bruto`, `subtotal_linea`, `total_linea`
3. **Clave `transaccion_estado`**: rechaza `transaccion.estado`; usa `transaccion.transaccion_estado.id_estado`.
4. **Response shape PUT**: incluye `data.correlationId`, `data.transaccionId`, `data.transaccion`.
5. **Rollback SAGA**: compensación en orden inverso, tolerante a fallos parciales en compensación.
6. **`retenciones` siempre vacío** en response GET: tabla subyacente aún no existe.

---

## Estado final

```
✅ CONSUMO.md v2.0 — CERTIFICADO Y CERRADO
   Líneas: 941
   Métodos documentados: POST, GET, PUT, POST cambiar-estado, OPTIONS
   Tests certificados: 54/54 pass
   Fecha: 2026-04-13
```

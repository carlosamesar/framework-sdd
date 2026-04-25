# Design: Plantillas Contables SAGA

**Change**: contabilidad-saga-plantillas
**Date**: 2026-04-23

## Architecture Decisions

### AD-1: Mecanismo config dinámica vs fallback hardcoded

`fnActualizarContabilidad` tiene dos mecanismos:

1. **Config dinámica** (`tipo_transaccion_contable`) — activo cuando `tipos_transaccion.control_contable = true`.
   Busca por `id_tipo_transaccion + id_estado + id_tenant + fecha_anulacion IS NULL`, hace JOIN con `plan_cuentas`.

2. **Fallback hardcoded** (`MAPEO_TIPO_PLANTILLA`) — solo para códigos legacy como `COM001`, `VEN001`, `FACT-VTA`.

**Decisión**: Usar mecanismo 1 (config dinámica) para C1. No tocar el fallback.

### AD-2: Fix mapa tipo_asiento

El código original usaba:
```javascript
let codigoTipoAsiento = transaccion.tipo_transaccion_codigo.includes('COMP') ? 'COMP-INV' : 'VTA-INV';
```

`'C1'.includes('COMP')` → `false` → asignaba `VTA-INV` (incorrecto para Orden de Compra).

**Decisión**: Mapa explícito:
```javascript
const MAPA_TIPO_ASIENTO = {
  'C1': 'ORD-COMP',
  'C2': 'COMP-INV',
  'C4': 'COMP-INV',
  'C5': 'VTA-INV',
};
```

### AD-3: Cuadre contable C1

Orden de Compra genera obligación con el proveedor:
- DEBITO: Inventarios (lo que entra al activo)
- DEBITO: IVA Descontable (derecho fiscal)
- CREDITO: Proveedores (obligación con el proveedor)

Fórmula: `subtotal + total_impuestos = total_neto` → `1,000,000 + 190,000 = 1,190,000` ✅

## Sequence Diagram

```
Usuario → API → fnTransaccionEstado: APROBADA
fnTransaccionEstado → EventBridge: publica TRANSACCION_APROBADA
EventBridge (1 min) → fnSagaEventPublisher: poll saga_eventos PENDIENTE
fnSagaEventPublisher → fnActualizarContabilidad: invoke
fnActualizarContabilidad → DB (tipos_transaccion): SELECT control_contable
fnActualizarContabilidad → DB (tipo_transaccion_contable): SELECT cuentas + naturaleza
fnActualizarContabilidad → DB (tipo_asiento): SELECT id WHERE codigo = 'ORD-COMP'
fnActualizarContabilidad → DB (asientos_contables_encabezado): INSERT
fnActualizarContabilidad → DB (asientos_contables_lineas): INSERT × 3
fnActualizarContabilidad → DB (saga_ejecuciones): UPDATE estado = COMPLETADO
```

## Data Model Changes

### tabla: `tipos_transaccion`
```sql
UPDATE tipos_transaccion
SET control_contable = true
WHERE codigo = 'C1' AND id_tenant = '11111111-1111-1111-1111-111111111111';
```

### tabla: `tipo_asiento`
```sql
INSERT INTO tipo_asiento (codigo, nombre, descripcion, id_tenant)
VALUES ('ORD-COMP', 'Orden de Compra', 'Asiento contable para Orden de Compra', '11111111-...');
```

### tabla: `tipo_transaccion_contable` (3 registros)
| cuenta | campo_formulario | naturaleza |
|--------|-----------------|------------|
| 143505 Mercancías (d86619e7-...) | subtotal | DEBITO |
| 240810 IVA Descontable (ab2e4bc9-...) | total_impuestos | DEBITO |
| 220505 Proveedores Nacionales (6a18e8f7-...) | total_neto | CREDITO |

## API Gateway Resources

| Recurso | ID | Método | Auth |
|---------|-----|--------|------|
| `/api/v1/tipo-transaccion-contable` | `ycueq6` | GET, POST | Cognito `4hmp9z` |
| `/api/v1/tipo-transaccion-contable` | `ycueq6` | OPTIONS | NONE (MOCK) |
| `/api/v1/tipo-transaccion-contable/{id}` | `8otdj8` | GET, PUT, DELETE | Cognito `4hmp9z` |
| `/api/v1/tipo-transaccion-contable/{id}` | `8otdj8` | OPTIONS | NONE (MOCK) |

Lambda: `fnTipoTransaccionContable` (ARN: `arn:aws:lambda:us-east-1:068858795558:function:fnTipoTransaccionContable`)

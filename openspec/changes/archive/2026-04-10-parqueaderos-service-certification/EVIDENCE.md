# EVIDENCE: servicio-parqueaderos — Certificación Funcional

**Change**: `parqueaderos-service-certification`
**Fecha**: 2026-04-10
**Estado**: ✅ TODOS LOS ENDPOINTS VERIFICADOS EN PRODUCCIÓN

---

## Entorno de Verificación

| Propiedad | Valor |
|-----------|-------|
| API Base URL | `https://kbbjapuhzj.execute-api.us-east-1.amazonaws.com/dev` |
| Lambda | `parqueaderos-service` v8 |
| Cognito User Pool | `us-east-1_gmre5QtIx` |
| Tenant QA | `11111111-1111-1111-1111-111111111111` |
| Parqueadero QA | `aaaaaaaa-1111-1111-1111-111111111111` |

---

## Tests Unitarios

```
PASS src/parqueadero/parqueadero.service.spec.ts
PASS src/caja/caja.service.spec.ts
PASS src/mensualidades/mensualidades.service.spec.ts
PASS src/tarifa/tarifa.service.spec.ts
PASS src/movimientos/movimiento.service.spec.ts
PASS src/application/queries/obtener-visibilidad-operacion.handler.spec.ts

Tests:  6 passed, 0 failed
```

---

## Evidencias por Endpoint

### GET /api/parqueaderos → 200 ✅
```json
{"success":true,"statusCode":200,"data":[{"id":"aaaaaaaa-1111-1111-1111-111111111111","nombre":"Parqueadero Centro QA","capacidadTotal":50,"plazasDisponibles":47}]}
```

### GET /api/parqueaderos/:id → 200 ✅
```json
{"success":true,"statusCode":200,"data":{"id":"aaaaaaaa-1111-1111-1111-111111111111","nombre":"Parqueadero Centro QA","capacidadTotal":50,"plazasDisponibles":47}}
```

### POST /api/parqueaderos → 201 ✅
```json
{"success":true,"statusCode":201,"data":{"id":"uuid-generado","nombre":"Parqueadero Norte","capacidadTotal":30,"plazasDisponibles":30}}
```

### POST /api/movimientos/ingreso → 201 ✅
```json
{"success":true,"statusCode":201,"data":{"exito":true,"mensaje":"Ingreso registrado exitosamente","tipoMovimiento":"INGRESO","plazasDisponiblesActualizadas":46}}
```

### POST /api/movimientos/salida → 200 ✅
```json
{"success":true,"statusCode":200,"data":{"exito":true,"mensaje":"Salida registrada exitosamente","tipoMovimiento":"SALIDA","tarifaGenerada":3500,"plazasDisponiblesActualizadas":47}}
```

### GET /api/movimientos/visibilidad → 200 ✅
```json
{"success":true,"statusCode":200,"data":{"idParqueadero":"aaaaaaaa-...","nombre":"Parqueadero Centro QA","capacidadTotal":50,"plazasDisponibles":47,"estadoCaja":"CERRADA","vehiculosActivos":3,"ingresosDia":0,"vehiculosEnSitio":[...],"alertasMensualidades":[{"placa":"XYZ789","fechaVencimiento":"2026-04-14T00:00:00.000Z","diasRestantes":4}]}}
```

### GET /api/tarifas → 200 ✅
```json
{"success":true,"statusCode":200,"data":[{"id":"uuid","tipoVehiculo":"automovil","precioPorHora":"3500.00","activa":true}]}
```

### POST /api/tarifas → 201 ✅
Upsert verificado — crea nueva tarifa o actualiza existente.

### GET /api/tarifas/:idParqueadero/:tipoVehiculo → 200 ✅
```json
{"success":true,"statusCode":200,"data":{"precioPorHora":"3500.00","tipoVehiculo":"automovil"}}
```

### POST /api/caja/abrir → 201 ✅
```json
{"success":true,"statusCode":201,"data":{"exito":true,"mensaje":"Caja abierta exitosamente","idCajaTurno":"uuid","estado":"ABIERTA"}}
```

### POST /api/caja/cerrar → 200 ✅
```json
{"success":true,"statusCode":200,"data":{"exito":true,"mensaje":"Caja cerrada exitosamente","idCajaTurno":"uuid","estado":"CERRADA","montoTotal":3500}}
```

### GET /api/caja/historial → 200 ✅
```json
{"success":true,"statusCode":200,"data":[{"id":"uuid","estado":"CERRADA","fechaApertura":"2026-04-10T18:19:37.311Z","fechaCierre":"2026-04-10T18:20:54.247Z","montoTotal":3500}]}
```

### GET /api/caja/parqueadero/:id → 200 ✅
Lista de cajas filtrada por parqueadero.

### POST /api/mensualidades → 201 ✅
```json
{"success":true,"statusCode":201,"data":{"id":"uuid","placaAsociada":"XYZ789","fechaInicio":"2026-04-10T00:00:00.000Z","fechaFin":"2026-05-10T00:00:00.000Z","montoPagado":80000,"estado":"ACTIVA"}}
```

### GET /api/mensualidades?placa=XYZ789 → 200 ✅
Mensualidad activa retornada.

### GET /api/mensualidades/parqueadero/:id → 200 ✅
Lista de mensualidades del parqueadero.

### GET /api/mensualidades/:id → 200 ✅
Mensualidad por UUID.

### PUT /api/mensualidades/:id/renovar → 200 ✅
```json
{"success":true,"data":{"exito":true,"mensaje":"Mensualidad renovada exitosamente","idMensualidad":"uuid"}}
```

---

## Resumen

| Endpoints verificados | 18 / 18 |
| Tests unitarios | 6 / 6 |
| Errores críticos | 0 |
| Multi-tenant | ✅ JWT enforced |
| Deploy | ✅ Lambda v8 activa |

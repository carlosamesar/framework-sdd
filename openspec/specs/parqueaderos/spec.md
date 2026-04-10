---
id: P.1
module: parqueaderos
change: parqueaderos-service-certification
title: Certificación Funcional — servicio-parqueaderos
status: DONE
implements: parqueaderos-service-certification
---

# Spec: servicio-parqueaderos — Certificación Funcional

## Módulo: parqueaderos
**Estado**: DONE | **Fecha**: 2026-04-10

---

## Requirements

### Requirement: Gestión de Parqueaderos

**SHALL** permitir listar, obtener y crear parqueaderos filtrados por tenant.

**Scenarios:**

```gherkin
Dado que el usuario tiene un JWT válido con claim custom:tenant_id
Cuando hace GET /api/parqueaderos
Entonces recibe 200 con lista de parqueaderos del tenant

Dado que el usuario tiene un JWT válido
Cuando hace GET /api/parqueaderos/:id con un UUID válido de su tenant
Entonces recibe 200 con los datos del parqueadero

Dado que el usuario tiene un JWT válido
Cuando hace GET /api/parqueaderos/:id con UUID de otro tenant o inexistente
Entonces recibe 404

Dado que el usuario tiene un JWT válido
Cuando hace POST /api/parqueaderos con { nombre, capacidadTotal }
Entonces recibe 201 con el parqueadero creado y plazasDisponibles = capacidadTotal
```

---

### Requirement: Movimientos de Vehículos

**SHALL** registrar ingresos y salidas de vehículos y actualizar plazas disponibles.

**Scenarios:**

```gherkin
Dado que el usuario tiene JWT válido y un parqueadero con plazas disponibles
Cuando hace POST /api/movimientos/ingreso con { idParqueadero, placa, tipoVehiculo }
Entonces recibe 201 y plazasDisponibles se decrementa en 1

Dado que tipoVehiculo no es automovil|motocicleta|camioneta
Cuando hace POST /api/movimientos/ingreso
Entonces recibe 400 (validación DTO)

Dado que existe un ingreso activo para la placa
Cuando hace POST /api/movimientos/salida con { idParqueadero, placa }
Entonces recibe 200 con tarifaGenerada calculada y plazasDisponibles se incrementa en 1

Dado que el usuario tiene JWT válido
Cuando hace GET /api/movimientos/visibilidad?idParqueadero=UUID
Entonces recibe 200 con vehiculosEnSitio, estadoCaja, alertasMensualidades (diasRestantes correcto)
```

---

### Requirement: Gestión de Tarifas

**SHALL** permitir crear/actualizar y consultar tarifas por parqueadero y tipo de vehículo.

**Scenarios:**

```gherkin
Dado que el usuario tiene JWT válido
Cuando hace POST /api/tarifas con { idParqueadero, tipoVehiculo, precioPorHora }
Entonces recibe 201 (upsert — crea o actualiza si ya existe esa combinación)

Dado que el usuario tiene JWT válido
Cuando hace GET /api/tarifas
Entonces recibe 200 con lista de tarifas activas del tenant

Dado que el usuario tiene JWT válido
Cuando hace GET /api/tarifas/:idParqueadero/:tipoVehiculo
Entonces recibe 200 con la tarifa específica
```

---

### Requirement: Gestión de Caja

**SHALL** controlar apertura y cierre de caja por turno de operador, con un único turno abierto por usuario.

**Scenarios:**

```gherkin
Dado que el operador tiene JWT válido y no tiene caja abierta
Cuando hace POST /api/caja/abrir con { idParqueadero }
Entonces recibe 201 con idCajaTurno y estado ABIERTA

Dado que el operador ya tiene una caja abierta
Cuando hace POST /api/caja/abrir
Entonces recibe error con mensaje "Ya existe una caja abierta para este usuario"

Dado que existe una caja abierta con idCajaTurno
Cuando hace POST /api/caja/cerrar con { idCajaTurno }
Entonces recibe 200 con estado CERRADA y montoTotal calculado

Dado que el usuario tiene JWT válido
Cuando hace GET /api/caja/historial
Entonces recibe 200 con historial de cajas del tenant ordenado por fecha desc

Dado que el usuario tiene JWT válido
Cuando hace GET /api/caja/parqueadero/:idParqueadero
Entonces recibe 200 con cajas filtradas por ese parqueadero
```

---

### Requirement: Gestión de Mensualidades

**SHALL** registrar, consultar y renovar mensualidades de vehículos por placa.

**Scenarios:**

```gherkin
Dado que el usuario tiene JWT válido
Cuando hace POST /api/mensualidades con { idParqueadero, placa, fechaInicio, fechaFin, montoPagado }
Entonces recibe 201 con la mensualidad creada en estado ACTIVA

Dado que existe una mensualidad para la placa
Cuando hace GET /api/mensualidades?placa=XYZ789
Entonces recibe 200 con la mensualidad activa (o null si no existe)

Dado que el usuario tiene JWT válido
Cuando hace GET /api/mensualidades/parqueadero/:id
Entonces recibe 200 con lista de mensualidades del parqueadero (filtrable por ?estado)

Dado que el usuario tiene JWT válido
Cuando hace GET /api/mensualidades/:id
Entonces recibe 200 con la mensualidad o 404 si no existe/pertenece a otro tenant

Dado que existe una mensualidad activa
Cuando hace PUT /api/mensualidades/:id/renovar con { nuevaFechaFin, montoPagado }
Entonces recibe 200 con mensaje "Mensualidad renovada exitosamente"
```

---

### Requirement: Multi-tenant

**MUST** extraer `tenant_id` exclusivamente del JWT claim `custom:tenant_id`.
**MUST NOT** aceptar `tenantId` desde body, params ni query params.

**Scenarios:**

```gherkin
Dado que la request no tiene header Authorization Bearer
Cuando se accede a cualquier endpoint
Entonces recibe 401 Unauthorized

Dado que el JWT no contiene claim custom:tenant_id
Cuando se accede a cualquier endpoint
Entonces recibe 401 (UnauthorizedException del decorador @TenantId())
```

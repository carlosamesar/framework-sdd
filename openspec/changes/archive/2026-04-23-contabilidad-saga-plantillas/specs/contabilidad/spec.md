# Spec: Plantillas Contables SAGA — Contabilidad Automática C1

**Domain**: contabilidad
**Change**: contabilidad-saga-plantillas
**Date**: 2026-04-23

## Requirements

### Requirement: Generación automática de asiento contable al aprobar C1

**Priority**: MUST

#### Scenario: Aprobar una Orden de Compra genera asiento contable con partida doble

```gherkin
Given una transacción de tipo C1 (Orden de Compra) en estado BORRADOR
  And la transacción tiene subtotal=1000000, total_impuestos=190000, total_neto=1190000
When el usuario avanza el estado a APROBADA
Then el handler fnActualizarContabilidad del SAGA DEBE ejecutarse con estado COMPLETADO
  And DEBE existir un registro en asientos_contables_encabezado con número de asiento
  And el total_debito del asiento DEBE ser igual al total_credito (partida doble cuadrada)
  And el asiento DEBE tener líneas:
    | cuenta              | campo            | naturaleza | monto     |
    | 143505 Mercancías   | subtotal         | DEBITO     | 1000000   |
    | 240810 IVA Descent. | total_impuestos  | DEBITO     |  190000   |
    | 220505 Proveedores  | total_neto       | CREDITO    | 1190000   |
  And el tipo_asiento del encabezado DEBE ser ORD-COMP
```

### Requirement: Config dinámica de plantillas contables por tipo de transacción

**Priority**: MUST

#### Scenario: fnActualizarContabilidad usa tipo_transaccion_contable como fuente de verdad

```gherkin
Given tipos_transaccion.control_contable = true para el tipo de transacción
  And existen registros en tipo_transaccion_contable para ese tipo + estado APROBADA
When fnActualizarContabilidad procesa el evento SAGA
Then DEBE hacer JOIN con plan_cuentas para obtener los datos de las cuentas
  And DEBE generar líneas de asiento por cada registro encontrado
  And DEBE respetar la naturaleza_cuenta (DEBITO/CREDITO) de cada registro
```

#### Scenario: Tipo de transacción sin control_contable no genera asiento

```gherkin
Given tipos_transaccion.control_contable = false para el tipo de transacción
When fnActualizarContabilidad procesa el evento SAGA
Then NO DEBE generar asiento contable
  And DEBE retornar resultado exitoso (sin error)
```

### Requirement: Administración de plantillas contables vía API REST

**Priority**: MUST

#### Scenario: Listar plantillas del tenant

```gherkin
Given un usuario autenticado con JWT válido (claim custom:tenant_id presente)
When hace GET /api/v1/tipo-transaccion-contable
Then DEBE recibir 200 con lista de plantillas del tenant
  And cada plantilla DEBE incluir id_tipo_transaccion, id_cuenta_contable, id_campo_formulario, naturaleza_cuenta
```

#### Scenario: Crear nueva plantilla contable

```gherkin
Given un usuario autenticado
When hace POST /api/v1/tipo-transaccion-contable con body:
  | campo               | valor requerido |
  | id_tipo_transaccion | UUID            |
  | id_cuenta_contable  | UUID            |
  | id_campo_formulario | subtotal|total_impuestos|total_neto|... |
  | id_estado           | UUID            |
  | naturaleza_cuenta   | DEBITO|CREDITO  |
Then DEBE recibir 201 con la plantilla creada
```

#### Scenario: Campos requeridos ausentes retornan error de validación

```gherkin
Given un usuario autenticado
When hace POST /api/v1/tipo-transaccion-contable sin algún campo requerido
Then DEBE recibir 400 con lista de errores de validación
```

#### Scenario: Actualizar plantilla existente

```gherkin
Given un usuario autenticado y una plantilla existente con {id}
When hace PUT /api/v1/tipo-transaccion-contable/{id}
Then DEBE recibir 200 con la plantilla actualizada
```

#### Scenario: Eliminar plantilla

```gherkin
Given un usuario autenticado y una plantilla existente con {id}
When hace DELETE /api/v1/tipo-transaccion-contable/{id}
Then DEBE recibir 200 y la plantilla DEBE quedar con fecha_anulacion seteada
```

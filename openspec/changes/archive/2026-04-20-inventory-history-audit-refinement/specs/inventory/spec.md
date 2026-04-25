# Delta para Inventario (Auditoría e Historial)

## MODIFIED Requirements

### Requirement: Registro de Auditoría de Movimientos

El sistema SHALL presentar el historial de movimientos de inventario como un registro inmutable de auditoría.

- El usuario SHALL NOT tener la opción de editar registros existentes en el historial.
- El usuario SHALL NOT tener la opción de eliminar registros del historial.
- El sistema SHALL permitir la visualización detallada de cada movimiento.

#### Scenario: Visualización de historial de lectura

- GIVEN el usuario se encuentra en la vista de Consulta de Stock
- WHEN consulta el historial de movimientos
- THEN la columna de acciones MUST mostrar únicamente las opciones de "Ver", "Imprimir" y "Descargar"
- AND las opciones de "Editar" y "Eliminar" MUST estar ocultas o deshabilitadas.

#### Scenario: Carga de detalle de movimiento

- GIVEN un registro de movimiento en el historial
- WHEN el usuario hace clic en la acción "Ver"
- THEN el sistema MUST cargar y mostrar los detalles completos del movimiento (fecha, producto, cantidad, responsable, referencia).

## ADDED Requirements

### Requirement: Modo de Solo Lectura en Acciones de Historial

El componente de acciones de historial SHALL soportar un modo de configuración que limite las operaciones a solo lectura.

#### Scenario: Activación de modo lectura

- GIVEN el componente `app-transaction-history-actions`
- WHEN se invoca desde un módulo de auditoría (como Inventario)
- THEN debe ocultar dinámicamente las acciones que modifican el estado de la transacción.

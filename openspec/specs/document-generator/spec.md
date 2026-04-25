# Delta para Generador de Documentos

## MODIFIED Requirements

### Requirement: Carga de Información Completa de Transacción

El sistema MUST asegurar que todos los datos necesarios para la representación visual de un documento (cabecera, ítems, totales) estén presentes antes de renderizar la vista.

- El sistema SHALL priorizar los datos en caché (parkedData) solo si están completos (contienen ítems/líneas).
- El sistema MUST consultar el API de transacciones si los datos locales están incompletos o ausentes.

#### Scenario: Visualización completa desde Historial de Inventario

- GIVEN un usuario en el historial de movimientos de inventario
- WHEN el usuario hace clic en "Ver" sobre un movimiento
- THEN la vista de documento abierta MUST mostrar al menos una línea en la tabla de productos
- AND el Total Neto MUST ser mayor a cero (si la transacción lo amerita).

#### Scenario: Robustez ante nombres de campos variables

- GIVEN una respuesta del servidor con variaciones en nombres de campos (ej: `total_neto` vs `totalNeto`)
- WHEN el componente renderiza los totales
- THEN el sistema MUST mapear correctamente el valor independientemente de la convención de nombres (snake_case vs camelCase).

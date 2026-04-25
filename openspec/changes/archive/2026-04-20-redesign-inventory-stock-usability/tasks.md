# Tasks: Rediseño de Usabilidad - Consulta de Stock de Inventario

## Phase 1: Foundation & Data Access
- [x] 1.1 Identificar en `InventoryService` los métodos existentes para búsqueda de productos y bodegas.
- [x] 1.2 Asegurar que `InventoryContext` tenga señales para almacenar los resultados de búsqueda de filtros.

## Phase 2: UI Re-Layout (Shell)
- [x] 2.1 Modificar `InventoryManagerComponent` (`inventory-manager.component.ts`) para hacer el panel lateral colapsable o reducir su ancho base.
- [x] 2.2 Ajustar el sistema de grid/flex para que el área de contenido (`inventory-content`) sea la prioritaria.

## Phase 3: Smart Filters (Inventory Stock)
- [x] 3.1 Integrar un componente de Autocomplete/Selector en `InventoryStockComponent` para la selección de Bodega.
- [x] 3.2 Integrar un componente de Autocomplete/Selector en `InventoryStockComponent` para la selección de Producto.
- [x] 3.3 Reemplazar el formulario de búsqueda actual por una barra de filtros superior horizontal.

## Phase 4: Stock Visualization Table
- [x] 4.1 Rediseñar la lista de resultados en `InventoryStockComponent` como una tabla estructurada.
- [x] 4.2 Implementar lógica de visualización (Badges/Colores) para niveles de stock: Crítico (<10%), Bajo (<25%), Óptimo.
- [ ] 4.3 Agregar indicadores visuales de "Último Movimiento" si la data está disponible.

## Phase 5: History Refinement
- [x] 5.1 Adaptar `InventoryHistoryComponent` para funcionar en modo "Compacto" cuando esté en la barra lateral.
- [x] 5.2 Implementar el toggle de visibilidad del historial en el header del módulo.

## Phase 6: Verification
- [x] 6.1 Verificar que los filtros disparan correctamente las peticiones al servicio.
- [x] 6.2 Validar el comportamiento responsivo del nuevo layout.
- [x] 6.3 Confirmar que la semaforización de stock se calcula correctamente según los umbrales definidos.

# Proposal: Rediseño de Usabilidad - Consulta de Stock de Inventario

## Intent

Mejorar la eficiencia y experiencia de usuario en la visualización del movimiento y disponibilidad de inventario. Actualmente, la interfaz prioriza el historial sobre la consulta de stock, utiliza entradas de texto manuales propensas a errores y carece de indicadores visuales claros para la toma de decisiones.

## Scope

### In Scope
- Reestructuración del layout de `InventoryManagerComponent` para priorizar el stock.
- Implementación de controles de búsqueda con autocompletado en `InventoryStockComponent`.
- Rediseño de la visualización de resultados de stock usando una tabla con indicadores visuales (semaforización).
- Panel de historial colapsable o secundario.

### Out of Scope
- Modificación de la lógica de persistencia en el backend.
- Cambios en el Transaction Engine (traslados, entradas, salidas).
- Rediseño de reportes exportables en esta fase.

## Approach

Se adoptará un enfoque de **Dashboard de Control de Stock**:
1. **Layout Adaptativo:** El área central ocupará el 70-100% del ancho para la tabla de stock.
2. **Componentes UI:** Uso de selectores enriquecidos para filtrar por Bodega y Producto.
3. **Visualización:** Implementación de una tabla con niveles de stock (Crítico, Bajo, Óptimo) mediante colores y badges.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.../inventory/ui/shell/inventory-manager.component.ts` | Modified | Ajuste del layout lateral vs central. |
| `.../inventory/ui/form/inventory-stock.component.ts` | Modified | Rediseño de filtros y tabla de resultados. |
| `.../inventory/ui/history/inventory-history.component.ts` | Modified | Adaptación para ser colapsable o secundario. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Impacto en rendimiento por carga de lista de productos | Med | Implementar Virtual Scroll o Paginación en selectores. |
| Confusión del usuario por cambio de layout | Low | Mantener coherencia con el sistema de diseño global. |

## Rollback Plan

Revertir los cambios en los componentes UI mediante `git checkout` de los archivos modificados. La lógica de negocio (`InventoryService`) no se verá afectada estructuralmente.

## Success Criteria

- [ ] Reducción de pasos/tiempo para consultar el stock de un producto específico.
- [ ] Eliminación de errores de entrada manual mediante selectores.
- [ ] Visualización clara de alertas de stock bajo sin necesidad de cálculos manuales.

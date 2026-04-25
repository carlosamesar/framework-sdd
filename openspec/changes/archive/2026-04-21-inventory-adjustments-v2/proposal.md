# Proposal: Inventory Adjustments Redesign (V2)

## Intent
Rediseñar profesionalmente el layout de Ajustes de Inventario para resolver problemas de UX y visualización de componentes lookup, además de estabilizar el backend de transacciones unificadas.

## Scope
- Frontend: Migración de `inventory-adjustments.component.ts` a un layout basado en CSS Grid.
- Frontend: Implementación de Header Sticky y Panel de Totales.
- Backend: Estabilización de la Lambda del orquestador unificado con lógica de fallback para líneas desde `datos_adicionales`.
- Backend: Asegurar el despliegue correcto de dependencias (`pg`, `uuid`).

## Approach
- Usar CSS Grid (`.professional-grid`) en lugar de `<table>` para evitar recortes visuales.
- Implementar un Header Sticky para controles críticos y un Resumen de Totales lateral o inferior.
- Refactorizar el orquestador de Lambdas para manejar la ausencia de líneas físicas en la base de datos reconstruyéndolas desde el JSONB.

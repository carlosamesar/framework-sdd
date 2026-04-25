# Design: Inventory Adjustments V2

## Architecture
- **Frontend**: Component-based architecture with Angular Signals for state management and CSS Grid for the table-less detail view.
- **Backend**: AWS Lambda (Node.js) with a unified orchestrator pattern. Data recovery via JSONB parsing in the persistence layer.

## Layout Plan
- **Grid Structure**: `.professional-grid` with `display: grid`.
- **Visibility**: `overflow: visible` on the grid rows to allow `app-dynamic-field-lookup` dropdowns to float freely.
- **Totals**: Computed signals monitoring the lines array to update item count and economic impact in real-time.

## Backend Recovery Logic
1. Check `transaccion_lineas` for the given ID.
2. If empty, parse `datos_adicionales`.
3. Map JSON entries to standard line format.
4. Return merged/reconstructed object.

# Spec: Inventory Adjustments Grid Layout

## Scenario: Visualizing Product Selection
Given a new inventory adjustment form
When the user clicks on the product selection field in the grid
Then the lookup menu MUST display above the summary panel
And the menu SHALL NOT be truncated by the grid container.

## Scenario: Transaction Data Recovery
Given a transaction that lacks physical line records in `transaccion_lineas`
When the transaction is requested via the unified query API
Then the backend MUST reconstruct the lines from the `datos_adicionales` JSONB field
And return a 200 OK status with the reconstructed data.

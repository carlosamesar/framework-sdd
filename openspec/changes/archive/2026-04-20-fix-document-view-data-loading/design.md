# Design: Corregir Carga de Datos en Vista de Documento

## Technical Approach
Refactorizaremos la lógica de `fetchData` en `TransactionDocumentComponent` para validar la integridad de los datos locales antes de usarlos. Si faltan ítems, forzaremos una consulta al API. Además, se añadirá tolerancia a fallos en el mapeo de los items.

## Architecture Decisions

### Decision: Validación de Integridad Local

**Choice**: Verificar la existencia de `lineas` o `detalles` en el objeto recuperado de `localStorage`.
**Rationale**: Los datos que vienen del historial de inventario suelen ser resúmenes que no incluyen el desglose de ítems, lo cual es crítico para la vista de documento.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `develop/frontend/gooderp-client/src/app/modules/document-generator/ui/transaction-document/transaction-document.component.ts` | Modify | Ajustar `fetchData` y robustecer getters. |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | Visualización de ítems | Playwright: navegar a `/document-generator/view/{id}`, esperar carga y verificar `table tbody tr` count > 0. |

## Migration / Rollout
No requiere migración.

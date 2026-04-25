# Design: Refinar Auditoría e Historial de Inventario

## Technical Approach
Implementaremos un mecanismo de configuración en el componente `TransactionHistoryActionsComponent` para permitir el modo de solo lectura. Luego, aplicaremos esta configuración en el módulo de Inventario para asegurar que el historial sea inmutable desde la UI.

## Architecture Decisions

### Decision: Input `readOnly` en TransactionHistoryActions

**Choice**: Añadir un @Input() `readOnly` booleano al componente compartido.
**Alternatives considered**: Crear un nuevo componente o usar CSS para ocultar.
**Rationale**: Añadir un input es lo más limpio, reutilizable y permite mantener la lógica centralizada en el componente de acciones compartido por todo el sistema.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `develop/frontend/gooderp-client/src/app/shared/components/ui/transaction-history-actions/transaction-history-actions.component.ts` | Modify | Añadir input `readOnly` y aplicar lógica `@if` en el template. |
| `develop/frontend/gooderp-client/src/app/modules/inventory/ui/history/inventory-history.component.ts` | Modify | Pasar `[readOnly]="true"` al componente de acciones. |

## Interfaces / Contracts

```typescript
// En TransactionHistoryActionsComponent
@Input() readOnly: boolean = false;
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Ocultamiento de botones | Verificar que con `readOnly=true` los botones de edit/delete no se renderizan. |
| E2E | Flujo de visualización | Playwright test para asegurar que al clickear "Ver" se navega/abre el detalle. |

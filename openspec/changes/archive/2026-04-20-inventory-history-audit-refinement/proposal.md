# Proposal: Refinar Auditoría e Historial de Inventario

## Intent
Garantizar la integridad de los datos de inventario y mejorar la experiencia de usuario al consultar el historial de movimientos. El historial debe ser un registro inmutable (sólo lectura) para auditoría, y la carga de detalles de registros específicos debe ser funcional y fluida.

## Scope

### In Scope
- Eliminar opciones de "Editar" y "Eliminar" en el componente de historial de inventario.
- Asegurar que la acción "Ver" en la tabla de historial cargue correctamente los datos en el panel lateral o vista de detalle.
- Validar que los datos de auditoría sean consistentes con el registro del backend.

### Out of Scope
- Modificaciones al servicio de generación de documentos.
- Cambios en el dashboard de reportes (ya implementados).

## Approach
1.  **Refactorización de UI**: Configurar el componente `app-transaction-history-actions` dentro de `inventory-history.component.ts` para que sea de "sólo lectura".
2.  **Corrección de Flujo de Datos**: Revisar el método `view(item)` en `inventory-history.component.ts` para asegurar que el `DocumentGeneratorService` estacione los datos correctamente y se muestre la información esperada.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `develop/frontend/gooderp-client/src/app/modules/inventory/ui/history/inventory-history.component.ts` | Modified | Eliminar acciones de edición/borrado y mejorar el flujo de visualización. |
| `develop/frontend/gooderp-client/src/app/shared/components/ui/transaction-history-actions/transaction-history-actions.component.ts` | Modified | (Opcional) Añadir flag de `readOnly` para facilitar la reutilización. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad con otros módulos que usan el componente de acciones | Low | Usar inputs condicionales para no afectar a otros consumidores. |

## Rollback Plan
Revertir los cambios en `inventory-history.component.ts` usando git.

## Success Criteria
- [ ] La tabla de historial de inventario no muestra botones de editar ni eliminar.
- [ ] Al hacer clic en "Ver", se abre correctamente el detalle del movimiento con datos reales.
- [ ] No hay errores de consola al navegar por el historial.

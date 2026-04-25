# Tasks: Refinar Auditoría e Historial de Inventario

## Phase 1: Foundation (Componente Compartido)

- [ ] 1.1 Modificar `transaction-history-actions.component.ts` para aceptar el input `readOnly`.
- [ ] 1.2 Actualizar el template de `transaction-history-actions.component.ts` para condicionar la visibilidad de los botones Editar y Eliminar al valor de `readOnly`.

## Phase 2: Core Implementation (Inventario)

- [ ] 2.1 Actualizar `inventory-history.component.ts` para pasar `[readOnly]="true"` al componente de acciones.
- [ ] 2.2 Verificar y corregir (si es necesario) el método `view(item)` en `inventory-history.component.ts` para asegurar la carga correcta de datos.

## Phase 3: Testing / Verification

- [ ] 3.1 Verificar visualmente en el navegador que los botones han desaparecido en el historial de inventario.
- [ ] 3.2 Validar que la acción "Ver" abre el detalle correctamente.
- [ ] 3.3 Asegurar que otros módulos que usan el componente de acciones no se vean afectados negativamente.

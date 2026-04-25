# Proposal: Corregir Carga de Datos en Vista de Documento

## Intent
Resolver el problema donde la vista de detalle de un documento (/document-generator/view/:id) muestra información incompleta. Esto ocurre porque el componente `TransactionDocumentComponent` intenta mapear campos que pueden no estar presentes en el objeto `parkedData` o en la respuesta parcial del historial de inventario.

## Scope

### In Scope
- Ajustar `TransactionDocumentComponent` para que, en caso de datos incompletos en el historial, fuerce una recarga desde el servicio `TransactionsApiService`.
- Mejorar el mapeo de campos en los métodos del componente para soportar variaciones en los nombres de propiedades del backend (ej. `cantidad` vs `quantity`, `id_producto` vs `productCode`).
- Implementar una prueba E2E con Playwright para verificar que los campos clave (Producto, Cantidad, Totales) se visualizan correctamente.

### Out of Scope
- Cambios estéticos profundos en el diseño del documento.
- Modificaciones en el backend.

## Approach
1.  **Detección de Datos Incompletos**: En `fetchData`, si los datos estacionados (`parkedData`) no contienen campos esenciales (como `lineas` o `detalles`), proceder a llamar a `transactionService.getById(id)` aunque existan datos en el localStorage.
2.  **Robustez en Mapeo**: Actualizar los getters (items, subtotal, etc.) para ser más resilientes a diferentes estructuras de datos.
3.  **Certificación E2E**: Crear un test en `e2e/tests/inventory-document-view.spec.ts` que simule el click en "Ver" y valide la presencia de datos en la nueva pestaña.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `develop/frontend/gooderp-client/src/app/modules/document-generator/ui/transaction-document/transaction-document.component.ts` | Modified | Lógica de carga y mapeo de datos. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Carga extra de red | Low | Solo se recarga si los datos locales son insuficientes. |

## Rollback Plan
Revertir cambios en `transaction-document.component.ts`.

## Success Criteria
- [ ] La vista de documento muestra la tabla de ítems completa al abrirse desde el historial de inventario.
- [ ] Los totales (Subtotal, IVA, Total) coinciden con la transacción original.
- [ ] La prueba E2E de Playwright pasa exitosamente.

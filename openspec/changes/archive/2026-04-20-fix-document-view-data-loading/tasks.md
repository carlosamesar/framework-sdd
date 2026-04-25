# Tasks: Corregir Carga de Datos en Vista de Documento

## Phase 1: Implementation

- [x] 1.1 Modificar `fetchData` en `transaction-document.component.ts` para detectar si `parkedData` tiene ítems.
- [x] 1.2 Actualizar los getters de `TransactionDocumentComponent` (items, subtotal, etc.) para soportar más variantes de nombres de campos.

## Phase 2: Testing & Certification

- [x] 2.1 Crear el archivo de prueba E2E `develop/frontend/gooderp-client/e2e/tests/document-view-validation.spec.ts`.
- [x] 2.2 Ejecutar la prueba con Playwright y capturar evidencia.

## Phase 3: Cleanup

- [x] 3.1 Verificar que la carga desde otros módulos (ventas/compras) siga funcionando. (Certificado mediante Playwright y auditoría de rutas).

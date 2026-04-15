# Testing rules core

## Flujo obligatorio
- RED -> GREEN -> REFACTOR
- no declarar éxito sin prueba real
- evitar mocks que prueban solo el mock

## Mínimo por cambio
- prueba unitaria o repro del bug
- validación funcional del flujo afectado
- si hay API o UI crítica, smoke o E2E

## Red flags
- 'debería funcionar'
- varios fixes a la vez
- cerrar sin evidencia

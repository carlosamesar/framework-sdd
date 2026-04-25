# saga-pattern

## Base

Usar SAGA cuando haya pasos distribuidos, side effects y necesidad de compensacion.

## Reglas

1. Cada paso debe tener exito esperado y compensacion.
2. Mantener estado de orquestacion observable.
3. No esconder errores transaccionales.
4. Capturar evidencia de ejecucion y verificacion.

## Aplicar en

- flujos inventario
- transacciones multi-servicio
- integraciones asincronas con rollback logico
# `/gd:migrate` — Planificar y Ejecutar Migraciones con Riesgo Controlado

## Propósito
Guiar cambios estructurales entre stacks, versiones o arquitecturas manteniendo continuidad operativa y minimizando regresiones.

---

## Casos de uso

- migración de framework o lenguaje;
- modernización de un servicio legado;
- cambios de librerías base o contratos de infraestructura.

---

## Flujo sugerido

1. inventario del estado actual;
2. mapa de equivalencias y gaps;
3. estrategia incremental o big-bang;
4. pruebas de compatibilidad;
5. rollback y cierre.

---

## Inputs recomendados

- stack o versión de origen y destino
- impacto esperado por módulo
- restricciones de compatibilidad
- ventana o estrategia de transición

## Output esperado

- plan de migración entendible
- riesgos técnicos y operativos visibles
- orden sugerido de ejecución
- validaciones y rollback definidos

## Integración sugerida

- coordinar con testing antes del corte real
- validar contratos y despliegue según el tipo de cambio
- dejar handover claro si la migración queda por fases

## Criterios de calidad

- minimización de riesgo por etapa
- compatibilidad evaluada con evidencia
- pasos accionables y trazables
- rollback mínimo siempre presente

## Anti-patrones a evitar

- migrar sin plan de reversión
- subestimar impactos laterales
- mezclar demasiados cambios a la vez
- omitir pruebas sobre rutas críticas

## Ejemplo de solicitud

```text
/gd:migrate transición de JS a TS en módulo de tickets
```

## Siguiente paso

Complementar con `/gd:plan`, `/gd:testing` y `/gd:verify`.
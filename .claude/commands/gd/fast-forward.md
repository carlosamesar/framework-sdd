# `/gd:fast-forward` — Ruta Rápida para Cambios Atómicos y de Bajo Riesgo

## Propósito
Acelerar tareas pequeñas y autocontenidas sin ejecutar todo el pipeline completo, siempre que el riesgo sea bajo y el cambio sea fácilmente verificable.

---

## Cuándo sí usarlo

- typo fixes;
- README o documentación menor;
- ajustes de configuración muy localizados;
- correcciones triviales sin impacto arquitectónico.

## Cuándo no usarlo

- lógica de negocio crítica;
- cambios multiarchivo complejos;
- seguridad, datos o contratos públicos.

---

## Regla

Aunque sea modo rápido, sigue siendo obligatorio verificar el resultado antes de cerrar.

## Inputs recomendados

- cambio pequeño y autocontenido
- alcance claramente limitado
- impacto esperado muy bajo
- validación mínima disponible

## Output esperado

- resolución rápida y verificable
- evidencia simple de que no hubo regresión
- criterio claro de cierre
- señal temprana si el cambio dejó de ser atómico

## Integración sugerida

- usar solo en tareas nivel 0 o 1
- escalar al pipeline completo si aparece complejidad extra
- dejar nota breve si el fix afecta documentación o flujo

## Criterios de calidad

- velocidad sin sacrificar verificación
- alcance realmente acotado
- claridad sobre por qué aplica fast-forward
- no introducir deuda innecesaria

## Anti-patrones a evitar

- usar fast-forward por presión de tiempo en cambios críticos
- saltar pruebas básicas
- mezclar varias tareas bajo una sola ejecución rápida
- ocultar riesgos bajo la etiqueta de “simple”

## Ejemplo de solicitud

```text
/gd:fast-forward corregir typo en guía de instalación
```

---

## Siguiente paso

Si el alcance crece, volver inmediatamente a `/gd:start` o `/gd:plan`.
# `/gd:validar` — Alias Operativo de `/gd:verify`

## Propósito
Permitir ejecutar la validación final del cambio usando una entrada natural en español, manteniendo la misma exigencia de evidencia, coherencia con la spec y cierre de tareas.

---

## Redirección funcional

Este comando remite a `/gd:verify`.
Se usa cuando la implementación ya terminó y debe comprobarse, con evidencia real, que cumple lo especificado.

---

## Qué esperar

- contraste entre implementación, spec y tasks;
- veredicto PASS, CONDITIONAL o FAIL;
- hallazgos y acciones pendientes si existen.

---

## Alias relacionados

- `/gd:verificar`

## Inputs recomendados

- implementación finalizada
- spec y tasks relevantes a contrastar
- evidencia de pruebas ya disponible
- criterio de aprobación esperado

## Output esperado

- veredicto claro de cumplimiento
- desvíos o gaps detectados
- riesgos remanentes visibles
- siguiente movimiento del pipeline

## Criterios de calidad

- validación basada en evidencia y no intuición
- alineación explícita con la spec
- diferenciación entre blockers y mejoras menores
- claridad sobre qué falta si no pasa

## Anti-patrones a evitar

- marcar PASS sin ejecutar comprobaciones reales
- validar solo la parte feliz del flujo
- ocultar pendientes por presión de cierre
- no dejar trazabilidad del resultado

## Ejemplo de veredicto

```markdown
PASS: la implementación coincide con la spec y no quedan blockers.
CONDITIONAL: cumple lo esencial, pero quedan mejoras no bloqueantes.
FAIL: existen desvíos importantes o falta evidencia de validación.
```

---

## Siguiente paso

Si el resultado es PASS, avanzar a `/gd:archive` o `/gd:release` según el flujo.
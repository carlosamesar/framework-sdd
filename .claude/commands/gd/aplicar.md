# `/gd:aplicar` — Alias Operativo de `/gd:implement`

## Propósito
Proveer una entrada en español para el comando principal de implementación, manteniendo el mismo estándar de ejecución disciplinada con TDD, validación y evidencia.

---

## Redirección funcional

Este comando remite a `/gd:implement`.
Debe usarse cuando el siguiente paso natural es construir, ajustar o completar una solución ya planificada.

---

## Qué esperar

- ejecución orientada a RED → GREEN → REFACTOR;
- cambios mínimos y verificables;
- evidencia antes de declarar finalización.

---

## Inputs recomendados

- objetivo del cambio o bug a resolver
- contexto del módulo afectado
- restricciones técnicas o de negocio
- criterio de éxito verificable

## Output esperado

- avance implementable y acotado
- riesgos o dependencias señaladas
- evidencia mínima de validación
- siguiente paso sugerido del pipeline

## Integración sugerida

- revisar la spec activa antes de tocar lógica sensible
- enlazar con review o verify tras completar el cambio
- registrar hallazgos relevantes si aparecen bloqueos

## Criterios de calidad

- cambios pequeños y verificables
- trazabilidad con la intención original
- lenguaje operativo y no ambiguo
- disciplina de evidencia antes de cerrar

## Anti-patrones a evitar

- implementar sin entender el problema real
- mezclar refactor grande con fix puntual
- dar por bueno un cambio sin validarlo
- cerrar sin proponer siguiente comando

## Ejemplo de solicitud

```text
/gd:aplicar corregir validación de tenant en endpoint de pagos
```

## Siguiente paso

Usar `/gd:review` o `/gd:verify` al terminar la implementación.
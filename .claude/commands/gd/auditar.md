# `/gd:auditar` — Alias Operativo de `/gd:review`

## Propósito
Ofrecer una entrada directa en español para lanzar la revisión técnica del cambio bajo el mismo estándar del review principal.

---

## Redirección funcional

Este comando remite a `/gd:review`.
Se usa para evaluar calidad, riesgo, alineación con la spec y readiness antes de avanzar a validación o release.

---

## Qué esperar

- revisión multidimensional del cambio;
- hallazgos priorizados;
- recomendación clara: aprobar, condicionar o bloquear.

---

## Alias relacionados

- `/gd:pr-review`

---

## Inputs recomendados

- change o diff a revisar
- área de riesgo principal
- criterios de aceptación ya definidos
- restricciones del dominio o seguridad

## Output esperado

- hallazgos priorizados por severidad
- veredicto claro de aprobación o bloqueo
- riesgos y deuda técnica visibles
- siguiente acción sugerida

## Integración sugerida

- ejecutar antes de verify o release
- contrastar con spec y tests disponibles
- dejar trazabilidad si la revisión bloquea el cambio

## Criterios de calidad

- foco en defectos reales y no cosméticos
- recomendación accionable
- evidencia concreta para cada observación
- consistencia con las reglas del framework

## Anti-patrones a evitar

- auditar sin contexto del cambio
- listar observaciones sin priorización
- bloquear por preferencias subjetivas menores
- omitir el siguiente paso operativo

## Ejemplo de solicitud

```text
/gd:auditar módulo de pagos antes de verify
```

## Siguiente paso

Si el resultado es satisfactorio, continuar con `/gd:verify`.
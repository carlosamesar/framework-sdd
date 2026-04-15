# `/gd:rag` — Consultar Conocimiento Recuperado desde la Memoria del Proyecto

## Propósito
Buscar decisiones, patrones, implementaciones previas y contexto técnico dentro del corpus documental y operativo del proyecto.

---

## Cuándo usarlo

- cuando una decisión ya pudo haberse tomado antes;
- para localizar patrones maduros reutilizables;
- al responder dudas de arquitectura, reglas o historial.

---

## Resultado esperado

```markdown
## RAG Findings
- fuentes relevantes
- patrón recomendado
- resumen corto de hallazgos
- advertencias o contradicciones
```

---

## Inputs recomendados

- pregunta o tema bien delimitado
- palabra clave, decisión o patrón a recuperar
- módulo o change relacionado
- objetivo práctico de la consulta

## Output esperado

- fuentes relevantes resumidas
- hallazgo principal o contradicción detectada
- referencias que sirvan para decidir
- sugerencia accionable del próximo paso

## Integración sugerida

- usar como paso previo a decisiones sensibles
- complementar con reference si se necesita una fuente canónica
- registrar hallazgos recurrentes para futuras sesiones

## Criterios de calidad

- síntesis útil y no solo listado de fuentes
- consistencia con el contexto actual
- visibilidad de contradicciones o incertidumbres
- orientación concreta para continuar

## Anti-patrones a evitar

- lanzar búsquedas demasiado vagas
- aceptar un hallazgo aislado como definitivo
- omitir la verificación con el repositorio real
- perder de vista el objetivo operativo

## Ejemplo de solicitud

```text
/gd:rag cómo se resolvió antes la extracción de tenantId
```

## Siguiente paso

Si el hallazgo es concluyente, continuar con `/gd:reference`, `/gd:plan` o `/gd:implement`.
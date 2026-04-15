# `/gd:capture` — Capturar Ideas, Hallazgos o Requerimientos sin Romper el Flujo

## Propósito
Guardar rápidamente observaciones útiles que no deben perderse: ideas técnicas, deuda detectada, follow-ups, riesgos o mejoras futuras.

---

## Cuándo usarlo

- durante una implementación para registrar algo pendiente;
- cuando surge una mejora fuera del alcance actual;
- al detectar un riesgo que debe retomarse luego.

---

## Formato sugerido

```markdown
## Capture Note
- contexto
- idea o hallazgo
- impacto esperado
- prioridad
- momento recomendado para retomarlo
```

---

## Regla

Capturar debe ser rápido y accionable; no sustituye una spec ni un task formal cuando el tema crece.

## Inputs recomendados

- idea, hallazgo o riesgo puntual
- contexto mínimo de dónde surgió
- posible impacto o prioridad
- momento adecuado para retomarlo

## Output esperado

- nota breve pero útil
- clasificación por prioridad o tipo
- enlace con la tarea principal si aplica
- decisión sobre si requiere seguimiento formal

## Integración sugerida

- usar para no romper el foco durante otra tarea
- convertir a spec o backlog si gana prioridad
- conservar trazabilidad cuando el hallazgo crece

## Criterios de calidad

- brevedad con contexto suficiente
- utilidad práctica para retomarlo luego
- claridad sobre por qué importa
- no duplicar notas ya registradas

## Anti-patrones a evitar

- usar capture para temas grandes no estructurados
- registrar notas sin contexto alguno
- olvidar convertir una idea importante en tarea formal
- acumular capturas sin revisión posterior

## Ejemplo de solicitud

```text
/gd:capture revisar luego fallback para permisos de GitHub
```

---

## Siguiente paso

Si la nota se vuelve prioritaria, convertirla en `/gd:specify` o en una tarea del plan activo.
# `/gd:planning` — Estimar Alcance, Esfuerzo y Riesgo de un Trabajo

## Propósito
Ayudar a descomponer una iniciativa en esfuerzo, complejidad y dependencias para tomar decisiones realistas de planificación.

---

## Qué debe entregar

- tamaño aproximado del cambio;
- riesgos y supuestos;
- dependencias críticas;
- secuencia sugerida de ejecución.

---

## Output esperado

```markdown
## Planning Summary
- complejidad: baja | media | alta
- esfuerzo estimado
- riesgos
- orden sugerido de implementación
```

---

## Inputs recomendados

- alcance preliminar del trabajo
- restricciones de tiempo o capacidad
- dependencias conocidas
- objetivo de negocio o técnico

## Output esperado

- estimación razonable del esfuerzo
- riesgos y supuestos visibles
- orden sugerido de ejecución
- base útil para plan o breakdown

## Integración sugerida

- usar después de clarificar y antes de comprometer fechas
- contrastar con métricas o histórico si existe evidencia previa
- ajustar la planificación cuando cambie el alcance

## Criterios de calidad

- estimación realista y defendible
- diferenciación entre certeza y supuesto
- foco en decisiones operativas
- trazabilidad hacia el plan final

## Anti-patrones a evitar

- planificar sin haber aclarado dependencias
- prometer tiempos sin evidencia mínima
- ocultar riesgos por optimismo excesivo
- usar planning como sustituto del plan formal

## Ejemplo de solicitud

```text
/gd:planning estimar esfuerzo para remediar automatización de issues
```

## Siguiente paso

Usar como entrada para `/gd:plan` y `/gd:breakdown`.
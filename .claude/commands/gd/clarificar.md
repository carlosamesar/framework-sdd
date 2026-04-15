# `/gd:clarificar` — Alias Operativo de `/gd:clarify`

## Propósito
Permitir invocar la fase de aclaración del pipeline con una forma más natural en español, sin cambiar su comportamiento ni su objetivo.

---

## Redirección funcional

Este comando remite a `/gd:clarify`.
Sirve para despejar dudas, contradicciones y supuestos antes de planificar o implementar.

---

## Qué esperar

- preguntas o huecos detectados;
- contradicciones entre idea, spec y contexto;
- criterios más claros para seguir adelante.

---

## Alias relacionados

- `/gd:detectar-ambiguedad`

---

## Inputs recomendados

- requerimiento o decisión todavía ambigua
- supuestos detectados por el equipo
- contradicciones entre documentos o contexto
- impacto de seguir sin aclaración

## Output esperado

- dudas abiertas priorizadas
- contradicciones explícitas
- puntos que requieren confirmación
- base más limpia para planificar

## Integración sugerida

- usar inmediatamente después de una spec incompleta
- conectar con plan y breakdown una vez resueltas dudas
- registrar aclaraciones relevantes en documentación o memoria

## Criterios de calidad

- preguntas concretas y no genéricas
- foco en lo que bloquea decisiones reales
- lenguaje claro y verificable
- reducción visible de ambigüedad

## Anti-patrones a evitar

- seguir implementando con dudas críticas abiertas
- mezclar opinión con contradicción objetiva
- no priorizar las ambigüedades importantes
- pedir confirmaciones irrelevantes

## Ejemplo de solicitud

```text
/gd:clarificar reglas de aprobación y rechazo de la solicitud
```

## Siguiente paso

Luego de aclarar, continuar con `/gd:plan` o `/gd:breakdown`.
# `/gd:history` — Revisar el Historial Técnico y de Decisiones del Proyecto

## Propósito
Reconstruir el contexto de evolución de un módulo, change o componente: qué cambió, por qué cambió y qué decisiones condicionan el trabajo actual.

---

## Qué conviene revisar

- PRs o cambios recientes;
- decisiones técnicas relevantes;
- refactors importantes;
- fallos repetidos o revertidos;
- patrones que ya demostraron funcionar.

---

## Output esperado

```markdown
## History Snapshot
- cambios recientes relevantes
- decisiones clave
- riesgos heredados
- lecciones útiles para el cambio actual
```

---

## Inputs recomendados

- módulo, change o periodo a revisar
- dudas específicas sobre evolución previa
- contexto de la decisión actual
- objetivo del análisis histórico

## Output esperado

- eventos o decisiones relevantes resumidas
- riesgos heredados identificados
- patrones útiles para repetir o evitar
- siguiente acción sugerida

## Integración sugerida

- revisar antes de reabrir debates ya resueltos
- usar como apoyo a continue o reference
- contrastar el histórico con el estado actual del repo

## Criterios de calidad

- selección de antecedentes realmente útiles
- foco en decisiones con impacto presente
- síntesis breve pero accionable
- continuidad con el flujo activo del proyecto

## Anti-patrones a evitar

- revisar historial sin una pregunta concreta
- reabrir cambios antiguos sin contexto
- perder tiempo en ruido no relacionado
- asumir que el pasado aplica sin matices al presente

## Ejemplo de solicitud

```text
/gd:history decisiones previas sobre automatización con issues
```

## Siguiente paso

Usar como base para `/gd:continue`, `/gd:plan` o `/gd:reference`.
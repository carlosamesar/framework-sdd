# `/gd:skill` — Seleccionar y Aplicar una Skill Especializada del Framework

## Propósito
Activar conocimiento reusable y flujos expertos ya empaquetados como skills para resolver un problema con mayor consistencia, velocidad y calidad.

---

## Cuándo usarlo

- cuando existe una práctica repetible ya documentada;
- para testing, revisión, documentación o flujos especializados;
- al querer evitar reinventar instrucciones cada vez.

---

## Resultado esperado

```markdown
## Skill Applied
- skill elegida
- motivo
- alcance de uso
- limitaciones o cautelas
```

---

## Inputs recomendados

- tarea o problema concreto
- skill candidata o dominio asociado
- alcance de uso esperado
- criterio de éxito o mejora buscada

## Output esperado

- skill sugerida o aplicada
- justificación de su elección
- límites de uso o cautelas
- siguiente paso del flujo de trabajo

## Integración sugerida

- activar la skill antes de iniciar la fase sensible
- reutilizarla en tareas repetidas del mismo dominio
- revisar si conviene elevarla a estándar de equipo

## Criterios de calidad

- selección pertinente al problema real
- claridad sobre beneficios y límites
- reducción observable de improvisación
- continuidad con el pipeline SDD

## Anti-patrones a evitar

- cargar skills irrelevantes por defecto
- usar demasiadas skills a la vez sin foco
- omitir validación del resultado obtenido
- confundir skill con reemplazo de criterio técnico

## Ejemplo de solicitud

```text
/gd:skill aplicar skill de testing para este módulo
```

## Siguiente paso

Aplicar la skill junto con `/gd:implement`, `/gd:review` o el comando del pipeline que corresponda.
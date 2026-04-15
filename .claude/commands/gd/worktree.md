# `/gd:worktree` — Organizar Trabajo Paralelo con Git Worktrees

## Propósito
Permitir que varias iniciativas avancen en paralelo con aislamiento limpio de ramas, cambios y validaciones. Útil cuando el equipo o los agentes manejan múltiples changes simultáneamente.

---

## Cuándo usarlo

- varios features o fixes al mismo tiempo;
- necesidad de comparar soluciones sin mezclar cambios;
- separación estricta entre hotfix y desarrollo principal.

---

## Buenas prácticas

- un worktree por objetivo bien definido;
- nombrado consistente por change o ticket;
- no mezclar experimentos y cambios listos para merge;
- validar cada worktree de forma independiente.

---

## Salida esperada

```markdown
## Worktree Plan
- worktree: [nombre]
- rama: [branch]
- objetivo: [change]
- estado: activo | review | cerrado
```

---

## Inputs recomendados

- feature o change que se aislará
- rama de origen o destino
- nivel de paralelismo requerido
- criterio para cerrar el worktree

## Output esperado

- estructura clara de trabajo paralelo
- correspondencia entre worktree y objetivo
- riesgos de mezcla o conflicto identificados
- recomendación de siguiente paso

## Integración sugerida

- usar con iniciativas paralelas o hotfixes urgentes
- validar cada worktree por separado antes de mezclar cambios
- documentar el propósito del árbol temporal si es compartido

## Criterios de calidad

- aislamiento limpio de objetivos
- reducción de conflicto entre tareas
- nombrado consistente y trazable
- continuidad clara con el pipeline SDD

## Anti-patrones a evitar

- abrir worktrees sin propósito claro
- mezclar cambios no relacionados en el mismo árbol
- olvidar limpieza o cierre posterior
- perder trazabilidad entre rama y change

## Ejemplo de solicitud

```text
/gd:worktree preparar espacio separado para hotfix de producción
```

## Siguiente paso

Combinar con `/gd:start`, `/gd:continue` o `/gd:close` según el momento del flujo.
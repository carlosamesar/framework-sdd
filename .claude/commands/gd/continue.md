# `/gd:continue` — Recuperar Sesión y Reanudar Trabajo Sin Pérdida de Contexto

## Propósito
Retomar una tarea previa restaurando el estado de contexto, decisiones técnicas, artefactos abiertos, bloqueos y siguiente paso recomendado. Este comando reduce el coste de “ponerse al día” al volver a una sesión.

---

## Cuándo usarlo

Úsalo cuando:
- vuelves después de una pausa larga;
- cambiaste de rama, módulo o repositorio;
- otro agente dejó trabajo parcialmente completado;
- necesitas validar rápidamente qué hacer antes de seguir editando.

---

## Qué debe revisar

1. change o spec activos;
2. tareas pendientes en el backlog;
3. últimos archivos modificados;
4. estado de validaciones, tests o gates;
5. reportes y evidencias recientes.

---

## Output esperado

```markdown
## Reanudación de sesión
**Contexto detectado**: [change/tarea]
**Estado**: activo | bloqueado | listo para review

### Lo último que se hizo
- [hecho 1]
- [hecho 2]

### Lo pendiente
- [pendiente 1]
- [pendiente 2]

### Acción sugerida ahora
- ejecutar /gd:[siguiente-comando]
```

---

## Reglas de uso

- si no hay contexto suficiente, se debe explicitar qué falta;
- la reanudación debe priorizar hechos verificables;
- si el repositorio cambió desde la última sesión, se debe advertir;
- no continuar implementando sin antes aclarar si hay bloqueos activos.

---

## Integración con el pipeline

Este comando suele anteceder a:
- `/gd:plan`
- `/gd:implement`
- `/gd:review`
- `/gd:verify`

---

## Siguiente paso

Si la sesión reaparece degradada o confusa, ejecutar `/gd:context-health` antes de continuar.
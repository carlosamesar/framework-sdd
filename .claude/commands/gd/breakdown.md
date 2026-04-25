# /gd:breakdown — Desglose de Tareas de Implementación (Nivel 2+)

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:breakdown` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Alias
- `/gd:desglose`
- `/gd:tasks`

---

## Propósito

Convertir el `PLAN.md` en una lista de tareas atómicas, ordenadas y verificables que el agente ejecuta durante `/gd:implement`.

Cada tarea debe ser lo suficientemente pequeña para implementarse y verificarse independientemente. El output de esta fase es el `TASKS.md` del cambio.

---

## Parámetros

```
/gd:breakdown --change=<slug>
/gd:breakdown --change=<slug> --project=<proyecto>
```

---

## Inputs requeridos

- `PLAN.md` completo (output de `/gd:plan`)
- `SPEC.md` con criterios de aceptación finales
- Stack y proyecto heredados

Si falta el plan, **no continuar**: volver a `/gd:plan`.

---

## Proceso

### 1. Descomponer por capa

Siguiendo el orden del plan (BD → backend → frontend → tests → evidencia), crear tareas atómicas:

```
TASK-01: [Nombre corto de la tarea]
  Capa: [bd|backend|frontend|tests|docs]
  Archivos: [lista de archivos que toca]
  Produce: [qué se crea o modifica]
  Criterio de done: [cómo verificar que está lista]
  Depende de: [TASK-XX si tiene prerrequisito]
```

### 2. Clasificar por tipo

| Tipo | Descripción |
|------|-------------|
| `create` | Crear un archivo nuevo desde cero |
| `modify` | Modificar un archivo existente |
| `migrate` | Ejecutar migración de BD |
| `test` | Escribir o corregir tests |
| `docs` | Actualizar documentación o evidencia |

### 3. Asignar criterio de done por tarea

Cada tarea tiene exactamente un criterio de done:
- Build compila sin errores
- Test específico en verde
- Endpoint responde con status esperado
- Componente renderiza sin errores

---

## Reglas de desglose

- **Nunca** mezclar capas en una sola tarea (backend + frontend juntos = incorrecto)
- **Nunca** crear tareas de más de ~2h estimadas sin subdividir
- **Siempre** separar "escribir test" de "hacer pasar el test" (TDD RED → GREEN)
- Las tareas de tests van **antes** que las de implementación si se usa TDD estricto:
  - TASK-XX: escribir test (RED)
  - TASK-XX+1: implementar código hasta pasar (GREEN)
  - TASK-XX+2: refactorizar si aplica (REFACTOR)

---

## Salida Esperada

Archivo `TASKS.md` creado en:
```
openspec/changes/<change-slug>/TASKS.md
```

El directorio fue creado en `/gd:specify`. Verificar su existencia antes de escribir.

Estructura del archivo:

```markdown
# TASKS — <change-slug>

## Resumen
- Total de tareas: N
- Capas afectadas: [bd|backend|frontend|tests|docs]
- Estimación total: [Xh]

## Tareas

### BD
- [ ] TASK-01: [nombre] — [criterio de done]

### Backend
- [ ] TASK-02: [nombre] — [criterio de done]
- [ ] TASK-03: [nombre] — [criterio de done]

### Frontend
- [ ] TASK-04: [nombre] — [criterio de done]

### Tests
- [ ] TASK-05: [nombre] — [criterio de done]

### Docs / Evidencia
- [ ] TASK-06: Actualizar CONSUMO.md
- [ ] TASK-07: Completar EVIDENCE.md

## Change slug
`<change-slug>` — usar en:
  npm run evidence:gate -- --change=<change-slug>
  /gd:implement --change=<change-slug>
```

---

## Gate de Salida

- [ ] Todas las tareas tienen criterio de done claro
- [ ] El orden respeta las dependencias (BD → backend → frontend)
- [ ] Las tareas de tests están separadas de las de implementación
- [ ] El `change-slug` está confirmado

---

## Siguiente paso

```
/gd:implement --change=<change-slug>
```

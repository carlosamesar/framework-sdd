# /gd:plan — Plan Técnico de Implementación (Nivel 2+)

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:plan` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Alias
- `/gd:planificar`
- `/gd:technical-plan`

---

## Propósito

Diseñar el plan técnico de implementación **basado en la SPEC verificada**. Define la arquitectura del cambio, los archivos afectados, las decisiones técnicas y el orden de ejecución — sin escribir código todavía.

Produce el documento `PLAN.md` del cambio, que guía a `/gd:breakdown` y `/gd:implement`.

---

## Parámetros

```
/gd:plan --change=<slug>
/gd:plan --change=<slug> --project=<proyecto>
```

---

## Inputs requeridos

- `SPEC.md` completo y verificado (output de `/gd:specify` + `/gd:clarify`)
- Stack y proyecto heredados de `/gd:start`
- Nivel de complejidad (2, 3 o 4)

Si la SPEC no está completa, **no continuar**: volver a `/gd:specify` o `/gd:clarify`.

---

## Proceso

### 1. Identificar el patrón espejo

Buscar en el proyecto real el componente, lambda, servicio o módulo más cercano al cambio propuesto. El patrón espejo define:
- Estructura de carpetas a seguir
- Convenciones de naming
- Patrones de código reutilizables (guards, decoradores, facades, etc.)

Documentar explícitamente:
- **Patrón espejo elegido**: ruta real + justificación
- **Diferencias respecto al nuevo cambio**: qué se adapta vs. qué se copia

### 2. Mapear archivos afectados

Listar todos los archivos que se van a:
- **Crear** (nuevos)
- **Modificar** (existentes)
- **Eliminar** (si aplica)

Para cada archivo: ruta completa + propósito del cambio.

### 3. Definir decisiones técnicas

Para cada decisión no trivial, documentar:

```
DEC-01: [Decisión]
  Opción elegida: [A]
  Alternativa descartada: [B]
  Razón: [por qué A es mejor para este caso]
```

Ejemplos de decisiones típicas:
- ¿Signal o BehaviorSubject?
- ¿Lambda nueva o extender existente?
- ¿Migración de BD o compatible sin migración?
- ¿PUT o PATCH para actualización parcial?

### 4. Definir orden de implementación

Secuencia estricta para cambios multi-capa:

```
1. BD (migraciones o schema si aplica)
2. Backend (lambda / servicio NestJS)
3. Frontend (componente / feature)
4. Tests (unitarios, integración, E2E)
5. Evidencia (CONSUMO.md, EVIDENCE.md)
```

Si el cambio es de una sola capa, declararlo y ordenar igualmente las tareas en esa capa.

### 5. Identificar riesgos

Señalar qué puede salir mal:
- Dependencias de terceros (APIs externas, servicios AWS)
- Compatibilidad con datos existentes
- Impacto en otros módulos o tenants
- Necesidad de rollback

---

## Salida Esperada

Archivo `PLAN.md` creado en:
```
openspec/changes/<change-slug>/PLAN.md
```

Si el directorio no existe, se habrá creado en `/gd:specify`. Verificar su existencia antes de escribir.

Estructura del archivo:

```markdown
# PLAN — <change-slug>

## Stack / Proyecto
- Stack: [frontend|backend|fullstack]
- Proyecto: [ruta real]
- Nivel: [2|3|4]

## Patrón espejo
- Ruta: [ruta del patrón en el repo]
- Adaptar: [qué se modifica respecto al patrón]

## Archivos afectados
| Archivo | Acción | Propósito |
|---------|--------|-----------|
| path/to/file.ts | CREAR | ... |
| path/to/other.ts | MODIFICAR | ... |

## Decisiones técnicas
- DEC-01: ...
- DEC-02: ...

## Orden de implementación
1. ...
2. ...

## Riesgos
- [Riesgo 1] → Mitigación: [...]
- [Riesgo 2] → Mitigación: [...]

## Change slug confirmado
`<change-slug>` — propagar a todos los comandos siguientes
```

---

## Gate de Salida

- [ ] Patrón espejo identificado con ruta real
- [ ] Todos los archivos afectados mapeados
- [ ] Decisiones técnicas documentadas
- [ ] Orden de implementación definido
- [ ] Riesgos listados con mitigación

---

## Siguiente paso

```
/gd:breakdown --change=<change-slug>
```

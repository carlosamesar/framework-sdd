# /gd:clarify — Clarificación de Dudas y Ambigüedades (Nivel 2+)

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:clarify` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Alias
- `/gd:aclarar`
- `/gd:clarificar`

---

## Propósito

Resolver dudas, ambigüedades o conflictos detectados durante `/gd:specify` **antes de comprometer un plan técnico**.

Esta fase es corta y enfocada: no reformula la SPEC completa, solo cierra los puntos bloqueantes. Si no hay ambigüedades, se puede omitir con declaración explícita.

---

## Parámetros

```
/gd:clarify --change=<slug>
/gd:clarify --change=<slug> [pregunta o duda específica]
```

El `--change=<slug>` es obligatorio para vincular las aclaraciones al cambio correcto.

---

## Cuándo es obligatorio

Ejecutar siempre que en `/gd:specify` se haya detectado alguna de estas condiciones:

- Un criterio de aceptación no pudo escribirse sin asumir algo
- El contrato de API tiene opciones (¿`PUT` o `PATCH`? ¿query param o body?)
- Una regla de negocio depende de un comportamiento del sistema no documentado
- Un borde no tiene respuesta clara (¿error silencioso o visible al usuario?)
- El alcance puede interpretarse de más de una manera válida

---

## Proceso

### 1. Listar dudas abiertas

Formato claro por ítem:

```
DUDA-01: [Pregunta concreta]
  Contexto: [Por qué surgió esta duda]
  Opciones: [A] ... / [B] ...
  Bloquea: [AC-XX / contrato / regla]
```

### 2. Resolver con el usuario o con evidencia

Para cada duda:
- Consultar al usuario si la respuesta no está en el código, docs o contexto actual
- Si la respuesta puede inferirse del código real (patrón existente), resolverla sin preguntar
- Documentar la decisión tomada y el criterio

### 3. Actualizar la SPEC

Una vez resueltas todas las dudas, actualizar `SPEC.md` con:
- Criterios corregidos o añadidos
- Contratos ajustados
- Reglas clarificadas

---

## Salida Esperada

```markdown
# CLARIFY — <change-slug>

## Dudas resueltas
- DUDA-01: [Pregunta] → Decisión: [respuesta] (fuente: [usuario / código / docs])
- DUDA-02: [Pregunta] → Decisión: [respuesta]

## SPEC actualizada
[Sección o diff de los cambios aplicados a SPEC.md]

## Estado
✅ Sin ambigüedades bloqueantes — listo para /gd:plan
```

---

## Si no hay dudas

Declarar explícitamente:

```
CLARIFY — <change-slug>: Sin ambigüedades detectadas. SPEC completa.
→ Avanzando a /gd:plan --change=<change-slug>
```

---

## Gate de Salida

- [ ] Todas las dudas tienen respuesta documentada
- [ ] La SPEC está actualizada y consistente
- [ ] No quedan suposiciones sin validar

---

## Siguiente paso

```
/gd:plan --change=<change-slug>
```

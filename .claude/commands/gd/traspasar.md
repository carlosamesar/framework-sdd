# `/gd:traspasar` — Crear un Handover Claro para Otra Sesión o Agente

## Propósito
Preparar una transferencia ordenada del trabajo actual para que otro agente o una futura sesión pueda continuar sin perder tiempo ni contexto.

---

## Qué debe incluir

- estado actual;
- qué ya fue completado;
- bloqueos o riesgos;
- archivos o artefactos relevantes;
- siguiente paso recomendado.

---

## Formato esperado

```markdown
## Handover
- contexto
- entregables hechos
- pendientes
- riesgos
- próxima acción
```

---

## Inputs recomendados

- estado actual del trabajo
- entregables o cambios ya realizados
- bloqueos, riesgos y dependencias
- prioridad del siguiente paso

## Output esperado

- handover claro y reutilizable
- contexto suficiente para otra sesión
- pendientes ordenados por prioridad
- próxima acción explícita para el receptor

## Integración sugerida

- usar antes de pausas largas o delegaciones
- complementar con evidencias o enlaces relevantes
- actualizar el handover si el estado cambia antes del cierre

## Criterios de calidad

- transferibilidad sin conversación adicional
- foco en hechos y no solo en intención
- visibilidad de riesgos y decisiones tomadas
- continuidad operativa inmediata para quien recibe

## Anti-patrones a evitar

- dejar un handover vago o excesivamente largo
- omitir bloqueos reales
- no indicar dónde quedó el trabajo
- delegar sin proponer siguiente comando

## Ejemplo de solicitud

```text
/gd:traspasar dejar relevo del change activo para mañana
```

## Siguiente paso

La sesión receptora debe retomar con `/gd:traspaso` o `/gd:continue`.
# `/gd:archivar` — Alias Operativo de `/gd:archive`

## Propósito
Permitir el cierre y archivo de un change usando una entrada natural en español sin perder la disciplina del pipeline formal.

---

## Redirección funcional

Este comando remite a `/gd:archive`.
Debe usarse cuando el trabajo ya fue verificado, consolidado y está listo para archivarse con trazabilidad completa.

---

## Qué esperar

- sincronización de artefactos y estado final;
- cierre documental del change;
- preservación del historial para futuras consultas.

---

## Inputs recomendados

- change o iniciativa ya verificada
- evidencia de cierre o aceptación
- pendientes residuales si los hubiera
- artefactos o documentos a consolidar

## Output esperado

- estado final claro del change
- cierre documental consistente
- trazabilidad de lo archivado
- siguiente movimiento operativo definido

## Integración sugerida

- confirmar verify PASS antes del archivo
- enlazar changelog, audit trail o evidencia final
- dejar visible cualquier deuda técnica aceptada

## Criterios de calidad

- archivo con contexto suficiente para futura consulta
- historial entendible sin depender de memoria implícita
- decisión de cierre sustentada por evidencia
- no perder relación entre spec, tasks y resultados

## Anti-patrones a evitar

- archivar trabajo aún bloqueado
- omitir riesgos conocidos del cierre
- cerrar sin criterio de aceptación explícito
- dejar al siguiente agente sin contexto

## Ejemplo de solicitud

```text
/gd:archivar change de automatización ya validado
```

## Siguiente paso

Tras archivar, continuar con el siguiente change o cerrar sesión con `/gd:close`.
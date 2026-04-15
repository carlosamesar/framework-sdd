# `/gd:traspaso` — Recibir y Reactivar Contexto desde un Handover Existente

## Propósito
Consumir un documento de traspaso y restaurar rápidamente el foco operativo de una tarea delegada o pausada.

---

## Qué debe confirmar

- objetivo vigente;
- estado real del trabajo;
- bloqueos heredados;
- siguiente acción útil y verificable.

---

## Resultado esperado

```markdown
## Handover Intake
- contexto recibido
- validación del estado
- riesgos detectados
- acción inmediata sugerida
```

---

## Inputs recomendados

- documento de handover recibido
- contexto del repositorio o change actual
- bloqueos ya conocidos
- criterio para considerar la toma de contexto exitosa

## Output esperado

- síntesis del contexto heredado
- confirmación de qué sigue abierto
- riesgos heredados visibles
- acción inmediata sugerida

## Integración sugerida

- usar al inicio de una sesión delegada
- contrastar el handover con el estado real del repo
- actualizar el cierre si cambia la situación recibida

## Criterios de calidad

- recuperación rápida y fiel del estado
- mínimo tiempo perdido por re-contextualización
- claridad sobre pendientes y prioridades
- continuidad efectiva con el pipeline actual

## Anti-patrones a evitar

- asumir que el handover sigue vigente sin verificarlo
- ignorar diferencias entre documento y repo real
- reabrir decisiones ya resueltas sin motivo
- continuar implementando sin validar el contexto

## Ejemplo de solicitud

```text
/gd:traspaso retomar trabajo delegado sobre ticket runner
```

## Siguiente paso

Continuar con `/gd:continue`, `/gd:plan` o `/gd:implement` según el estado del handover.
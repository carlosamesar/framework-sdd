# `/gd:guardian` — Bloquear Cambios que Rompen la SPEC, Seguridad o Arquitectura

## Propósito
Actuar como barrera de seguridad y coherencia del framework. Su misión es detectar cambios que no deberían avanzar por contradecir la especificación, romper invariantes o introducir riesgo alto.

---

## Qué debe bloquear

- desviaciones severas respecto de la spec;
- violaciones multi-tenant o de seguridad;
- cambios incompatibles sin migración;
- deuda técnica crítica oculta.

---

## Salida esperada

```markdown
## Guardian Report
**Veredicto**: allow | conditional | block

### Motivos
- [motivo 1]
- [motivo 2]

### Acción requerida
- [corrección necesaria]
```

---

## Regla

Si el riesgo es estructural o de seguridad, el resultado debe ser BLOCK hasta corregirlo.

## Inputs recomendados

- cambio o diff bajo inspección
- contexto de arquitectura o seguridad afectado
- políticas o invariantes que no se pueden romper
- criterio de bloqueo esperado

## Output esperado

- veredicto allow, conditional o block
- motivo del bloqueo o aprobación
- acción correctiva priorizada
- evidencia del riesgo detectado

## Integración sugerida

- usar como barrera antes de release o merge sensible
- complementarlo con security-audit y verify
- registrar el bloqueo para trazabilidad si es crítico

## Criterios de calidad

- decisión firme y bien justificada
- foco en riesgo real, no preferencia estética
- claridad sobre qué debe cambiar para desbloquear
- alineación con spec y arquitectura del proyecto

## Anti-patrones a evitar

- permitir cambios críticos por urgencia
- bloquear sin explicar el riesgo concreto
- mezclar observaciones menores con defectos severos
- no dejar evidencia del veredicto

## Ejemplo de solicitud

```text
/gd:guardian revisar cambio que toca autenticación multi-tenant
```

---

## Siguiente paso

Combinar con `/gd:gate`, `/gd:review` y `/gd:verify`.
# `/gd:data-policy` — Revisar Cumplimiento de Políticas de Datos y Privacidad

## Propósito
Verificar que el sistema trate los datos conforme a políticas internas y obligaciones regulatorias: minimización, acceso restringido, retención y protección de información sensible.

---

## Qué debe revisar

- exposición de datos sensibles;
- logs con información personal;
- almacenamiento o tránsito inseguro;
- reglas de acceso y retención.

---

## Veredicto esperado

```markdown
## Data Policy Review
**Estado**: compliant | warning | fail
- hallazgos
- impacto
- corrección recomendada
```

---

## Inputs recomendados

- flujo o módulo con datos sensibles
- tipo de información tratada
- contexto regulatorio o interno aplicable
- criterio de cumplimiento esperado

## Output esperado

- hallazgos de privacidad o cumplimiento
- severidad e impacto del riesgo
- corrección sugerida
- decisión de continuar o bloquear

## Integración sugerida

- usar antes de release en cambios sensibles
- combinar con guardian y security-audit cuando aplique
- documentar cualquier excepción aceptada

## Criterios de calidad

- foco en exposición real de datos
- riesgos explicados de forma accionable
- consistencia con políticas corporativas
- trazabilidad suficiente para auditoría

## Anti-patrones a evitar

- revisar solo almacenamiento y no logs o tránsito
- minimizar exposición por ser entorno interno
- omitir validación de retención y acceso
- aceptar excepciones sin dejar rastro

## Ejemplo de solicitud

```text
/gd:data-policy revisar manejo de datos personales en onboarding
```

## Siguiente paso

Si hay incumplimientos, bloquear con `/gd:guardian` y volver a implementación.
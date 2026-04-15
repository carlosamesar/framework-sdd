# `/gd:incorporate` — Integrar Cambios Externos sin Perder Control de Calidad

## Propósito
Guiar la incorporación de trabajo proveniente de otras ramas, agentes o fuentes manteniendo coherencia con la spec, el historial y los gates del proyecto.

---

## Buenas prácticas

- entender el alcance antes de mezclar cambios;
- preferir integración pequeña y frecuente;
- revalidar tests y contratos tras incorporar;
- documentar conflictos y resoluciones relevantes.

---

## Salida esperada

```markdown
## Incorporation Result
- origen del cambio
- conflictos detectados
- resolución aplicada
- validaciones requeridas
```

---

## Inputs recomendados

- rama o fuente de origen
- objetivo de la incorporación
- conflictos previsibles
- criterios de validación posteriores

## Output esperado

- integración realizada o plan de resolución
- conflictos importantes visibilizados
- riesgos tras la mezcla de cambios
- siguiente verificación recomendada

## Integración sugerida

- preferir incorporaciones pequeñas y auditables
- revisar contratos y tests luego del merge o rebase
- dejar trazabilidad de conflictos complejos

## Criterios de calidad

- coherencia entre ramas y spec
- resolución clara de conflictos
- ausencia de cambios accidentales colaterales
- preparación adecuada para review posterior

## Anti-patrones a evitar

- incorporar sin entender el alcance ajeno
- resolver conflictos “a ciegas”
- mezclar deuda previa con la integración actual
- omitir verificación posterior al merge

## Ejemplo de solicitud

```text
/gd:incorporate traer hotfix de validación al flujo actual
```

## Siguiente paso

Después de incorporar, ejecutar `/gd:review` y `/gd:verify`.
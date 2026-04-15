# `/gd:session` — Analizar la Sesión Actual o Histórica para Mejorar el Flujo

## Propósito
Revisar cómo se ha desarrollado una sesión de trabajo: foco, cambios de rumbo, eficiencia, pérdidas de contexto, bloqueos repetidos y momentos de mayor productividad.

---

## Qué busca detectar

- interrupciones frecuentes;
- decisiones reabiertas varias veces;
- tareas sin cierre claro;
- tiempo invertido en depuración vs entrega;
- patrones útiles para futuras sesiones.

---

## Salida esperada

```markdown
## Session Analysis
**Diagnóstico**: eficiente | dispersa | bloqueada

### Patrones observados
- [patrón 1]
- [patrón 2]

### Mejora sugerida
- [acción recomendada]
```

---

## Inputs recomendados

- tramo de sesión a analizar
- objetivo actual del trabajo
- síntomas de pérdida de foco o fricción
- criterio de mejora deseado

## Output esperado

- diagnóstico claro de la sesión
- patrones útiles o problemáticos detectados
- causas probables de ineficiencia
- siguiente acción recomendada

## Integración sugerida

- usar cuando el trabajo se vuelve errático
- combinar con context-health para confirmar riesgo
- cerrar o reencauzar la sesión según el hallazgo

## Criterios de calidad

- foco en patrones observables
- recomendaciones accionables y simples
- utilidad para mejorar la siguiente iteración
- lectura fiel del estado real de la sesión

## Anti-patrones a evitar

- convertir el análisis en opinión subjetiva pura
- olvidar hechos concretos del flujo reciente
- diagnosticar sin revisar el contexto real
- no traducir hallazgos en una acción siguiente

## Ejemplo de solicitud

```text
/gd:session analizar por qué la tarea perdió foco hoy
```

## Siguiente paso

Si la sesión está degradada, usar `/gd:context-health` o `/gd:close`.
# `/gd:tracing` — Trazabilidad de Decisiones, Herramientas y Ejecución

## Propósito
Inspeccionar cómo se ejecutó un flujo del framework: qué decisiones tomó el agente, qué comandos corrió, qué archivos tocó y dónde surgió un fallo o una desviación.

---

## Cuándo usarlo

- al depurar automatizaciones complejas;
- cuando una tarea cambió de rumbo sin explicación clara;
- para reconstruir evidencia técnica o auditoría;
- al investigar fallos intermitentes.

---

## Qué debe mostrar

- secuencia de pasos ejecutados;
- entradas y salidas relevantes;
- herramientas o integraciones usadas;
- errores, retries y fallback aplicados;
- decisión de continuación o bloqueo.

---

## Output esperado

```markdown
## Trace Summary
**Flujo**: [nombre]
**Estado**: success | partial | failed

### Eventos clave
1. [evento]
2. [evento]

### Punto de fallo o riesgo
- [detalle]
```

---

## Reglas

- la trazabilidad debe priorizar hechos verificables;
- si hay datos sensibles, deben redactarse;
- el objetivo no es solo “loggear”, sino explicar el flujo.

---

## Inputs recomendados

- flujo o ejecución a rastrear
- síntoma o anomalía observada
- ventana temporal o fase sospechosa
- nivel de detalle necesario

## Output esperado

- secuencia explicada de eventos clave
- punto de fallo o desvío identificado
- evidencia útil para depuración
- siguiente intervención recomendada

## Integración sugerida

- usar junto con audit-trail en problemas complejos
- conectar hallazgos con retries, fallbacks o bloqueos
- sintetizar la traza para futuras investigaciones similares

## Criterios de calidad

- hechos verificables sobre suposiciones
- claridad causal entre eventos y resultado
- foco en lo que ayuda a resolver el problema
- información suficiente sin ruido excesivo

## Anti-patrones a evitar

- acumular logs sin interpretación
- rastrear todo sin hipótesis mínima
- no señalar el punto útil para actuar
- exponer datos sensibles en el reporte

## Ejemplo de solicitud

```text
/gd:tracing investigar por qué el orquestador tomó la ruta fallback
```

## Siguiente paso

Si el tracing muestra una desviación crítica, combinar con `/gd:audit-trail` y `/gd:context-health`.
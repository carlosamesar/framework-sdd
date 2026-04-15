# `/gd:threshold` — Definir Umbrales de Calidad, Cobertura y Rendimiento

## Propósito
Establecer los límites mínimos aceptables para permitir avance en el pipeline: cobertura, errores, latencia, deuda técnica o porcentaje de gates cumplidos.

---

## Casos de uso

- fijar cobertura mínima por módulo;
- limitar regresiones de performance;
- hacer más estricta una puerta de release;
- formalizar criterios de PASS o FAIL.

---

## Ejemplos

```bash
/gd:threshold --coverage 85
/gd:threshold --latency 250ms
/gd:threshold --max-critical-issues 0
```

---

## Salida esperada

```markdown
## Threshold Policy
- coverage >= 85%
- critical issues = 0
- verify = PASS
- smoke = requerido
```

---

## Reglas

- los umbrales deben ser realistas pero exigentes;
- no bajar thresholds solo para “hacer pasar” el cambio;
- si un threshold cambia, debe quedar documentado y justificado.

---

## Inputs recomendados

- tipo de umbral que se quiere fijar
- contexto del módulo o entorno
- severidad aceptable del riesgo
- criterio para PASS o FAIL

## Output esperado

- política de thresholds entendible
- límites medibles y auditables
- impacto operativo de cada umbral
- siguiente paso sugerido para enforcement

## Integración sugerida

- alinear con gate, metrics y verify
- revisar periódicamente si el umbral sigue siendo útil
- documentar cualquier excepción relevante

## Criterios de calidad

- thresholds exigentes pero realistas
- métrica claramente verificable
- coherencia con el riesgo del dominio
- utilidad para detener o permitir avance

## Anti-patrones a evitar

- bajar el umbral para “pasar rápido”
- definir métricas imposibles de comprobar
- usar un mismo threshold para todo sin matices
- olvidar revisar si siguen vigentes

## Ejemplo de solicitud

```text
/gd:threshold fijar cobertura mínima de 85 para el módulo crítico
```

## Siguiente paso

Usar junto con `/gd:gate`, `/gd:metrics` y `/gd:release`.
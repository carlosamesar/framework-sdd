# `/gd:context-health` — Diagnóstico de Salud del Contexto y la Memoria

## Propósito
Evaluar si el contexto activo del agente sigue siendo suficiente, consistente y útil para continuar trabajando sin errores por pérdida de información, compactación o mezcla de temas.

---

## Cuándo usarlo

Úsalo cuando:
- la sesión ya lleva mucho tiempo;
- hubo múltiples cambios de objetivo;
- notas respuestas repetitivas o contradictorias;
- el agente parece olvidar decisiones recientes;
- se hizo una compactación o cambio fuerte de contexto.

---

## Qué analiza

1. foco actual de la tarea;
2. coherencia entre plan, backlog y archivos recientes;
3. cantidad de temas paralelos abiertos;
4. estado de memoria persistente y notas de sesión;
5. necesidad de resumir, compactar o reiniciar contexto.

---

## Señales de alerta

- respuestas que ignoran el requerimiento actual;
- referencias a archivos o tareas equivocadas;
- inconsistencia entre plan y ejecución;
- pérdida de decisiones clave o de bloqueos ya identificados;
- repetición innecesaria de exploraciones anteriores.

---

## Formato de salida

```markdown
## Context Health Report
**Estado**: saludable | atención | crítico

### Hallazgos
- [hallazgo 1]
- [hallazgo 2]

### Riesgos
- [riesgo 1]

### Acción recomendada
- continuar normal
- resumir sesión
- crear handover
- reiniciar foco del trabajo
```

---

## Acciones correctivas sugeridas

- resumir el estado de la sesión;
- reducir objetivos activos simultáneos;
- registrar decisiones en memoria o auditoría;
- cerrar ramas de análisis que ya no aportan valor.

---

## Siguiente paso

Si el estado es crítico, usar `/gd:close` y relanzar con `/gd:continue` o `/gd:start`.
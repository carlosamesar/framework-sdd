# `/gd:especificar` — Alias Operativo de `/gd:specify`

## Propósito
Permitir iniciar la fase de especificación en español manteniendo el mismo objetivo: convertir una necesidad difusa en una spec clara, verificable y trazable.

---

## Redirección funcional

Este comando remite a `/gd:specify`.
Debe usarse cuando aún no existe una definición suficientemente precisa del cambio.

---

## Qué esperar

- escenarios y reglas del comportamiento esperado;
- alcance y prioridades iniciales;
- base para tareas y validación posterior.

---

## Inputs recomendados

- necesidad de negocio o problema inicial
- alcance preliminar del cambio
- actores o módulos impactados
- restricciones conocidas del dominio

## Output esperado

- escenarios o reglas claramente expresados
- límites del alcance inicial
- supuestos y dudas visibles
- base útil para clarificar y planificar

## Integración sugerida

- convertir ideas difusas en entregables verificables
- conectar con tasks y criterio de aceptación
- mantener trazabilidad entre necesidad y spec

## Criterios de calidad

- lenguaje preciso y medible
- mínima ambigüedad posible
- foco en comportamiento esperado
- utilidad inmediata para el pipeline SDD

## Anti-patrones a evitar

- especificar demasiado tarde
- redactar metas vagas o no verificables
- mezclar solución técnica con requisito de negocio
- omitir restricciones relevantes

## Ejemplo de solicitud

```text
/gd:especificar flujo de aprobación de gastos multi-tenant
```

## Siguiente paso

Después de especificar, seguir con `/gd:clarify` o `/gd:plan`.
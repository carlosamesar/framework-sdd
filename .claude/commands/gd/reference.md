# `/gd:reference` — Consultar Fuentes Canónicas, Patrones y Guías del Framework

## Propósito
Centralizar la consulta de documentación confiable para evitar decisiones improvisadas. Este comando ayuda a localizar la fuente correcta antes de implementar, revisar o liberar cambios.

---

## Referencias típicas

- AGENTS y reglas de hierro;
- patrones maduros de Lambdas y NestJS;
- specs activas y cambios OpenSpec;
- documentación de integración, testing y despliegue.

---

## Cuándo usarlo

- cuando hay dudas de patrón o convención;
- antes de crear una pieza nueva del framework;
- al revisar si una implementación está alineada con lo ya establecido.

---

## Output esperado

```markdown
## Reference Pack
- fuente principal
- patrón recomendado
- archivo o módulo de ejemplo
- advertencias relevantes
```

---

## Regla

Siempre preferir una referencia madura existente antes de inventar estructura nueva.

## Inputs recomendados

- decisión técnica a sustentar
- tipo de patrón buscado
- módulo o stack implicado
- nivel de autoridad requerido para la referencia

## Output esperado

- fuente principal recomendada
- patrón o ejemplo aplicable
- advertencias relevantes del contexto
- siguiente acción sugerida

## Integración sugerida

- consultar antes de crear soluciones nuevas o excepciones
- enlazar con RAG si hace falta explorar antecedentes
- citar la referencia si impacta decisiones de arquitectura

## Criterios de calidad

- prioridad a fuentes canónicas del repositorio
- hallazgo útil y directamente aplicable
- claridad sobre diferencias con el caso actual
- soporte a decisiones más consistentes

## Anti-patrones a evitar

- elegir referencias por conveniencia y no por madurez
- ignorar patrones ya validados por el equipo
- citar documentación obsoleta sin advertirlo
- inventar estructura sin verificar antecedentes

## Ejemplo de solicitud

```text
/gd:reference patrón maduro para guards en NestJS multi-tenant
```

---

## Siguiente paso

Luego de consultar referencias, continuar con `/gd:plan`, `/gd:implement` o `/gd:review`.
# `/gd:code-rag` — Buscar Patrones de Código y Referencias Técnicas Reutilizables

## Propósito
Localizar implementaciones maduras, estructuras repetibles y fragmentos de código que sirvan como base segura para una nueva solución.

---

## Cuándo usarlo

- antes de crear una implementación desde cero;
- al revisar cómo se resolvió un problema similar;
- para evitar divergencia entre módulos equivalentes.

---

## Resultado esperado

```markdown
## Code RAG Result
- archivos o módulos relevantes
- patrón recomendado
- diferencias a considerar
- decisión sugerida
```

---

## Inputs recomendados

- patrón o problema que se desea localizar
- módulo o dominio donde buscar
- criterios de similitud relevantes
- contexto técnico mínimo del cambio

## Output esperado

- referencias de código útiles
- patrón recomendado para reutilizar
- diferencias clave a considerar
- recomendación práctica de adopción

## Integración sugerida

- usar antes de implementar desde cero
- contrastar el hallazgo con la spec activa
- enlazar con review si el patrón impacta arquitectura

## Criterios de calidad

- referencias concretas y reutilizables
- explicación de por qué aplica el patrón
- advertencias sobre diferencias sensibles
- trazabilidad entre búsqueda y decisión

## Anti-patrones a evitar

- copiar sin entender el contexto original
- asumir equivalencia total entre módulos
- ignorar restricciones del dominio actual
- usar referencias viejas sin revisar compatibilidad

## Ejemplo de solicitud

```text
/gd:code-rag patrón maduro para validación JWT multi-tenant
```

## Siguiente paso

Usar el hallazgo como base para `/gd:implement` o `/gd:review`.
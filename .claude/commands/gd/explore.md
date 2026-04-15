# /gd:explore — Explorar Codebase Antes de Proponer Cambios

## Propósito
Explorar el código base para entender patrones existentes, encontrar referencias y entender el contexto antes de proponer cambios o nuevas implementaciones.

## Cómo Funciona

1. **Búsqueda de Patrones**: Busca patrones de diseño, convenciones de código y estructuras existentes
2. **Análisis de Dependencias**: Identifica dependencias entre módulos y componentes
3. **Localización de Referencias**: Encuentra archivos relacionados con el tema de exploración
4. **Métricas de Código**: Calcula líneas de código, complejidad y otros indicadores
5. **Mapa de Relaciones**: Visualiza cómo se relacionan los diferentes componentes

## Tipos de Exploración

- **Por Patrón**: Busca implementaciones de patrones específicos (Singleton, Factory, etc.)
- **Por Tecnología**: Encuentra uso de librerías, frameworks o tecnologías específicas
- **Por Dominio**: Explora módulos relacionados con un dominio de negocio específico
- **Por Complejidad**: Identifica áreas de alto riesgo o complejidad técnica
- **Por Cambios Recientes**: Ve qué ha cambiado recientemente en el código

## Uso

```
/gd:explore [tema o patrón a explorar]
```

## Ejemplos

```
/gd:explore patrones de autenticación
/gd:explore uso de Redis en microservicios
/gd:explore módulos de contabilidad
/gd:explore complejidad en lambdas de transacciones
```

## Alias
- `/gd:explorar`

## Output

El comando proporciona:
- Lista de archivos relevantes encontrados
- Patrones de código identificados
- Métricas de complejidad y mantenimiento
- Sugerencias de refactorización o mejora
- Referencias a documentación existente

## Siguiente Paso
Después de explorar, usar los hallazgos para informar la especificación con `/gd:specify` o planificar los cambios con `/gd:plan`. No usar `/gd:propose`, porque no forma parte del catálogo actual.
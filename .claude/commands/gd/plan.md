# /gd:plan — Generar Blueprint Técnico

## Propósito
Crear un blueprint técnico completo con arquitectura, contratos API y esquema final basado en la especificación clarificada.

## Cómo Funciona

1. **Análisis de SPEC**: Lee la especificación Gherkin para extraer requerimientos
2. **Diseño de Arquitectura**: Define componentes, módulos y sus relaciones
3. **Contratos API**: Genera especificaciones REST/GraphQL con endpoints
4. **Esquema de BD**: Define modelo de datos con tablas y relaciones
5. **Documentación Técnica**: Crea ADRs y documentación de componentes

## Componentes del Blueprint

```
- Architecture: Diagramas de componentes y capas
- API Contracts: Endpoints, métodos, request/response schemas
- Data Model: Entidades, relaciones, índices
- Tech Stack: Tecnologías y versiones recomendadas
- Integration Points: Conexiones externas y dependencias
- Deployment Architecture: Estrategia de despliegue
```

## Uso

```
/gd:plan
```

## Alias
- `/gd:tech-plan`
- `/gd:diseñar`
- `/gd:planificar-tecnico`

## Salida estructurada (agentes ReAct)

Opcional: JSON según `openspec/templates/react-outputs/plan.output.schema.json` (contratos API, riesgos, regla de tenant).

## Siguiente Paso
Después del plan, usar `/gd:breakdown` para dividir en tareas concretas.
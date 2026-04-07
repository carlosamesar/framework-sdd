# /gd:breakdown — Dividir Plan en Tareas Concretas

## Propósito
Dividir el blueprint técnico en tareas implementables con orden de ejecución y criterios de aceptación claros.

## Cómo Funciona

1. **Análisis del Blueprint**: Examina la arquitectura y especificaciones técnicas
2. **Identificación de Tareas**: Extrae tareas individuales de implementación
3. **Dependencias**: Mapea relaciones de dependencia entre tareas
4. **Orden de Ejecución**: Determina secuencia óptima (paralelo/secuencial)
5. **Criterios de Aceptación**: Define condiciones de done para cada tarea

## Formato de Tarea

```markdown
### [ID] Nombre de la Tarea
**Objetivo**: Qué se va a implementar
**Entrada**: Inputs requeridos
**Salida**: Outputs esperados
**Dependencias**: Tareas previas requeridas
**Criterios de Aceptación**:
- ✅ Condición 1
- ✅ Condición 2
**Tiempo Estimado**: HH:mm
```

## Uso

```
/gd:breakdown
```

## Alias
- `/gd:desglosar`

## Siguiente Paso
Después del breakdown, ejecutar `/gd:implement` para comenzar la fase de desarrollo.
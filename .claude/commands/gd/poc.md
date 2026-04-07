# /gd:poc — Proof of Concept con Timebox y Criterios Claros

## Propósito
Ejecutar un Proof of Concept (PoC) timeboxed para validar la factibilidad técnica de una idea o enfoque antes de comprometerse con una implementación completa.

## Cómo Funciona

1. **Definición de Hipótesis**: Establece claramente qué se quiere validar o invalidar
2. **Timebox Estricto**: Limita el esfuerzo a un período definido (típicamente 2-4 horas)
3. **Criterios de Éxito**: Define métricas objetivas para determinar si el PoC tuvo éxito
4. **Ejecución Focalizada**: Implementa solo lo mínimo necesario para probar la hipótesis
5. **Evaluación de Resultados**: Analiza los resultados contra los criterios de éxito
6. **Veredicto**: Decide continuar, pivotar o abandonar basado en evidencia

## Estructura de un PoC

```
Hipótesis: [Declaración clara de qué se quiere probar]
Timebox: [Duración límite, ej: 4 horas]
Recursos: [Qué está disponible para usar]
Criterios de Éxito:
  - [Métrica objetiva 1]
  - [Métrica objetiva 2]
  - [Condición de validación]
Procedimiento:
  - Paso 1: [Acción específica]
  - Paso 2: [Acción específica]
  - ...
Resultado: [Qué se obtuvo vs lo esperado]
Veredicto: [CONTINUAR / PIVOTAR / ABANDONAR]
Aprendizaje: [Qué se aprendió sin importar el resultado]
```

## Salida del Comando

- **Hipótesis Probada**: Declaración clara de qué se validó
- **Evidencia Recopilada**: Datos, métricas y observaciones recopiladas
- **Criterios de Éxito Evaluados**: Cuáles se cumplieron y cuáles no
- **Veredicto Formal**: Decisión basada en evidencia (CONTINUAR/PIVOTAR/ABANDONAR)
- **Lecciones Aprendidas**: Insights valiosos independientemente del resultado
- **Recomendaciones**: Próximos pasos sugeridos basado en el veredicto

## Uso

```
/gd:poc [descripción de la hipótesis a validar]
```

## Alias
- `/gd:proof-of-concept`

## Parámetros Opcionales

- `--time=horas`: Especificar duración del timebox (por defecto: 4)
- `--resources=lista`: Listar recursos disponibles o limitaciones
- `--criteria=lista`: Definir criterios de éxito personalizados
- `--documentar`: Generar documentación formal del PoC para archivo

## Ejemplos

```
/gd:poc Usar GraphQL en lugar de REST para el módulo de reportes
/gd:poc Implementar cache con Redis para consultas frecuentes de catálogo
/gd:poc Validar factibilidad de migración de PostgreSQL a MongoDB
```

## Criterios de Éxito Típicos

- **Técnicos**: La solución funciona como se esperaba en condiciones de prueba
- **De Rendimiento**: Cumple con benchmarks de velocidad o consumo de recursos
- **De Integración**: Se integra correctamente con sistemas existentes
- **De Usabilidad**: Usuarios objetivo pueden completar tareas clave
- **De Escalabilidad**: Muestra potencial para manejar carga esperada

## Siguiente Paso

Según el veredicto:
- **CONTINUAR**: Proceder con especificación completa usando `/gd:specify`
- **PIVOTAR**: Reformular hipótesis y ejecutar nuevo PoC con `/gd:poc`
- **ABANDONAR**: Documentar aprendizaje y cerrar la línea de investigación
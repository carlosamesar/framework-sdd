# /gd:estimate — Estimar con 4 Modelos: FP, COCOMO, Poker, Historical

## Propósito
Generar estimaciones de esfuerzo y tiempo usando cuatro modelos diferentes para obtener una perspectiva más precisa y reducir el sesgo de estimación.

## Modelos de Estimación

1. **Function Points (FP)**: Basado en funcionalidad entregada al usuario
2. **COCOMO**: Modelo constructivo de costo de software
3. **Planning Poker**: Estimación relativa usando secuencia de Fibonacci
4. **Historical**: Basado en datos históricos de proyectos similares

## Cómo Funciona

1. **Análisis de Requerimientos**: Extrae funcionalidad de la especificación
2. **Cálculo FP**: Cuenta inputs, outputs, queries, archivos e interfaces externas
3. **Aplicación COCOMO**: Usa esfuerzo = a * (KLOC)^b * factores de ajuste
4. **Simulación Poker**: Genera estimación relativa basada en complejidad percibida
5. **Búsqueda Historical**: Busca proyectos similares en el historial
6. **Consolidación**: Combina las cuatro estimaciones en un rango confiable

## Salida del Comando

- **Estimación FP**: Horas basada en puntos de función
- **Estimación COCOMO**: Horas basada en líneas de código y factores
- **Rango Poker**: Estimación relativa con desviación estándar
- **Datos Historical**: Promedio, mediana y desviación de proyectos similares
- **Consenso Final**: Rango recomendado basado en los cuatro modelos
- **Nivel de Confianza**: Porcentaje de acuerdo entre los modelos

## Uso

```
/gd:estimate [descripción de la tarea o requerimiento]
```

## Alias
- `/gd:estimar`

## Parámetros Opcionales

- `--detail`: Muestra cálculos detallados de cada modelo
- `--historical`: Incluye búsqueda extensa en historial de proyectos
- `--optimistic`: Asume condiciones óptimas
- `--pessimistic`: Asume condiciones adversas

## Ejemplo

```
/gd:estimate Implementar módulo de reportes financieros con gráficos interactivos
```

## Siguiente Paso
Usar la estimación para planificación de recursos y programación de sprints con `/gd:planning`.
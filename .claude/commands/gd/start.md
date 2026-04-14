# /gd:start — Iniciar Tarea con Detección Automática de Complejidad

## Propósito
Iniciar una nueva tarea con detección automática de complejidad siguiendo el flujo SDD (Specification-Driven Development).

## Cómo Funciona

1. **Detección de Complejidad**: Analiza el scope de la tarea para determinar su nivel:
   - **Nivel 0 (Atomic)**: 1 archivo, < 30 min → Implement → Verify
   - **Nivel P (PoC)**: Validar factibilidad (2-4h) → Hypothesis → Build → Evaluate
   - **Nivel 1 (Micro)**: 1-3 archivos → Specify (light) → Implement → Review
   - **Nivel 2 (Standard)**: Múltiples archivos, 1-3 días → Todas las 6 fases
   - **Nivel 3 (Complex)**: Multi-módulo, 1-2 semanas → 6 fases + pseudocódigo
   - **Nivel 4 (Product)**: Nuevo sistema, 2+ semanas → 6 fases + constitución + propuesta

2. **Inicio de Flujo**: Según el nivel detectado, inicia el flujo apropiado:
   - Niveles 0-1: `/gd:implement` directamente
   - Niveles 2+: `/gd:specify` → `/gd:clarify` → `/gd:plan` → `/gd:breakdown` → `/gd:implement` → `/gd:review`

## Uso

```
/gd:start [descripción de la tarea]
```

## Ejemplo

```
/gd:start Crear endpoint para listar transacciones por fecha
```

## Alias
- `/gd:iniciar`
- `/gd:comenzar`

## Integración con Razonamiento

Para tareas de **Nivel 2+**, antes de proceder a `/gd:specify` se recomienda activar:

```
/gd:razonar --modelo=primeros-principios [descripción de la tarea]
```

Esto verifica que el problema está correctamente encuadrado antes de escribir la especificación. Evita especificar la solución equivocada con mucho detalle.

## Siguiente Paso
Después de ejecutar `/gd:start`, el framework mostrará el nivel de complejidad detectado y guiará al siguiente paso del flujo SDD.
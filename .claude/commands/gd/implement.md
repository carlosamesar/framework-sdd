# /gd:implement — Ejecutar con TDD: RED → GREEN → REFACTOR

## Propósito
Implementar la solución siguiendo el ciclo estricto de TDD (Test-Driven Development) con verificación en cada paso.

## Cómo Funciona

### Fase RED - Escribir Test FALLIDO
1. Escribir test unitario/integración que defina el comportamiento esperado
2. Ejecutar test y verificar que FALLE (RED)
3. El test debe ser determinista y verificable

### Fase GREEN - Hacer que el Test Pase
1. Implementar el mínimo código necesario para hacer pasar el test
2. Ejecutar todos los tests relacionados para asegurar no regresiones
3. Código debe ser simple y enfocado en hacer pasar el test

### Fase REFACTOR - Mejorar el Código
1. Refactorizar para mejorar legibilidad, mantenibilidad y performance
2. Mantener todos los tests pasando
3. Aplicar principios SOLID y patrones de diseño
4. Eliminar duplicación y código muerto

## Uso

```
/gd:implement [descripción de la tarea a implementar]
```

## Alias
- `/gd:aplicar`

## Quality Gates Obligatorios

Durante la implementación, deben validarse:
- ✅ **TDD Gate**: Tests existen antes del código (RED → GREEN → REFACTOR verificado)
- ✅ **Coverage Gate**: Cobertura mínima ≥ 85% en módulos de negocio
- ✅ **Spec Gate**: Implementación alineada con la especificación
- ✅ **Architecture Gate**: Principios de diseño respetados (SOLID, patrones)

## Buenas Prácticas

1. **Tests Deterministas**: Sin dependencias externas no controladas
2. **Tests Rápidos**: Unitarios < 10ms, integración < 1s
3. **Aislamiento**: Mocks para dependencias externas
4. **Documentación**: Comentarios claros en código complejo
5. **Commits Frequetnes**: Pequeños commits con mensajes descriptivos

## Integración con Razonamiento

Antes de escribir el primer test (fase RED), para tareas de alta criticidad:

```
/gd:razonar --modelo=inversion [descripción de lo que se va a implementar]
```

Pregunta: "¿Cómo garantizaría que esta implementación falle?" — los caminos al fracaso se convierten en los casos de test más importantes.

Para diseño de lógica de negocio compleja:

```
/gd:razonar --modelo=rlm-cadena-pensamiento [descripción de la lógica]
```

## Siguiente Paso
Después de implementar, usar `/gd:review` para revisión automática de calidad.
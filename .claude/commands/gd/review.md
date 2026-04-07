# /gd:review — Peer Review Automático en 7 Dimensiones

## Propósito
Realizar una revisión automática de la implementación en 7 dimensiones clave para asegurar calidad y alineación con especificaciones.

## Dimensiones de Revisión

1. **Funcionalidad**: Verifica que la implementación cumple con los escenarios de prueba Gherkin
2. **Tests**: Evalúa cobertura, calidad y correctness de los tests automatizados
3. **Rendimiento**: Analiza complejidad algorítmica y posibles cuellos de botella
4. **Arquitectura**: Revisa principios de diseño (SOLID, patrones, acoplamiento)
5. **Seguridad**: Escaneo OWASP Top 10 y validación de multi-tenant
6. **Mantenibilidad**: Legibilidad, documentación y facilidad de modificación
7. **Documentación**: Completitud de OpenAPI, ADRs y README actualizados

## Cómo Funciona

1. **Análisis Estático**: Revisa código fuente con linters y analizadores
2. **Validación de Tests**: Ejecuta suite de tests y verifica cobertura
3. **Revisión de Contratos**: Compara con OpenAPI/Swagger existente
4. **Chequeo de Seguridad**: Busca vulnerabilidades comunes
5. **Verificación de Multi-Tenant**: Confirma extracción correcta de tenant desde JWT
6. **Reporte de Findings**: Genera reporte con issues y recomendaciones

## Salida del Comando

- **Score General**: Puntuación 0-100 por dimensión
- **Issues Encontrados**: Lista de problemas categorizados por severidad
- **Recomendaciones**: Acciones específicas para mejorar cada dimensión
- **Decision Gate**: PASS/FAIL basado en thresholds configurables

## Uso

```
/gd:review
```

## Alias
- `/gd:auditar`
- `/gd:pr-review`

## Quality Gates

Para pasar el review, se requiere:
- ✅ **Funcionalidad**: ≥ 90% de escenarios de prueba cubiertos
- ✅ **Tests**: Coverage ≥ 85% y todos los tests pasando
- ✅ **Arquitectura**: Sin violaciones críticas de principios SOLID
- ✅ **Seguridad**: 0 vulnerabilidades OWASP Top 10
- ✅ **Documentación**: OpenAPI actualizado y endpoints documentados
- ✅ **Multi-Tenant**: Extracción de tenant desde JWT validada
- ✅ **Mantenibilidad**: Score ≥ 70 en métricas de complejidad

## Siguiente Paso
Si el review pasa, proceder con `/gd:verify` para validación final. Si falla, abordar los issues identificados y re-ejecutar el review.
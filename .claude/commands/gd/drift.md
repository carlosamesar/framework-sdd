# /gd:drift — Detectar Drift entre SPEC y Código Implementado

## Propósito
Identificar desviaciones entre la especificación original (SPEC) y la implementación actual del código, ayudando a mantener el alineamiento entre lo planeado y lo construido.

## Cómo Funciona

1. **Extracción de SPEC**: Lee la especificación Gherkin actual para extraer requerimientos y escenarios
2. **Análisis de Código**: Examina la implementación para identificar funcionalidad real
3. **Mapeo de Requerimientos**: Asocia cada requerimiento de SPEC con su implementación en código
4. **Detección de Gaps**: Identifica requerimientos especificados pero no implementados
5. **Detección de Excesos**: Identifica funcionalidad implementada pero no especificada
6. **Análisis de Desviaciones**: Evalúa cuánto se desvió la implementación del plan original

## Tipos de Drift Detectados

- **Drift de Funcionalidad**: Features especificadas faltantes o parcialmente implementadas
- **Drift de Interfaz**: Cambios en APIs, endpoints o contratos no especificados
- **Drift de Comportamiento**: Diferencias en el comportamiento esperado vs actual
- **Drift de No-Funcional**: Desviaciones en performance, seguridad o escalabilidad
- **Drift de Arquitectura**: Cambios en estructura o patrones no aprobados

## Salida del Comando

- **Score de Alineamiento**: Porcentaje de SPEC implementado correctamente (0-100%)
- **Gets Identificados**: Lista de requerimientos especificados pero faltantes en código
- **Excesos Identificados**: Funcionalidad en código que no estaba en SPEC
- **Desviaciones de Comportamiento**: Diferencias específicas en cómo funcionan las features
- **Impacto Evaluado**: Consecuencias potenciales de cada drift detectado
- **Recomendaciones de Corrección**: Acciones específicas para volver a alinear SPEC y código
- **Priorización**: Orden sugerido para abordar los issues encontrados

## Uso

```
/gd:drift [ruta o componente a evaluar]
```

## Alias
- `/gd:drift`

## Parámetros Opcionales

- `--severity=umbral`: Mostrar solo drifts por encima de cierto nivel de impacto
- `--format=salida`: Formato del reporte (markdown, json, texto)
- `--ignore=pats`: Ignorar ciertos tipos de drift (por ejemplo, mejoras técnicas menores)
- `--historical`: Comparar también con versiones históricas de la SPEC
- `--fix-sugerido`: Incluir sugerencias específicas de código para corregir drift

## Ejemplos

```
/gd:drift src/  # Analizar drift en toda la aplicación fuente
/gd:drift servicio-contabilidad/src/ --severity=medium
/gd:drift lib/lambda/transacciones/ --format=json
```

## Criterios de Aceptación

Para considerar que no hay drift significativo:
- ✅ **Score de Alineamiento**: ≥ 95% de SPEC implementado correctamente
- ✅ **Gets Críticos**: 0 requerimientos de alta prioridad no implementados
- ✅ **Excesos Menores**: Solo mejoras técnicas no especificadas (refactor, optimización)
- ✅ **APIs Estables**: 0 cambios en contratos públicos no especificados
- ✅ **Comportamiento Consistente**: Funcionalidad se comporta como se especificó

## Siguiente Paso

Según los resultados del drift detection:
- **Si drift bajo**: Continuar con desarrollo normal, posiblemente usar `/gd:implement` para nuevas features
- **Si drift medio**: Addressar gaps identificados antes de continuar con `/gd:implement`
- **Si drift alto**: Considerar replantear SPEC con `/gd:specify` o revertir cambios no autorizados
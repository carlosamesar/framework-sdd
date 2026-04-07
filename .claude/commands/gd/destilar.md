# /gd:destilar — Extraer Specs de Código Existente (Behavior Reverse Engineering)

## Propósito
Extraer especificaciones formales (en formato Gherkin) a partir de código existente mediante ingeniería inversa de comportamiento, útil para documentar funcionalidad legacy o entender sistemas existentes.

## Cómo Funciona

1. **Análisis de Código**: Examina el código para identificar:
   - Puntos de entrada (endpoints, funciones públicas)
   - Flujos de ejecución principales
   - Manejo de errores y casos borde
   - Interacciones con bases de datos y servicios externos
   - Logica de negocio compleja

2. **Identificación de Casos de Uso**: Agrupa funcionalidad relacionada en casos de uso coherentes

3. **Generación de Escenarios Gherkin**: Para cada caso de uso, crea escenarios Given/When/Then basados en el comportamiento observado

4. **Extracción de Requerimientos**: Infiere requerimientos funcionales y no funcionales del código

5. **Esquema de BD Implícito**: Extrae modelo de datos implícito en consultas y operaciones

## Salida del Comando

- **Feature Files Gherkin**: Especificaciones completas en formato Gherkin
- **Casos de Uso Identificados**: Lista de funcionalidades descubiertas
- **Diagramas de Flujo**: Representación visual de flujos de ejecución principales
- **Esquema de BD**: Modelo de datos extraído del código
- **Lista de Dependencias**: Servicios externos y librerías utilizadas
- **Complejidad Estimada**: Nivel de esfuerzo para reimplementar desde cero

## Uso

```
/gd:destilar [ruta o módulo a analizar]
```

## Alias
- `/gd:minar-referencias`

## Parámetros Opcionales

- `--depth=nivel`: Profundidad de análisis (1=superficial, 2=moderado, 3=profundo)
- `--format=salida`: Formato de output (markdown, html, json)
- `--include-tests`: Incluir análisis de tests existentes en la extracción
- `--ignore=pats`: Ignorar ciertos patrones o directorios
- `--output-dir=dir`: Directorio donde guardar las specs extraídas

## Ejemplos

```
/gd:destilar servicio-contabilidad/src/
/gd:destilar lib/lambda/transacciones/fnTransaccionLineas/
/gd:destilar servicio-tesoreria/src/tesoreria/controllers/ --format=json
```

## Buenas Prácticas

1. **Enfoque Incremental**: Empezar con módulos pequeños y bien definidos
2. **Validación con Stakeholders**: Compartir specs extraídas con dueños de negocio para validar precisión
3. **Iteración**: Refactorizar specs generadas basándose en feedback y comprensión
4. **Documentación de Suposiciones**: Marcar claramente donde se hicieron inferencias
5. **Integración con Procesos SDD**: Usar specs extraídas como punto de partida para mejoras

## Limitaciones

- No puede inferir requisitos de negocio no implementados en el código
- La calidad depende de la legibilidad y estructura del código fuente
- Puede producir falsos positivos en código altamente complejo o ofuscado
- Mejor usado como punto de partida que como especificación definitiva

## Siguiente Paso
Usar las specs extraídas como entrada para `/gd:specify` para refinamiento o como base para planificación de mejoras con `/gd:plan`.
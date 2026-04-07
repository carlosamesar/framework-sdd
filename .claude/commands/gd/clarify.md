# /gd:clarify — Detectar Ambigüedades y Contradicciones

## Propósito
Realizar una revisión de la especificación para detectar ambigüedades, contradicciones y gaps antes de iniciar la implementación.

## Cómo Funciona

1. **Análisis de SPEC**: Revisa la especificación actual en busca de:
   - Requerimientos ambiguos o poco claros
   - Contradicciones entre escenarios
   - Casos borde no cubiertos
   - Información faltante

2. **Detección de Issues**: Identifica y documenta cada problema encontrado

3. **Solicitud de Clarificación**: Pide al usuario clarificación de los items ambiguous

## Uso

```
/gd:clarify
```

## Alias
- `/gd:clarificar`
- `/gd:detectar-ambiguedad`

## Criterios de Spec Gate

La especificación debe pasar los siguientes criterios para considerarse válida:
- ✅ Completitud: Todos los escenarios principales cubiertos
- ✅ Claridad: Cada escenario tiene Given/When/Then claro
- ✅ Consistencia: No hay contradicciones entre escenarios
- ✅ Medibilidad: Cada resultado tiene criterios de aceptación medibles
- ✅ Trazabilidad: Cada requerimiento tiene al menos un escenario de prueba

## Siguiente Paso
Una vez clarificada la spec, usar `/gd:plan` para el blueprint técnico.
# /gd:archive — Sincronizar Delta Specs a Specs Principales y Archivar Cambio

## Propósito
Finalizar el ciclo SDD sincronizando las especificaciones delta (de cambios) con las especificaciones principales y archivando el cambio completado.

## Cómo Funciona

1. **Sincronización de Specs**: Copia los archivos de especificación delta a las specs principales del proyecto
2. **Actualización de Documentación**: Actualiza archivos de referencia como project.md y registry.md
3. **Archivado del Cambio**: Mueve los archivos de trabajo a un archivo histórico para referencia futura
4. **Limpieza**: Opcionalmente limpia archivos temporales de desarrollo

## Proceso de Archivado

```
Input: Delta specs (en specs/delta/), Work files, Implementation
Process:
  1. Validar que el cambio pasó review y verify
  2. Copiar delta specs a main specs directory
  3. Actualizar project.md con información del cambio completado
  4. Añadir entrada a registry.md con número secuencial y metadata
  5. Mover work files a carpeta de archivo con timestamp
  6. Generar resumen de cambios para documentación
Output: Cambio archivado y specs principales actualizadas
```

## Salida del Comando

- **Specs Actualizadas**: Confirmación de specs principales sincronizadas
- **Registry Actualizado**: Nueva entrada en registry.md con ID secuencial
- **Archivo Creado**: Carpeta en engineering-knowledge-base/ con el cambio archivado
- **Resumen**: Qué se archivó y dónde se encuentra

## Uso

```
/gd:archive
```

## Alias
- `/gd:archivar`

## Requisitos Previos

Antes de ejecutar archive, deben cumplirse:
- ✅ **Review Aprobado**: /gd:review debe haber pasado
- ✅ **Verify Aprobado**: /gd:verify debe haber pasado
- ✅ **Tests Pasando**: Suite completa de tests debe estar en verde
- ✅ **Documentación Actualizada**: OpenAPI, ADRs y README reflejan el cambio

## Criterios de Archivado

El cambio se considera listo para archivar cuando:
- ✅ Toda la funcionalidad especificada está implementada y testeada
- ✅ No hay issues críticos de calidad o seguridad pendientes
- ✅ La documentación refleja correctamente el estado final
- ✅ Se ha obtenido aprobación explícita para archivar (si aplica)

## Siguiente Paso
Después de archivar, el ciclo SDD está completo. El próximo cambio puede comenzar con `/gd:start` nuevamente.
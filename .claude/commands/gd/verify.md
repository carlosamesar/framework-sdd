# /gd:verify — Validar que Implementación Coincide con SPEC y Tasks

## Propósito
Validar que la implementación final coincide exactamente con la especificación original y las tareas definidas en el breakdown.

## Cómo Funciona

1. **Verificación de SPEC**: Compara la implementación contra la especificación Gherkin original
2. **Validación de Tasks**: Confirma que todas las tareas del breakdown fueron completadas
3. **Regressión Checks**: Asegura que no se introdujo funcionalidad no especificada
4. **Traza de Requerimientos**: Verifica que cada requerimiento tiene cobertura de implementación
5. **Validación de Contratos**: Confirma que los APIs coinciden con el plan técnico

## Proceso de Verificación

```
Input: SPEC original, Task Breakdown, Implementación actual
Process:
  1. Extraer requerimientos de SPEC (Given/When/Then)
  2. Extraer tareas completadas del breakdown
  3. Mapear implementación a requerimientos y tareas
  4. Identificar gaps y funcionalidad extra
  5. Generar reporte de verificación
Output: PASS/FAIL con detalles de gaps y excesos
```

## Salida del Comando

- **Estado**: PASS si implementación == SPEC + Tasks, **FAIL** si hay diferencias relevantes
- **Gaps**: Funcionalidad especificada pero no implementada
- **Excesos**: Funcionalidad implementada pero no especificada
- **Cobertura**: Porcentaje de requerimientos cubiertos
- **Tareas Completadas**: Número y porcentaje de tareas del breakdown hechas

### Verificación mecánica (CI / agentes ReAct)

Desde la raíz del repositorio:

```bash
npm run spec:verify -- <slug-del-change>
# o todos los changes:
npm run spec:verify -- --all
```

Genera `reports/verify-<slug>.json` (estado de checklist `tasks.md` + lista de `specs/**`). Para **observación estructurada** adicional del modelo, emitir también JSON según `openspec/templates/react-outputs/verify.output.schema.json`.

## Uso

```
/gd:verify
```

## Alias
- `/gd:validar`
- `/gd:verificar`

## Criterios de Aprobación

Para considerar la verificación exitosa:
- ✅ **Cobertura de SPEC**: ≥ 95% de requerimientos implementados
- ✅ **Tasks Completadas**: 100% de tareas del breakdown marcadas como done
- ✅ **Funcionalidad Extra**: 0% de implementación no especificada (excepto mejoras técnicas)
- ✅ **Contratos API**: 100% de endpoints especificados implementados
- ✅ **Esquema de BD**: Cambios de base de datos alineados con SPEC

## Siguiente Paso
Si la verificación pasa, proceder con `/gd:archive` para completar el ciclo SDD. Si falla, abordar los gaps identificados y volver a implementar/verificar.
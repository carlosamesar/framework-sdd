# /gd:status — Estado del Proyecto y Cambios Activos

## Propósito
Mostrar una vista consolidada del estado actual del proyecto: cambios activos, fases completadas, gates pendientes y métricas del ciclo SDD en curso. Es el "dashboard rápido" del framework.

---

## Cómo Funciona

1. **Detectar el change activo** en `openspec/changes/` (excluyendo `archive/`)
2. **Leer el estado de cada artefacto** del change (spec, plan, tasks, evidencia)
3. **Evaluar gates completados** vs pendientes
4. **Mostrar historial reciente** de changes archivados
5. **Emitir reporte de estado** estructurado

---

## Output del Comando

```markdown
## Estado del Proyecto — [nombre del proyecto]
**Fecha**: [YYYY-MM-DD HH:mm]

### Change Activo

**Nombre**: [nombre del change]
**Slug**: [slug]
**Nivel**: [0-4]
**Fase actual**: specify | clarify | plan | breakdown | implement | review | verify | archive

### Progreso del Change

| Artefacto | Estado | Última modificación |
|-----------|--------|---------------------|
| Spec | ✅ APPROVED | 2026-04-10 |
| Clarify | ✅ PASS | 2026-04-10 |
| Plan técnico | ✅ Completo | 2026-04-11 |
| Tasks breakdown | ✅ 8/8 tareas | 2026-04-11 |
| Implementación | 🔄 En progreso (T05/T08) | 2026-04-14 |
| Review | ⏳ Pendiente | — |
| Verify | ⏳ Pendiente | — |
| Archive | ⏳ Pendiente | — |

### Tasks del Change Activo

| ID | Tarea | Estado | Estimación |
|----|-------|--------|-----------|
| T01 | Crear entidad CajaParqueadero | ✅ Done | 30min |
| T02 | Crear CajaRepository | ✅ Done | 45min |
| T03 | Crear DTOs | ✅ Done | 30min |
| T04 | Implementar handler cerrar-caja | ✅ Done | 60min |
| T05 | Configurar Lambda con authorizer | 🔄 En progreso | 45min |
| T06 | Tests de integración | ⏳ Pendiente | 60min |
| T07 | Actualizar OpenAPI | ⏳ Pendiente | 20min |
| T08 | Migration de BD | ⏳ Pendiente | 30min |

**Completado**: 4/8 (50%) | **Estimado restante**: ~155 min

### Gates de Calidad

| Gate | Estado |
|------|--------|
| TDD (RED→GREEN→REFACTOR) | ✅ Aplicado en T01-T04 |
| Coverage ≥ 85% | ⚠️ 78% — subir en T06 |
| Multi-tenant JWT | ✅ Verificado |
| Lint 0 errores | ✅ Limpio |
| Review (7D) | ⏳ Pendiente |
| Verify (spec vs impl) | ⏳ Pendiente |

### Últimos Changes Archivados

| ID | Nombre | Fecha | Nivel |
|----|--------|-------|-------|
| C-042 | parqueaderos-cerrar-caja-fix | 2026-04-14 | 1 |
| C-041 | praisonai-don-carlo-enrichment | 2026-04-09 | 3 |
| C-040 | inventory-audit-remediation | 2026-04-07 | 2 |

**Siguiente acción recomendada**: Completar T05 y T06, luego ejecutar `/gd:review`
```

---

## Uso

```
/gd:status                      # estado del change activo
/gd:status [slug]               # estado de un change específico
/gd:status --all                # estado de todos los changes (activos + archivados recientes)
/gd:status --tasks              # solo la lista de tasks con estado
```

---

## Cómo Leer el Estado

| Símbolo | Significado |
|---------|------------|
| ✅ Done / PASS | Completado y verificado |
| 🔄 En progreso | Trabajo activo en curso |
| ⏳ Pendiente | Aún no iniciado |
| ⚠️ Warning | Completado pero con advertencias |
| ❌ FAIL / BLOCKER | Falla — debe resolverse antes de avanzar |

---

## Archivos que Inspecciona

| Archivo | Propósito |
|---------|----------|
| `openspec/changes/[slug]/tasks.md` | Estado de tasks |
| `openspec/changes/[slug]/specs/` | Estado de spec |
| `openspec/changes/[slug]/design.md` | Plan técnico |
| `openspec/registry.md` | Historial de changes |
| Engram `mem_context` | Contexto de sesión reciente |

---

## Siguiente Paso
Usar el status para determinar la siguiente acción en el pipeline SDD.
Acceso rápido al historial completo: `openspec/registry.md`
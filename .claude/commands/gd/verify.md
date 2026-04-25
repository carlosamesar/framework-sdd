# /gd:verify — Validar que Implementación Coincide con SPEC y Tasks

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:verify` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


> **🛑 ZERO TRUST V9 — REGLAS HEREDADAS ACTIVAS**
> 1. **TIENES PROHIBIDO aceptar un "sí, funcionó"** como evidencia de verificación.
> 2. Exige evidencia según el stack del cambio:
>    - `frontend` → logs literales de **Playwright** con estado `PASS` para cada escenario generado.
>    - `backend` → logs literales de **Jest/Supertest** con estado `PASS` y reporte de cobertura de las líneas modificadas.
>    - `fullstack` → ambos reportes, en ese orden.
> 3. Si los logs no cubren los escenarios negativos y de casos borde generados en `/gd:implement`, el verify es **FAIL**.

## Propósito
Validar que la implementación final coincide exactamente con la especificación original y las tareas definidas en el breakdown. Es el último gate de calidad antes de archivar el cambio.

## Alias
- `/gd:validar`
- `/gd:verificar`

---

## Prerrequisitos
- `/gd:review` aprobado con veredicto `PASS` estricto
- Build, lint y todas las pruebas aplicables en verde
- Todas las tareas del breakdown marcadas como completadas
- Evidencia funcional y técnica disponible para trazabilidad

---

## Cómo Funciona

1. **Cargar la spec** desde `openspec/changes/[slug]/SPEC.md`
2. **Cargar el task breakdown** desde `openspec/changes/[slug]/TASKS.md`
3. **Trazar cada escenario Gherkin** → código que lo implementa → test que lo verifica
4. **Verificar completitud** de tareas vs implementación real
5. **Detectar scope creep**: funcionalidad implementada fuera de spec
6. **Ejecutar gate REVIEW → VERIFY** (ver abajo)
7. **Emitir veredicto**: `VERIFY PASS` o `VERIFY FAIL [gaps]`

### Gate REVIEW → VERIFY (modo dual)

**Modo automático** — si el repo tiene infraestructura RAG/SQLite activa:
```bash
cd rag
npm run evidence:gate -- --change=<change-slug> --transition=REVIEW_VERIFY
# Exit 0 = gate pasa | Exit != 0 = gate falla → VERIFY FAIL
```

**Modo manual** — si `rag/` no existe o el script no está disponible:

Verificar antes de continuar:
- [ ] `/gd:review` produjo veredicto `PASS` documentado (sin BLOCKERs, sin errores)
- [ ] Todos los tests siguen en verde tras la implementación completa
- [ ] `TASKS.md` tiene todas las tareas marcadas como `[x]`
- [ ] `SPEC.md` está disponible para trazabilidad

Si alguna verificación falla → `/gd:verify` termina en `VERIFY FAIL`.

---

## Matrix de Verificación

Para cada escenario de la spec, completar:

```markdown
| ID | Escenario (Given/When/Then) | Implementado en | Test en | Estado |
|----|----------------------------|-----------------|---------|--------|
| E01 | Given token JWT válido / When POST /api/items / Then 201 + {id} | items.handler.ts:45 | items.spec.ts:23 | ✅ |
| E02 | Given token inválido / When POST /api/items / Then 401 UNAUTHORIZED | cognito.guard.ts | items.spec.ts:41 | ✅ |
| E03 | Given items vacíos / When GET /api/items / Then 200 + [] | items.service.ts:67 | items.spec.ts:58 | ✅ |
| E04 | Given cantidad negativa / When POST / Then 400 VALIDATION_ERROR | create-item.dto.ts | items.spec.ts:72 | ❌ GAP |
```

---

## Verificación Mecánica (Opcional — si el repo tiene `openspec/`)

Si el proyecto tiene infraestructura OpenSpec activa:

```bash
# Verificar un change específico
npm run spec:verify -- <slug-del-change>

# Verificar todos los changes activos
npm run spec:verify -- --all

# Output: reports/verify-<slug>.json
```

Si el script no existe, la verificación se realiza manualmente con el checklist de esta sección.

---

## Checklist de Verificación Manual

### 1. Cobertura de Spec
```
Para cada Feature en la spec:
  Para cada Scenario:
    [ ] El escenario P0 está implementado
    [ ] El escenario P0 tiene test que lo cubre
    [ ] El test afirma el resultado exacto del Then (no solo que no lanza error)
```

### 2. Completitud de Tasks
```
Para cada tarea en tasks.md:
  [ ] La tarea está marcada como completada (✅)
  [ ] El archivo mencionado en la tarea existe
  [ ] Los criterios de aceptación de la tarea están cumplidos
```

### 3. Ausencia de Scope Creep
```
Para cada archivo modificado/creado:
  [ ] El archivo está justificado por al menos una tarea del breakdown
  [ ] La lógica implementada está cubierta por al menos un escenario de la spec
```

### 4. Contratos API
```
Para cada endpoint en el plan técnico:
  [ ] El endpoint existe con el método HTTP correcto
  [ ] El request schema coincide con el plan
  [ ] Los response codes (200, 400, 401, 404, 500) están implementados
  [ ] El endpoint está documentado en OpenAPI
```

### 5. Esquema de BD
```
Para cada tabla en el DBML del plan:
  [ ] La tabla existe en el esquema de BD (migration aplicada)
  [ ] Los campos coinciden con el DBML
  [ ] Los índices definidos en el DBML existen
  [ ] tenant_id está presente en todas las tablas de negocio
```

---

## Formato de Reporte de Verificación

```markdown
## Resultado de Verificación — [nombre del change]

**Veredicto**: ✅ VERIFY PASS | ❌ VERIFY FAIL
**Fecha**: [YYYY-MM-DD]

### Cobertura de Spec
- Escenarios totales: N
- Escenarios P0 implementados: X/Y (X%)
- Escenarios P1 implementados: X/Y (X%)
- Escenarios sin test: Z

### Completitud de Tasks
- Tareas totales: N
- Tareas completadas: X/N (X%)
- Tareas pendientes: [lista]

### Scope Creep
- Archivos fuera de spec: [lista o "ninguno"]

### Gaps (VERIFY FAIL si hay P0 gaps)
- **GAP-01**: Escenario E04 (token expirado → 401) no implementado
  - Spec: `specs/auth.spec.md:34`
  - Acción: Agregar guard de token expirado

### Funcionalidad Extra (no bloqueante si es técnica)
- Logging de requests añadido (mejora técnica — aceptable)

### Veredicto Final
- P0 gaps = 0, tasks = 100% → **VERIFY PASS** → continuar con `/gd:archive`
- P0 gaps > 0 → **VERIFY FAIL** → volver a implementar los gaps
```

---

## Criterios de Aprobación

| Criterio | Mínimo para PASS |
|----------|-----------------|
| Cobertura P0 | **100%** — todos los escenarios P0 implementados y testeados |
| Cobertura P1 | ≥ 80% |
| Tasks completadas | **100%** — todas las tareas del breakdown marcadas done |
| Scope creep | 0% de implementación fuera de spec (excepto mejoras técnicas) |
| Contratos API | 100% de endpoints del plan implementados |
| Esquema de BD | 100% de tablas/campos del DBML presentes |
| Calidad operativa | build + lint + unit + integración + consumos + E2E en verde |
| Severidad | 0 BLOCKERs, 0 errores abiertos, 0 warnings críticas |

---

## Uso

```
/gd:verify
/gd:verify [slug]   # verificar change específico
```

---

## Siguiente Paso
- Si `VERIFY PASS` → usar `/gd:close` para cerrar formalmente el spec con evidencia y contrato documental
- Si `VERIFY FAIL` → volver a `/gd:implement` para resolver gaps, luego re-ejecutar `/gd:review` y `/gd:verify`

# /gd:close — Cierre de Certificación y Contrato Final del Cambio

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:close` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Propósito
Cerrar formalmente un cambio, validando que toda la evidencia técnica y funcional está completa,
que los contratos están documentados, y que el change puede proceder a `/gd:release` o `/gd:archive`.

## Alias
- `/gd:cerrar`
- `/gd:finalizar`

---

## Prerrequisitos (todos obligatorios)

- [ ] `/gd:review` aprobado con veredicto `PASS` documentado
- [ ] `/gd:verify` aprobado con veredicto `VERIFY PASS` documentado
- [ ] Todos los tests en verde (backend, frontend o ambos según el stack del change)
- [ ] Build sin errores de compilación
- [ ] Lint limpio o sin hallazgos críticos
- [ ] Todas las tareas del `TASKS.md` marcadas como `[x]`
- [ ] Código commiteado a rama `fix/<slug>` (no en rama base protegida)

---

## Gate VERIFY → CLOSE (modo dual)

### Modo automático — si el repo tiene infraestructura RAG/SQLite activa:

```bash
cd rag
npm run evidence:gate -- --change=<change-slug> --transition=VERIFY_CLOSE
# Exit 0 = gate pasa | Exit != 0 = close falla
```

### Modo manual — si `rag/` no existe o no está disponible:

Verificar antes de continuar:
- [ ] `/gd:review` produjo veredicto `PASS` (documentado en `EVIDENCE.md`)
- [ ] `/gd:verify` produjo veredicto `VERIFY PASS` (documentado en `EVIDENCE.md`)
- [ ] No hay BLOCKERs ni hallazgos CRITICAL sin resolver
- [ ] `TASKS.md` con todas las tareas `[x]`

Si alguna falla → `/gd:close` termina en `FAIL`. No hay excepción.

---

## Flujo de Cierre

### Paso 1 — Verificar prerrequisitos

```bash
# Estado del repo
git status
git log --oneline -5

# Tests finales
npm test       # backend / NestJS
# o
npx ng test --watch=false --browsers=ChromeHeadless   # Angular
# o
npx playwright test   # E2E
```

### Paso 2 — Crear o completar `CONSUMO.md`

El archivo `CONSUMO.md` documenta el contrato público del cambio y permite que otros equipos
y futuros agentes consuman el trabajo sin releer el código.

Ubicación: `openspec/changes/<slug>/CONSUMO.md`

Estructura obligatoria:

```markdown
# CONSUMO — <change-slug>

## Descripción
[Qué hace este cambio en una oración]

## Endpoints / Contratos (si aplica)

### POST /api/v1/<recurso>
**Request:**
```json
{ "campo": "valor" }
```
**Response 201:**
```json
{ "id": "uuid", "campo": "valor" }
```
**Errors:** 400, 401, 403, 409

## Parámetros requeridos
- `tenantId`: extraído de JWT `custom:tenant_id`
- `Authorization`: Bearer <JWT>

## Dependencias externas
- Lambda: `fnNombreHandler` en `us-east-1`
- NestJS service: `NombreService`

## Variables de entorno requeridas
- `DB_HOST`, `DB_PORT`, etc.

## Notas de uso
[Gotchas, edge cases, restricciones multi-tenant]
```

### Paso 3 — Completar `EVIDENCE.md`

Ubicación: `openspec/changes/<slug>/EVIDENCE.md`

Agregar los gates completados:

```markdown
## Gate: close — [PASS] — [YYYY-MM-DD]
- CONSUMO.md completo: ✅
- Contrato final documentado: ✅
- TASKS.md completo (todas [x]): ✅
- Tests pasando: ✅
- Rama: fix/<slug>
- PR: <URL del PR o "N/A — solo framework">
```

### Paso 4 — Preparar PR (si el change toca repos productivos)

```bash
# Asegurarse de que la rama está actualizada
git pull origin <rama-base> --rebase

# Push de la rama de trabajo
git push origin fix/<slug>

# Crear PR hacia la rama base
gh pr create \
  --title "fix(<slug>): <descripción corta>" \
  --body "$(cat openspec/changes/<slug>/CONSUMO.md)"
```

### Paso 5 — Capturar evidencia en RAG (si el repo tiene infraestructura SQLite)

```bash
cd rag
npm run evidence:capture close \
  --change="<slug>" \
  --result="PASS" \
  --notes="CONSUMO.md y EVIDENCE.md completos. PR creado."
```

---

## Veredicto de Cierre

El comando emite uno de dos veredictos:

### ✅ CLOSE PASS — READY FOR ARCHIVE

```markdown
## Close: PASS ✅
**Change**: <slug>
**Fecha**: <YYYY-MM-DD>

### Artefactos entregados
- CONSUMO.md: ✅ completo
- EVIDENCE.md: ✅ con todos los gates
- TASKS.md: ✅ todas las tareas [x]
- Rama: fix/<slug>
- PR: <URL o N/A>

### Siguientes pasos
→ Si el change requiere versión/deploy: ejecutar /gd:release
→ Si el change es solo código/docs: ejecutar /gd:score luego /gd:archive
```

### ❌ CLOSE FAIL

```markdown
## Close: FAIL ❌
**Razón**: [descripción exacta del bloqueo]
**Gate que falla**: [review | verify | tests | consumo | evidence]
**Acción requerida**: [qué completar antes de reintentar /gd:close]
```

---

## Reglas No Negociables

- **NUNCA** emitir `CLOSE PASS` si `/gd:review` o `/gd:verify` están en `FAIL` o sin ejecutar.
- **NUNCA** emitir `CLOSE PASS` si `CONSUMO.md` está vacío o incompleto.
- **NUNCA** omitir `EVIDENCE.md` — es el registro de auditoría del cambio.
- **NUNCA** hacer close desde una rama base protegida — siempre desde `fix/<slug>`.
- Si el change afecta multi-tenancy, CORS o JWT: el `CONSUMO.md` debe documentar ese contrato explícitamente.

---

## Qué Sigue Después de CLOSE PASS

| Escenario | Próximo comando |
|-----------|----------------|
| Change requiere versión o release | `/gd:release` |
| Change requiere despliegue a AWS | `/gd:release` → `/gd:deploy` |
| Change es solo código/docs/framework | `/gd:score` → `/gd:archive` |
| Score < 80% | Completar dimensiones rojas → `/gd:score` → `/gd:archive` |

---

## Integración con el Flujo Completo

```
/gd:implement → tests → /gd:review → /gd:verify → /gd:close → /gd:score → /gd:archive
                                                         ↓
                                                  (si requiere deploy)
                                               /gd:release → /gd:deploy → /gd:score → /gd:archive
```

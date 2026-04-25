# EVIDENCE — <change-slug>

**Change**: `<change-slug>`
**Proyecto**: `<proyecto>`
**Stack**: `<frontend | backend | fullstack>`
**Rama**: `fix/<change-slug>`
**Fecha inicio**: `<YYYY-MM-DD>`

---

## Gate: implement — [PASS|FAIL] — [YYYY-MM-DD]

```
Commits en rama fix/<change-slug>:
- <hash> <mensaje>

Build: [OK | FAIL]
Lint:  [OK | FAIL — descripción]
```

---

## Gate: test — [PASS|FAIL] — [YYYY-MM-DD]

```
Stack: [backend | frontend | fullstack]

Tests ejecutados:
- Suite: <nombre>
  Total: X | Passed: X | Failed: 0
  Coverage: X% (umbral: XX%)

Comando: <npm test | npx playwright test | ...>
Output relevante:
  <pegar output real aquí>
```

---

## Gate: review — [PASS|FAIL] — [YYYY-MM-DD]

```
Veredicto: PASS | FAIL

Dimensiones evaluadas:
- D1 Funcionalidad: XX/100
- D2 Tests:         XX/100
- D3 Seguridad:     XX/100
- D4 Arquitectura:  XX/100
- D5 Performance:   XX/100
- D6 Observabilidad:XX/100
- D7 Deuda técnica: XX/100

BLOCKERs: ninguno | <lista>
CRITICALs: ninguno | <lista>
```

---

## Gate: verify — [PASS|FAIL] — [YYYY-MM-DD]

```
Veredicto: VERIFY PASS | VERIFY FAIL

Escenarios verificados:
| ID  | Escenario                    | Implementado en       | Test en        | Estado |
|-----|------------------------------|-----------------------|----------------|--------|
| E01 | <Given/When/Then>            | <archivo:línea>       | <spec:línea>   | ✅     |

Scope creep detectado: ninguno | <lista>
TASKS.md: todas [x]
```

---

## Gate: close — [PASS|FAIL] — [YYYY-MM-DD]

```
CONSUMO.md completo: ✅ | ❌
Contrato final documentado: ✅ | ❌
TASKS.md completo (todas [x]): ✅ | ❌
Tests pasando: ✅ | ❌
Rama: fix/<slug>
PR: <URL o "N/A — change de framework">
```

---

## Gate: release — [PASS|FAIL] — [YYYY-MM-DD]

```
Versión: vX.Y.Z | N/A
Changelog actualizado: ✅ | N/A
Artefactos generados: ✅ | N/A
Rollback definido: ✅ | N/A
```

---

## Gate: deploy — [PASS|FAIL] — [YYYY-MM-DD]

```
Ambiente: [staging | production | N/A]
Deploy ejecutado: ✅ | N/A
Smoke test: ✅ | N/A
Endpoints verificados: <lista> | N/A
```

---

## Gate: score — [XX%] — [YYYY-MM-DD]

```
Dimensión                        | Peso | Estado   | Puntos
----------------------------------|------|----------|-------
Evidencia de código (commits)    | 15%  | ✅/❌    | XX
Evidencia de tests (ejecutados)  | 15%  | ✅/❌    | XX
Tests pasando (passed=true)      | 20%  | ✅/❌    | XX
Review aprobado                  | 15%  | ✅/❌    | XX
Verificación aprobada            | 15%  | ✅/❌    | XX
Despliegue exitoso               | 10%  | ✅/N/A   | XX
Documentación completa           | 10%  | ✅/❌    | XX

TOTAL: XX% — [CERTIFICADO ≥80% | EN PROGRESO | INCOMPLETO]
```

---

## Notas finales

> Completa esta sección con observaciones, aprendizajes, o decisiones técnicas tomadas durante el change.

# /gd:gate — Definir y Ejecutar Quality Gates

## Propósito
Definir y ejecutar quality gates (puertas de calidad) personalizados en cualquier punto del ciclo SDD. Un gate bloquea el avance hasta que se cumplan los criterios definidos. Es la herramienta para enforcement de estándares no negociables.

---

## Cómo Funciona

1. **Seleccionar el gate** a ejecutar (predefinido o personalizado)
2. **Ejecutar chequeos** del gate seleccionado
3. **Evaluar resultados** contra los umbrales configurados
4. **Emitir veredicto**: `GATE PASS` o `GATE FAIL [items bloqueantes]`
5. **Bloquear el avance** si el gate falla — no hay bypass manual

---

## Gates Predefinidos

### Gate: `spec`
Se ejecuta automáticamente al final de `/gd:clarify`.

```
✅ Completitud: todos los escenarios P0 presentes
✅ Claridad: cada Then es verificable mecánicamente
✅ Consistencia: sin contradicciones entre escenarios
✅ Multi-tenant: tenant_id en todas las entidades de BD
✅ BLOCKERs: 0 issues sin resolver
```

### Gate: `tdd`
Se ejecuta durante `/gd:implement`.

```bash
npm test -- --coverage
# Verificar: X passing, 0 failing
# Coverage: Statements >= 85%, Lines >= 85%
```

```
✅ Tests escritos ANTES del código
✅ npm test — todos los tests pasan (0 failures)
✅ Coverage >= 85% en el módulo implementado
✅ Sin tests con .skip() o .only() en el commit final
```

### Gate: `security`
Se ejecuta automáticamente en `/gd:review` (D5).

```
✅ tenant_id de JWT en TODOS los endpoints (no del body/params)
✅ Guards de autorización en todos los métodos
✅ DTOs usan class-validator (no validación manual)
✅ Sin SQL injection (no string concatenation en queries)
✅ Sin exposición de campos sensibles en responses
✅ CORS configurado correctamente en Lambdas
```

### Gate: `review`
Se ejecuta al final de `/gd:review`.

```
✅ D1 Funcionalidad >= 90
✅ D2 Tests: coverage >= 85%, todos los tests verdes
✅ D3 Rendimiento: sin N+1 en happy path
✅ D4 Arquitectura: sin violaciones SOLID críticas
✅ D5 Seguridad: 0 vulnerabilidades (BLOCKER absoluto)
✅ D6 Mantenibilidad >= 70
✅ D7 Documentación: endpoints nuevos en OpenAPI
```

### Gate: `pre-release`
Se ejecuta antes de crear un tag de release.

```bash
npm audit --audit-level=high
grep -r "TODO\|FIXME" src/ --include="*.ts" --include="*.js"
npm test
```

```
✅ Todos los changes del milestone tienen VERIFY PASS
✅ CHANGELOG.md actualizado con la versión
✅ npm test completo en verde
✅ Dependencias sin vulnerabilidades conocidas (npm audit)
✅ Sin TODO/FIXME en código de producción
```

---

## Uso

```
/gd:gate spec              # ejecutar gate de especificación
/gd:gate tdd               # ejecutar gate TDD
/gd:gate security          # ejecutar gate de seguridad
/gd:gate review            # ejecutar gate de review completo
/gd:gate pre-release       # gate pre-release

/gd:gate --list            # listar todos los gates disponibles
/gd:gate --define          # definir un gate personalizado interactivamente
/gd:gate [nombre]          # ejecutar gate personalizado por nombre
```

---

## Definir un Gate Personalizado

```yaml
# openspec/config.yaml — sección gates
gates:
  custom-api-contract:
    name: "API Contract Compliance"
    description: "Verifica que los endpoints cumplen el contrato OpenAPI"
    checks:
      - command: "npm run validate:openapi"
        pass_on_exit_code: 0
        description: "OpenAPI spec válida"
      - command: "npm run test:contract"
        pass_on_exit_code: 0
        description: "Tests de contrato pasando"
    blocking: true
```

---

## Formato de Reporte

```markdown
## Gate: [nombre] — [PASS | FAIL]

**Fecha**: [YYYY-MM-DD HH:mm]
**Change**: [slug]

### Resultados

| Criterio | Estado | Detalle |
|----------|--------|---------|
| tenant_id de JWT | ✅ PASS | Verificado en 3 endpoints |
| Guards aplicados | ✅ PASS | CognitoGuard en todos los métodos |
| Sin SQL injection | ✅ PASS | TypeORM ORM usado en todas las queries |
| Campos sensibles expuestos | ❌ FAIL | `password_hash` en GET /api/users response |

### Veredicto: ❌ GATE FAIL

**Bloqueante**:
1. `password_hash` expuesto en `users.controller.ts:78`
   - Fix: `@Exclude()` en DTO o `ClassSerializerInterceptor`

**El pipeline está bloqueado hasta resolver los issues listados.**
```

---

## Integración Automática en el Pipeline

| Comando | Gate ejecutado automáticamente |
|---------|-------------------------------|
| `/gd:clarify` | `spec` |
| `/gd:implement` | `tdd` |
| `/gd:review` | `security`, `review` |
| Antes de `/gd:archive` | `pre-release` |

---

## Siguiente Paso
- Si `GATE PASS` → continuar con la siguiente fase del pipeline
- Si `GATE FAIL` → resolver los items bloqueantes y re-ejecutar el gate
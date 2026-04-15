# /gd:clarify — Detectar Ambigüedades y Contradicciones

## Propósito
Realizar una revisión sistemática de la especificación para detectar ambigüedades, contradicciones, gaps y preguntas abiertas antes de planificar. Produce una spec validada o una lista de items a resolver.

## Alias
- `/gd:clarificar`
- `/gd:detectar-ambiguedad`

---

## Cómo Funciona

1. **Leer la spec activa** en `openspec/changes/[slug]/specs/`
2. **Ejecutar los 5 chequeos** de calidad (ver abajo)
3. **Categorizar issues** por tipo y severidad
4. **Resolver los BLOCKER** antes de continuar — preguntar al usuario si es necesario
5. **Emitir veredicto**: `SPEC VÁLIDA` o `SPEC BLOQUEADA [lista de issues]`

---

## Los 5 Chequeos de Clarificación

### 1. Completitud
Verificar que todos los escenarios principales estén cubiertos.
- ¿Hay actores sin escenarios asociados?
- ¿Hay acciones descritas en el contexto pero sin Gherkin?
- ¿El happy path cubre el flujo de inicio a fin sin gaps?

### 2. Claridad
Verificar que cada escenario sea inequívoco.
- ¿Los `Given` son observables/medibles (no "usuario autenticado" sino "usuario con token JWT válido de rol admin")?
- ¿Los `Then` tienen criterios cuantitativos cuando aplica (no "respuesta rápida" sino "responde en < 200ms")?
- ¿Hay términos de negocio usados sin definir?

### 3. Consistencia
Verificar que no haya contradicciones entre escenarios.
- ¿Dos escenarios tienen el mismo `Given/When` pero diferentes `Then`?
- ¿Las reglas de validación son consistentes entre escenarios?
- ¿Los cambios de estado son reversibles según se espera?

### 4. Medibilidad
Verificar que cada resultado sea verificable por un test.
- ¿Cada `Then` puede ser afirmado con `expect(actual).toBe(expected)`?
- ¿Los errores tienen códigos HTTP y mensajes específicos?
- ¿Los efectos secundarios (emails, jobs, webhooks) son verificables?

### 5. Trazabilidad
Verificar que cada requerimiento tenga cobertura.
- ¿Cada bullet del contexto tiene al menos un escenario Gherkin?
- ¿Hay criterios de aceptación del negocio sin escenario correspondiente?

---

## Formato de Reporte de Issues

```markdown
## Resultado de Clarificación

**Estado**: SPEC VÁLIDA | SPEC BLOQUEADA

### Issues Encontrados

| ID | Tipo | Severidad | Escenario | Descripción | Acción |
|----|------|-----------|-----------|-------------|--------|
| C01 | Ambigüedad | BLOCKER | Scenario: Login exitoso | "autenticado" no define qué token se usa | Especificar tipo de token y claims mínimos |
| C02 | Gap | BLOCKER | — | No hay escenario para token expirado | Agregar Scenario: Token JWT expirado |
| C03 | Claridad | WARNING | Scenario: Cobro | Monto no tiene tipo definido | Aclarar si es float o Decimal(10,2) |
| C04 | Consistencia | INFO | Scenario: Cancelar | Conflicto con regla de no-modificación | Revisar si cancelación es soft-delete |

### Severidades
- **BLOCKER**: Impide implementar correctamente — debe resolverse antes de /gd:plan
- **WARNING**: Puede causar inconsistencias — resolver antes de /gd:implement
- **INFO**: Mejora calidad — resolver si el tiempo lo permite

### Preguntas al Usuario (BLOCKERs)
1. [C01] ¿El token de autenticación es JWT firmado con RS256 o HS256?
2. [C02] ¿Qué debe pasar cuando el token expira: refresh automático o re-login?
```

---

## Tipos de Ambigüedad Comunes

| Tipo | Señal | Ejemplo |
|------|-------|---------|
| **Actor vago** | "el usuario" sin rol | "usuario puede ver reportes" → ¿admin? ¿operador? |
| **Resultado inmeasurable** | adjetivos | "respuesta rápida", "funciona bien", "muestra información" |
| **Estado indefinido** | sin precondición | "Dado el sistema está listo" — ¿qué datos tiene? |
| **Regla de negocio implícita** | lógica sin enunciar | "calcula el total" — ¿con IVA? ¿con descuentos? |
| **Multi-tenant gap** | sin mención de tenant | Entidad de BD sin `tenant_id` en la spec |
| **Error sin código** | "muestra error" | Sin HTTP status ni mensaje específico |
| **Scope creep latente** | "también podría" | Features opcionales mezclados con requerimientos |

---

## Uso

```
/gd:clarify
/gd:clarify [slug-del-change]   # clarificar un change específico por slug
```

---

## Criterios de Spec Gate (para SPEC VÁLIDA)

- ✅ **Completitud**: Todos los escenarios P0 y P1 están presentes
- ✅ **Claridad**: Cada `Then` es verificable mecánicamente
- ✅ **Consistencia**: Sin contradicciones entre escenarios
- ✅ **Medibilidad**: Resultados tienen valores concretos (códigos, mensajes, campos)
- ✅ **Trazabilidad**: Cada requerimiento de negocio tiene al menos un Gherkin
- ✅ **Multi-tenant**: Toda entidad de BD tiene `tenant_id` especificado
- ✅ **BLOCKERs**: 0 issues de severidad BLOCKER sin resolver

---

## Siguiente Paso
- Si `SPEC VÁLIDA` → usar `/gd:plan` para el blueprint técnico
- Si `SPEC BLOQUEADA` → resolver los BLOCKERs con el usuario y re-ejecutar `/gd:clarify`

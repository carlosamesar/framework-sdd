# /gd:review — Orquestador Central de Calidad y Ciclo de Vida

## Propósito
Realizar una revisión automática, exhaustiva y severa de la implementación, actuando como el orquestador central de calidad del ciclo SDD. Su función no es solo revisar código: también decidir si el cambio puede avanzar, debe volver a implementación o queda bloqueado por riesgos funcionales, técnicos o de seguridad.

## Alias
- `/gd:auditar`
- `/gd:pr-review`

---

## Prerrequisitos
- Implementación terminada o suficientemente avanzada para evaluación real
- Evidencia disponible: tests, cobertura, build, lint, endpoints/payloads y diffs revisables
- Código commiteado o en staging

Si falta evidencia real, el review debe fallar automáticamente.

---

## Rol del Orquestador Central

`/gd:review` debe coordinar el cierre de calidad del cambio con esta secuencia:

1. Recolectar evidencia real de compilación, lint, tests, cobertura y comportamiento funcional.
2. Contrastar la implementación contra spec, tasks, contratos, multi-tenant y patrones maduros del repo.
3. Clasificar hallazgos por severidad: `BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`.
4. Emitir un veredicto binario: `PASS` o `FAIL`.
5. Si hay `FAIL`, devolver la tarea a implementación con la lista exacta de defectos.
6. Si hay `PASS`, habilitar inmediatamente `/gd:verify` como gate final de conformidad.

---

## Gates Absolutos (FAIL automático)

Si cualquiera de estos puntos falla, el resultado global es `FAIL` aunque el score agregado sea alto:

- errores de compilación o build roto;
- lint con errores o warnings críticas sin resolver;
- pruebas unitarias, integración, consumo/API contract o E2E fallando;
- cobertura por debajo del umbral exigido por stack o criticidad;
- `tenant_id` mal resuelto, CORS incompleto o vulnerabilidad OWASP abierta;
- gaps P0 contra la spec o tasks incompletas;
- evidencia ausente, inconsistente o no reproducible.

---

## Las 7 Dimensiones de Revisión

### D1 — Funcionalidad (peso: 25%)
Verifica que la implementación cumple los escenarios Gherkin de la spec.

**Chequeos**:
- [ ] Cada escenario P0 tiene tests que lo cubren
- [ ] Cada escenario P1 está implementado (puede no tener test aún)
- [ ] No hay funcionalidad implementada que no esté en la spec (scope creep)
- [ ] Edge cases del spec manejados

**Rubrica**:
- 90-100: Todos los P0 y P1 cubiertos sin scope creep
- 70-89: Todos los P0 cubiertos, algunos P1 pendientes
- < 70: P0s incompletos → **FAIL automático**

---

### D2 — Tests (peso: 20%)
Evalúa cobertura, calidad y correctness de los tests automatizados.

**Chequeos**:
```bash
npm run test:cov   # coverage report
npm test           # todos los tests pasan
```

- [ ] Coverage ≥ 85% en líneas del código nuevo
- [ ] Tests siguen patrón Arrange / Act / Assert
- [ ] Tests son deterministas (no dependen de orden ni de tiempo real)
- [ ] Mocks usados apropiadamente (sin over-mocking)
- [ ] Nombres de tests describen el comportamiento esperado

**Rubrica**:
- 90-100: Coverage ≥ 90%, tests claros, deterministas
- 70-89: Coverage 85-90%, algunos tests vagos
- < 70: Coverage < 85% o tests no deterministas → **FAIL automático**

---

### D3 — Rendimiento (peso: 10%)
Analiza complejidad algorítmica y posibles cuellos de botella.

**Chequeos**:
- [ ] Sin N+1 queries (queries dentro de loops)
- [ ] Índices de BD definidos para todas las queries del spec
- [ ] Paginación en endpoints que devuelven listas
- [ ] Respuestas de API < 500ms bajo carga normal estimada

**Señales de alerta**:
```typescript
// RED: N+1 query
for (const item of items) {
  await repository.findOne(item.id); // query por cada item
}

// GREEN: batch query
const ids = items.map(i => i.id);
await repository.findByIds(ids); // una sola query
```

---

### D4 — Arquitectura (peso: 20%)
Revisa principios de diseño, acoplamiento y patrones del repo.

**Chequeos**:
- [ ] Estructura de directorios sigue el patrón maduro de referencia
- [ ] Sin dependencias circulares entre módulos
- [ ] Responsabilidad única: cada archivo tiene un propósito claro
- [ ] Inversión de dependencias: servicios dependen de interfaces/tokens, no de implementaciones concretas
- [ ] Sin lógica de negocio en controllers o lambda handlers (va en services/handlers)

---

### D5 — Seguridad (peso: 15%)
Escaneo OWASP Top 10 y validación multi-tenant.

**Chequeos críticos (BLOCKER si falla)**:
- [ ] **Multi-Tenant**: `tenant_id` extraído de JWT en TODOS los endpoints
  ```typescript
  // CORRECTO
  const tenantId = req.user['custom:tenant_id']; // de JWT guard
  
  // INCORRECTO — BLOCKER
  const tenantId = req.body.tenantId; // nunca del body
  const tenantId = req.params.tenantId; // nunca de params
  ```
- [ ] **Autorización**: Guards aplicados a todos los endpoints (no solo el controller sino cada método)
- [ ] **Validación de inputs**: DTOs usan class-validator, no validación manual
- [ ] **SQL Injection**: TypeORM/query builder, no string concatenation en queries
- [ ] **Exposición de datos**: Respuestas no incluyen campos sensibles (passwords, tokens)
- [ ] **CORS**: Headers correctos en Lambdas para métodos GET/POST/PUT/DELETE/OPTIONS

---

### D6 — Mantenibilidad (peso: 5%)
Legibilidad, documentación inline y facilidad de modificación.

**Chequeos**:
- [ ] Sin "magic numbers" sin comentar
- [ ] Funciones de > 30 líneas con comentario de propósito
- [ ] Nombres de variables descriptivos (no `data`, `item`, `res` como variables de negocio)
- [ ] TODOs tienen issue o task asociado

---

### D7 — Documentación (peso: 5%)
Completitud de OpenAPI, ADRs y README actualizados.

**Chequeos**:
- [ ] Nuevos endpoints documentados en OpenAPI/Swagger
- [ ] ADRs creados para decisiones arquitectónicas del change
- [ ] README actualizado si el setup cambió
- [ ] CHANGELOG tiene entrada del change (si existe)

---

## Formato de Reporte de Review

```markdown
## Resultado de Review — [nombre del change]

**Veredicto**: ✅ PASS | ❌ FAIL  
**Score**: [X]/100

| Dimensión | Score | Estado | Issues |
|-----------|-------|--------|--------|
| D1 Funcionalidad | 92 | ✅ | — |
| D2 Tests | 87 | ✅ | Coverage 87% (mínimo 85%) |
| D3 Rendimiento | 75 | ⚠️ | N+1 query en listado de ítems |
| D4 Arquitectura | 95 | ✅ | — |
| D5 Seguridad | 60 | ❌ BLOCKER | tenant_id tomado del body en endpoint POST /items |
| D6 Mantenibilidad | 80 | ✅ | — |
| D7 Documentación | 70 | ⚠️ | OpenAPI no actualizado |

### Issues Críticos (BLOCKERs)
- **[D5-01]** `POST /api/items`: `tenantId` tomado de `req.body.tenantId` en lugar de JWT
  - Archivo: `src/modules/items/items.controller.ts:45`
  - Fix: `const tenantId = req.user['custom:tenant_id']`

### Warnings
- **[D3-01]** Loop con query en `ItemsService.buildReport()` — considerar batch query
- **[D7-01]** Endpoint `GET /api/items` no documentado en Swagger

### Decisión
- BLOCKERs = 0, errores = 0, warnings críticas = 0 y evidencia completa → PASS → continuar con `/gd:verify`
- Cualquier BLOCKER, error, warning crítica o evidencia incompleta → FAIL → corregir y re-ejecutar `/gd:review`
```

---

## Uso

```
/gd:review
/gd:review [slug]   # review de un change específico
```

---

## Quality Gates (umbrales mínimos para PASS)

| Dimensión | Mínimo para PASS |
|-----------|-----------------|
| D1 Funcionalidad | **100%** de escenarios P0 implementados y cubiertos |
| D2 Tests | Coverage ≥ 85% y todas las suites en verde |
| D3 Rendimiento | Sin N+1, sin regresión evidente en happy path |
| D4 Arquitectura | Sin violaciones críticas del patrón del repo |
| D5 Seguridad | **0 vulnerabilidades OWASP**, tenant_id desde JWT y CORS completo |
| D6 Mantenibilidad | Score ≥ 80 |
| D7 Documentación | Endpoints, evidencia y cambios técnicos documentados |

### Política de veredicto severo

`/gd:review` no emite aprobaciones parciales para cambios productivos.

- `PASS`: sin BLOCKERs, sin errores, sin gaps P0, cobertura suficiente y evidencia completa.
- `FAIL`: cualquier defecto crítico, warning no tolerable o inconsistencia funcional.

---

## Integración con Razonamiento

Para módulos de alta criticidad (pagos, permisos, cálculos financieros):

```
/gd:razonar --modelo=rlm-verificacion [módulo a revisar]
```

Para detectar asunciones ocultas en el código:

```
/gd:razonar --modelo=mapa-territorio [sección de código que inquieta]
```

---

## Siguiente Paso
- Si `PASS` → ejecutar `/gd:verify` como gate final de conformidad total
- Si `FAIL` → resolver defectos, volver a implementación y re-ejecutar `/gd:review`

## Bucle de Orquestación del Ciclo de Vida

```text
/gd:start
   ↓
/gd:implement
   ↓
/gd:review   ← gate central severo
   ├─ FAIL → volver a /gd:implement con defectos exactos
   └─ PASS → /gd:verify
                ├─ FAIL → volver a /gd:implement
                └─ PASS → /gd:archive
```

Este comando debe comportarse como el árbitro central del ciclo de vida: preciso, reproducible, estricto y orientado a cero errores.

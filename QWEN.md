## QWEN.md — Ultra-Light (para Qwen Code)

**Versión**: 5.0 | **Optimizado**: 2026-04-09 | **Tokens**: ~1,800

**Importante**: Este archivo se carga AUTOMÁTICAMENTE al iniciar Qwen Code en este repositorio.

---

### 6 Reglas de Hierro (OBLIGATORIAS, sin excepciones)

1. **Multi-tenant**: `tenantId` SIEMPRE desde JWT (`custom:tenant_id`), **NUNCA** de body/params/query
2. **TDD obligatorio**: RED → GREEN → REFACTOR, coverage ≥ 85%
3. **Copiar patrones maduros**: `fnTransaccionLineas` (Lambda), `servicio-tesoreria` (NestJS)
4. **ResponseBuilder**: todas las lambdas usan `utils/responseBuilder.mjs` — NO devolver respuestas crudas
5. **Memory first**: consultar `project.md`/`registry.md` o `npm run rag:query` antes de responder
6. **Orquestación gd obligatoria**: seguir estrictamente `/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive`

---

### Orquestación obligatoria del ciclo de vida

- todo requerimiento debe aterrizarse primero con `/gd:start`;
- `/gd:review` es el orquestador central y no se omite;
- no hay PASS parcial, cierre provisional ni certificación incompleta;
- el cierre formal exige `CONSUMO.md`, `EVIDENCE.md` y contratos actualizados.

---

### Optimización de Tokens (AUTOMÁTICA)

#### ❌ NO HACER (gasta tokens innecesarios)
- NO cargar `AGENTS.md` completo (128 KB, ~32,000 tokens)
- NO explicar patrones que ya existen en `PATTERNS-CACHE.md`
- NO incluir documentación extensa en respuestas
- NO leer todos los comandos `/gd:*` — usar `COMMANDS-INDEX.md`

#### ✅ HACER (ahorra 85%+ tokens)
- Usar **lazy loading**: cargar solo módulos de `.agents-core/` según la tarea
- **Referenciar** patrones: "Pattern #1 (PATTERNS-CACHE.md)" en lugar de explicar
- **Consultar RAG** para dudas específicas: `npm run rag:query -- "pregunta"`
- Respuestas concisas: código + explicación mínima necesaria

---

### Lazy Loading Index (cargar solo según tarea)

| Tarea | Archivo | Tokens | Cuándo |
|-------|---------|--------|--------|
| **Multi-tenant / Auth** | `.agents-core/multi-tenant.md` | ~2,500 | Lambdas o NestJS con auth |
| **Crear Lambda** | `.agents-core/lambdas-pattern.md` | ~4,000 | Nueva lambda o modificar |
| **Crear NestJS** | `.agents-core/nestjs-pattern.md` | ~6,000 | Nuevo módulo/controller |
| **Tests** | `.agents-core/testing-rules.md` | ~2,500 | Escribir o ejecutar tests |
| **SAGA / Orquestador** | `.agents-core/saga-pattern.md` | ~3,000 | Lambdas en SAGA |
| **Comando /gd:*** | `COMMANDS-INDEX.md` | ~2,000 | Usuario ejecuta comando |
| **Snippets** | `PATTERNS-CACHE.md` | ~50 | Referenciar, no copiar completo |

**Contexto base**: ~1,800 tokens (este archivo)  
**Con 1 módulo**: ~4,300-7,800 tokens  
**VS antes**: 32,000-74,600 tokens (**-75-95%**)

---

### Patrones de Referencia (NO explicar, solo copiar)

**Para snippets listos**: `PATTERNS-CACHE.md`

| # | Patrón | Ubicación real |
|---|--------|----------------|
| 1 | extractTenantId | `lib/lambda/transacciones/fnTransaccionLineas/utils/sanitization.mjs` |
| 2 | ResponseBuilder | `lib/lambda/transacciones/fnTransaccionLineas/utils/responseBuilder.mjs` |
| 3 | Router lastSegment | `lib/lambda/transacciones/fnTransaccion/index.mjs` |
| 4 | JwtTenantGuard | `servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` |
| 5 | Controller MT | `servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts` |
| 6 | Entity TypeORM | `servicio-tesoreria/src/tesoreria/entities/caja.entity.ts` |
| 7 | QueryRunner TX | `servicio-tesoreria/src/tesoreria/services/caja.service.ts` |

---

### Comandos SDD (usar `COMMANDS-INDEX.md` para catálogo)

#### Pipeline Principal
- `/gd:start` — Iniciar tarea con detección de complejidad
- `/gd:specify` — Especificación Gherkin
- `/gd:implement` — TDD (RED→GREEN→REFACTOR)
- `/gd:review` — Peer review 7 dimensiones
- `/gd:verify` — Validar vs SPEC

#### Testing
- `/gd:validar-spec` — Validar calidad de SPEC
- `/gd:tea` — Testing E2E autónomo backend
- `/gd:playwright` — Testing E2E frontend

#### Sesión
- `/gd:reflexionar` — Lecciones aprendidas
- `/gd:time-travel` — Ver decisiones pasadas

---

### Multi-Entorno (este repo usa 4 herramientas)

| Herramienta | Archivo de contexto | Optimización |
|-------------|---------------------|--------------|
| **Claude Code** | `CLAUDE.md` | ✅ Automática |
| **OpenCode** | `OPENCODE.md` | ✅ Automática |
| **Qwen Code** | `QWEN.md` (este archivo) | ✅ Automática |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Automática |

**Regla**: Cada herramienta lee su archivo específico. Todos aplican las mismas 5 reglas de oro y lazy loading.

---

### Cognito User Pools

| Tipo | User Pool ID | Servicios |
|------|--------------|-----------|
| **Microservicios NestJS** | `us-east-1_gmre5QtIx` | servicio-contabilidad, servicio-tesoreria, etc. |
| **Lambdas + API Gateway** | `us-east-1_fQl9BKSxq` | lib/lambda/*, servicio-transacciones, etc. |

---

### Memoria Persistente (Engram)

- **Guardar**: `mem_save` después de decisiones, completados, descubrimientos
- **Buscar**: `mem_search` cuando pregunten sobre cosas pasadas
- **Cerrar sesión**: `mem_session_summary` (obligatorio)
- **Datos**: `engineering-knowledge-base/` con sync via git

---

### Para reglas completas

Ver `AGENTS.md` (128 KB) — **cargar solo la sección relevante**, nunca el archivo completo.

Documentación de optimización: `docs/TOKEN-OPTIMIZATION-STRATEGY.md`

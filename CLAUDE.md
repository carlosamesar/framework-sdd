## CLAUDE.md — Ultra-Light (para Claude Sonnet)

**Versión**: 3.0 | **Optimizado**: 2026-04-09 | **Tokens**: ~1,200 (vs 32,000 de AGENTS.md completo)

### 5 Reglas de Hierro (OBLIGATORIAS, sin excepciones)

1. **Multi-tenant**: `tenantId` SIEMPRE desde JWT (`custom:tenant_id`), **NUNCA** de body/params/query
2. **TDD obligatorio**: RED → GREEN → REFACTOR, coverage ≥ 85% en módulos de negocio
3. **Copiar patrones maduros**: `fnTransaccionLineas` (Lambda), `servicio-tesoreria` (NestJS) — **NO inventar**
4. **ResponseBuilder**: todas las lambdas usan `utils/responseBuilder.mjs` — **NO devolver respuestas crudas**
5. **Memory first**: consultar `project.md`/`registry.md` o `npm run rag:query` antes de responder

---

### Lazy Loading (NO cargar AGENTS.md completo)

**Regla**: Leer solo la sección específica necesaria según la tarea:

| Tipo de tarea | Qué leer | Líneas aprox. |
|---------------|----------|---------------|
| **Lambda nueva** | `AGENTS.md` § "Lambdas en lib/lambda" | 235-700 |
| **NestJS nuevo** | `AGENTS.md` § "Microservicios NestJS" | 800-2100 |
| **Comando /gd:*** | `.claude/commands/gd/[nombre].md` | archivo individual |
| **Seguridad** | `AGENTS.md` § "Seguridad y Multi-Tenant" | 120-230 |
| **Testing** | `AGENTS.md` § "Pruebas, TDD/BDD" | 700-1100 |

**Si no estás seguro qué sección**: consultar RAG primero (`npm run rag:query -- "pregunta"`)

---

### Comandos Rápidos (referencia)

```bash
# Memory/Decisiones pasadas
npm run rag:query -- "cómo extraer tenantId"

# Validar SPEC
npm run spec:validate

# Tests del módulo
cd lib/lambda/transacciones && npm test

# Ver estado del proyecto
cat engineering-knowledge-base/project.md
```

---

### Patrones de Referencia (NO explicar, solo copiar)

**Lambda madura**: `lib/lambda/transacciones/fnTransaccionLineas/`
- Router: `index.mjs`
- Tenant: `utils/sanitization.mjs` → `extractTenantId()`
- Respuestas: `utils/responseBuilder.mjs`
- BD: `utils/database.mjs` (pool singleton)

**NestJS maduro**: `servicio-tesoreria/src/`
- Controller: `tesoreria/controllers/caja.controller.ts`
- Service: `tesoreria/services/caja.service.ts`
- Guard: `common/guards/jwt-tenant.guard.ts` (global en AppModule)
- Decoradores: `common/decorators/tenant-id.decorator.ts` → `@TenantId()`

---

### Para reglas completas

Ver `AGENTS.md` (128 KB, ~32,000 tokens) — **cargar solo la sección relevante**, nunca el archivo completo.

Documentación de optimización de tokens: `docs/TOKEN-OPTIMIZATION-STRATEGY.md`

---

## Memoria Persistente (Engram)

El protocolo completo está en **AGENTS.md** (sección "Memoria Persistente (Engram)").

**Resumen rápido**:
- **Guardar**: `mem_save` después de decisiones, completados, descubrimientos
- **Buscar**: `mem_search` cuando pregunten sobre cosas pasadas
- **Cerrar sesión**: `mem_session_summary` (obligatorio)
- **Datos**: `engineering-knowledge-base/` con sync automático via git

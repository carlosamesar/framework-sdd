## GEMINI.md — Ultra-Light (para Gemini)

**Versión**: 4.0 | **Optimizado**: 2026-04-09 | **Tokens**: ~1,500

### 5 Reglas de Hierro (OBLIGATORIAS)

1. **Multi-tenant**: `tenantId` SIEMPRE desde JWT (`custom:tenant_id`), **NUNCA** de body/params/query
2. **TDD obligatorio**: RED → GREEN → REFACTOR, coverage ≥ 85%
3. **Copiar patrones maduros**: `fnTransaccionLineas` (Lambda), `servicio-tesoreria` (NestJS)
4. **ResponseBuilder**: todas las lambdas usan `utils/responseBuilder.mjs`
5. **Memory first**: consultar `project.md`/`registry.md` o RAG antes de responder

---

### Lazy Loading (NO cargar AGENTS.md completo)

| Tarea | Qué cargar |
|-------|------------|
| **Multi-tenant** | `.agents-core/multi-tenant.md` |
| **Lambda nueva** | `.agents-core/lambdas-pattern.md` |
| **NestJS nuevo** | `.agents-core/nestjs-pattern.md` |
| **Tests** | `.agents-core/testing-rules.md` |
| **SAGA** | `.agents-core/saga-pattern.md` |
| **Comando /gd:*** | `COMMANDS-INDEX.md` → luego `gd/[nombre].md` |
| **Snippets** | `PATTERNS-CACHE.md` |

**AGENTS.md completo** (2,872 líneas, ~32,000 tokens) — cargar solo sección relevante.

---

### Patrones de Referencia

**Lambda**: `lib/lambda/transacciones/fnTransaccionLineas/`  
**NestJS**: `servicio-tesoreria/src/`

Para snippets listos: `PATTERNS-CACHE.md`

---

## Memoria Persistente (Engram)

Ver `AGENTS.md` § "Memoria Persistente (Engram)" para protocolo completo.

**Resumen**:
- `mem_save`: después de decisiones, completados, descubrimientos
- `mem_search`: cuando pregunten sobre cosas pasadas
- `mem_session_summary`: al cerrar sesión (obligatorio)
- Datos: `engineering-knowledge-base/`

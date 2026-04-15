## QWEN.md — Ultra-Light

**Versión**: 6.0 | **Meta**: >95% ahorro de tokens

### Cargar en este orden
1. este archivo
2. `AGENTS.md`
3. **un solo** módulo de `.agents-core/` si hace falta
4. `COMMANDS-INDEX.md` solo si el usuario invoca un comando `gd:*`
5. `PATTERNS-CACHE.md` para snippets repetidos

### Reglas obligatorias
- usar `/gd:start` para aterrizar requerimientos ambiguos;
- TDD: RED → GREEN → REFACTOR;
- `tenantId` solo desde JWT (`custom:tenant_id`);
- reutilizar patrones maduros del repo;
- no cerrar sin evidencia real.

### Módulos bajo demanda
- auth: `.agents-core/multi-tenant.md`
- lambda: `.agents-core/lambdas-pattern.md`
- nest: `.agents-core/nestjs-pattern.md`
- testing: `.agents-core/testing-rules.md`
- saga: `.agents-core/saga-pattern.md`

Si la duda es puntual, consultar RAG antes de abrir documentación extensa.

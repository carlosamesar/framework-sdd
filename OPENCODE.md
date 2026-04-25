# OPENCODE.md — Ultra-Light para OpenCode

**Version**: 1.1 | **Optimizado**: 2026-04-17 | **Tokens**: ~700

**Importante**: Este archivo se carga AUTOMÁTICAMENTE al iniciar OpenCode en este repositorio.

---

## 5 Reglas de Hierro

1. **Multi-tenant**: `tenantId` siempre desde JWT (`custom:tenant_id`), nunca desde body, params o query.
2. **TDD obligatorio**: RED -> GREEN -> REFACTOR, coverage objetivo >= 85%.
3. **Copiar patrones maduros**: Lambda base `fnTransaccionLineas`, NestJS base `servicio-tesoreria`.
4. **ResponseBuilder**: no devolver respuestas crudas en lambdas.
5. **Memory first**: consultar `project.md`, `registry.md` o el sistema RAG antes de asumir contexto.

---

## Carga Minima

### No hacer
- No cargar [AGENTS.md](AGENTS.md) completo salvo que haga falta una politica puntual.
- No explicar patrones ya resumidos en [PATTERNS-CACHE.md](PATTERNS-CACHE.md).
- No leer todos los `/gd:*`; usar [COMMANDS-INDEX.md](COMMANDS-INDEX.md).
- No arrastrar documentacion extensa al prompt base.

### Hacer
- Cargar solo el modulo de [.agents-core/](.agents-core/) que aplique.
- Referenciar patrones por nombre y archivo en vez de reexplicarlos.
- Consultar RAG solo para dudas concretas.
- Responder con codigo y explicacion minima.

---

## Lazy Loading Index

| Tarea | Archivo | Cuándo |
|-------|---------|--------|
| Multi-tenant o auth | `.agents-core/multi-tenant.md` | Lambdas o NestJS con JWT |
| Crear o tocar Lambda | `.agents-core/lambdas-pattern.md` | API Gateway, handlers, ResponseBuilder |
| Crear o tocar NestJS | `.agents-core/nestjs-pattern.md` | controllers, guards, services |
| Tests | `.agents-core/testing-rules.md` | TDD, coverage, Playwright, gates |
| SAGA | `.agents-core/saga-pattern.md` | orquestacion, pasos, compensaciones |
| Catalogo `/gd:*` | `COMMANDS-INDEX.md` | elegir comando sin leer todos |
| Frontend Angular | skill `gd-frontend` (via `/gd:frontend`) | formularios, shell, facade, autocomplete; estricto con `/treasury/inflows/new` y `/purchases/orders/new` |
| Snippets | `PATTERNS-CACHE.md` | copiar ruta correcta rapido |

Contexto base: ~700 tokens.
Con 1 modulo: ~1.2k-2.2k tokens.
Contra cargar docs largas y comandos completos: ahorro objetivo >95%.

---

## Patrones de Referencia

Para snippets listos, usar [PATTERNS-CACHE.md](PATTERNS-CACHE.md).

| # | Patron | Ubicacion real |
|---|--------|----------------|
| 1 | extractTenantId | `lib/lambda/transacciones/fnTransaccionLineas/utils/sanitization.mjs` |
| 2 | ResponseBuilder | `lib/lambda/transacciones/fnTransaccionLineas/utils/responseBuilder.mjs` |
| 3 | Router lastSegment | `lib/lambda/transacciones/fnTransaccion/index.mjs` |
| 4 | JwtTenantGuard | `servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` |
| 5 | Controller MT | `servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts` |
| 6 | Entity TypeORM | `servicio-tesoreria/src/tesoreria/entities/caja.entity.ts` |
| 7 | QueryRunner TX | `servicio-tesoreria/src/tesoreria/services/caja.service.ts` |

---

## Comandos SDD

Ver [COMMANDS-INDEX.md](COMMANDS-INDEX.md). No cargar cada comando salvo que el usuario lo ejecute o lo pida.

---

## Multi-Entorno

| Herramienta | Archivo |
|-------------|---------|
| Claude | `CLAUDE.md` |
| Copilot | `.github/copilot-instructions.md` |
| OpenCode | `OPENCODE.md` |
| Qwen | `QWEN.md` |

Regla: cada herramienta carga su archivo minimo y deriva a los mismos indices compartidos.

---

## Cognito User Pools

| Tipo | User Pool ID | Servicios |
|------|--------------|-----------|
| **Microservicios NestJS** | `us-east-1_gmre5QtIx` | servicio-contabilidad, servicio-tesoreria, etc. |
| **Lambdas + API Gateway** | `us-east-1_fQl9BKSxq` | lib/lambda/*, servicio-transacciones, etc. |

---

## Memoria Persistente

- Guardar decisiones y bugfixes.
- Buscar contexto previo antes de asumir.
- Cerrar sesion con resumen.

---

## Para reglas completas

Ver [AGENTS.md](AGENTS.md) solo por seccion puntual.

Estrategia de optimizacion: [docs/TOKEN-OPTIMIZATION-STRATEGY.md](docs/TOKEN-OPTIMIZATION-STRATEGY.md)

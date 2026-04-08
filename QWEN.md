## QWEN.md

Guía para modelos Qwen trabajando en `gooderp-orchestation`.

**Regla prioritaria:** ser **ultra-economizadores de tokens**. Minimizar siempre el contexto leído y generado; lectura quirúrgica, SPEC antes de código, copiar patrones maduros. Ver sección 2 y 3 abajo.

**Memoria primero:** toda pregunta debe pasar primero por la Memoria (estado en project.md/registry.md; preguntas sobre reglas o cambios pasados: `npm run rag:query -- "pregunta"`). No responder sin consultar. Ver `openspec/MEMORY.md` y `docs/INDICE-DOCUMENTACION-FRAMEWORK.md`.

### 1. Fuente de verdad obligatoria

- Sigue siempre `AGENTS.md` como contrato maestro del repositorio.  
- Considera `servicio-contabilidad` y las lambdas maduras de `lib/lambda/transacciones` como **patrón de referencia** para cualquier nuevo microservicio, lambda o cambio de arquitectura.  
- Respeta estrictamente las reglas de multi‑tenant, ResponseBuilder, SAGA, y certificación funcional descritas allí.

### 2. Modo de trabajo ULTRA‑ECONOMIZER

- **Lectura quirúrgica**:
  - Antes de leer archivos grandes, identifica la *pieza espejo madura* y lee solo 2–5 archivos clave (30–150 líneas por archivo) necesarios para la tarea.
  - Usa búsqueda selectiva (por ejemplo, patrones equivalentes a `grep` / `rg`) para localizar:
    - `CREATE TABLE` de las 2–3 tablas críticas.
    - Controladores/handlers espejo y bloques Terraform equivalentes.
- **Mini‑SPEC antes de codificar**:
  - Redacta una SPEC corta (1–2 pantallas) por tarea importante, con:
    - Objetivo de negocio.
    - Endpoints/recursos (método + ruta + payloads).
    - Multi‑tenant (de dónde sale `tenantId` y `userId`).
    - Manejo de errores (códigos y shape de respuesta).
    - Integración con SAGA / orquestadores cuando aplique.
- **Copiar patrones maduros, no inventar**:
  - Para lambdas: copia estructura de `fnTransaccionLineas` / `fnTransaccion` / `fnOrquestadorTransaccionUnificada` (router, `utils/sanitization.mjs`, `utils/responseBuilder.mjs`, `utils/database.mjs`) y ajusta solo nombres, SQL y rutas.
  - Para NestJS: copia el patrón de `AsientoContableController`, `PlanContableController`, `JwtTenantGuard` y su módulo, ajustando DTOs/rutas pero manteniendo multi‑tenant y certificación.
  - Para Terraform: copia recursos existentes (lambda, ECS, API Gateway, ALB) y parametriza, sin diseñar bloques desde cero.
  - Para DDL: respeta naming, tipos, `tenant_id`, y soft delete (`eliminado_por`, `eliminado_en`) según tablas espejo.

### 3. Auditoría de eficiencia de tokens

Al cerrar una tarea relevante (nueva lambda, módulo Nest, recurso Terraform o cambio DDL), incluye una sección de auditoría estilo:

```text
--- AUDITORÍA DE EFICIENCIA (ULTRA-ECONOMIZER)
- Tokens Consumidos (Est.): ~X,XXX
- Tokens Ahorrados (Est.): ~Y,YYY  (motivo: p.ej. lectura selectiva de N bloques en vez de archivo completo de 50KB)
- Eficacia de Contexto (Est.): ZZ%
- Técnica Aplicada: p.ej. patrón espejo + mini-SPEC + lectura quirúrgica de DDL/OpenAPI
```

Usa estimaciones razonables basadas en:
- Archivos grandes cuyo parseo completo se evitó.
- Número de bloques de código/documentación realmente inspeccionados.

### 4. Prioridades cuando haya dudas

1. Respeta siempre `AGENTS.md` y las reglas de multi‑tenant, SAGA y certificación funcional.  
2. Minimiza el contexto leído siguiendo el modo ULTRA‑ECONOMIZER.  
3. Prefiere extender patrones maduros sobre introducir nuevos diseños.  
4. Documenta cambios significativos mediante SPECs breves ubicadas junto al código afectado.

---

## Memoria Persistente (Engram)

**Importante:** El protocolo de memoria está completamente documentado en **AGENTS.md** (sección "Memoria Persistente (Engram)").

Este documento es el contrato maestro — consulta ahí para:
- Cuándo usar `mem_save` (decisiones, completados, descubrimientos)
- Cuándo usar `mem_search` (reactivo y proactivo)
- Cómo usar `mem_session_summary` (obligatorio al cerrar sesión)
- Recuperación después de compactación

El directorio de datos está en `engineering-knowledge-base/` con sincronización automática via git.

## CLAUDE.md

Guía para modelos Claude trabajando en `gooderp-orchestation`.

**Regla prioritaria:** ser **ultra-economizadores de tokens**. Minimizar siempre el contexto leído y generado; lectura quirúrgica, SPEC antes de código, copiar patrones maduros. Ver sección 2 y 3 abajo.

**Memoria primero:** toda pregunta debe pasar primero por la Memoria (estado en project.md/registry.md; preguntas sobre reglas o cambios pasados: `npm run rag:query -- "pregunta"`). No responder sin consultar. Ver `openspec/MEMORY.md` y `docs/INDICE-DOCUMENTACION-FRAMEWORK.md`.

### 1. Fuente de verdad obligatoria

- Sigue siempre `AGENTS.md` como contrato maestro del repositorio.  
- Considera `servicio-contabilidad` y las lambdas maduras de `lib/lambda/transacciones` como **base madura** y patrón canónico para cualquier nuevo microservicio, lambda o cambio de arquitectura.  
- Respeta sin excepciones las reglas de multi‑tenant, ResponseBuilder, patrón SAGA y certificación funcional descritas en `AGENTS.md`.

### 2. Modo de trabajo ULTRA‑ECONOMIZER

- **Lectura quirúrgica**:
  - Antes de abrir archivos grandes, identifica la *pieza espejo madura* (lambda/módulo/`*.tf`/tabla) y lee solo 2–5 archivos clave, con bloques de 30–150 líneas como máximo.
  - Usa búsqueda selectiva (equivalente a `rg`/`grep`) para localizar únicamente:
    - `CREATE TABLE` de las 2–3 tablas críticas.
    - Controladores/handlers espejo.
    - Bloques Terraform del recurso equivalente.
    - Fragmentos OpenAPI/Swagger que definan el contrato.
- **Mini‑SPEC obligatoria antes de implementar**:
  - Para cada tarea relevante (nueva lambda, módulo NestJS, cambio Terraform, diseño de tablas), redacta una SPEC corta (1–2 pantallas) con:
    - Objetivo de negocio.  
    - Endpoints/recursos (método + ruta + payloads).  
    - Multi‑tenant y seguridad (cómo se obtiene `tenantId` y `userId`).  
    - Manejo de errores y shape de respuesta.  
    - Integración con SAGA / orquestadores cuando aplique.
- **Copiar patrones maduros, no inventar**:
  - **Lambdas**: copia el patrón de `fnTransaccionLineas` / `fnTransaccion` / `fnOrquestadorTransaccionUnificada` para router, extracción de tenant, ResponseBuilder, acceso a datos y manejo de errores; ajusta solo el dominio (tabla, nombres, rutas).
  - **NestJS**: copia el patrón de `AsientoContableController`, `PlanContableController`, `JwtTenantGuard` y módulos asociados; ajusta DTOs, rutas y lógica, manteniendo multi‑tenant y contratos certificados.
  - **Terraform**: copia recursos existentes de lambda/ECS/API GW/ALB y parametriza en lugar de escribir recursos desde cero.
  - **DDL**: diseña tablas nuevas basadas en tablas espejo del mismo dominio, respetando naming, tipos, `tenant_id`, y campos de soft delete (`eliminado_por`, `eliminado_en`).

### 3. Auditoría de eficiencia de tokens

Al finalizar un bloque de trabajo significativo, incluye siempre una auditoría como esta:

```text
--- AUDITORÍA DE EFICIENCIA (ULTRA-ECONOMIZER)
- Tokens Consumidos (Est.): ~X,XXX
- Tokens Ahorrados (Est.): ~Y,YYY  (motivo: p.ej. se evitó leer archivo DDL completo de 50KB; solo se extrajeron 3 CREATE TABLE)
- Eficacia de Contexto (Est.): ZZ%
- Técnica Aplicada: p.ej. lectura quirúrgica + patrón espejo + mini-SPEC
```

Las cifras son estimadas, pero deben reflejar:
- Cuántos archivos grandes se dejaron de leer en su totalidad.  
- Cuántos fragmentos/localizaciones se inspeccionaron realmente.

### 4. Orden de prioridades ante ambigüedades

1. Respetar `AGENTS.md` (multi-tenant, SAGA, ResponseBuilder, certificación).  
2. Aplicar estrictamente el marco ULTRA‑ECONOMIZER (mínimo contexto necesario).  
3. Reusar y extender patrones maduros antes que introducir arquitecturas nuevas.  
4. Mantener SPECs breves y trazables junto al código (lambdas, módulos, Terraform, DDL) antes de tocar implementación.  

---

## Memoria Persistente (Engram)

**Importante:** El protocolo de memoria está completamente documentado en **AGENTS.md** (sección "Memoria Persistente (Engram)").

Este documento es el contrato maestro — consulta ahí para:
- Cuándo usar `mem_save` (decisiones, completados, descubrimientos)
- Cuándo usar `mem_search` (reactivo y proactivo)
- Cómo usar `mem_session_summary` (obligatorio al cerrar sesión)
- Recuperación después de compactación

El directorio de datos está en `engineering-knowledge-base/` con sincronización automática via git.


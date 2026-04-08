# AGENTS.md — Contrato Maestro de Implementación

> **Versión**: 2.0 | **Última actualización**: 2026-04-09 | **Estado**: Activo

Este documento establece las **reglas de implementación obligatorias** para cualquier agente, modelo de IA o desarrollador que trabaje en este repositorio. Todo está basado exclusivamente en código y documentación existente bajo `lib/lambda`, `servicio-contabilidad` y `servicio-tesoreria`.

---

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
   - [Memoria Persistente (Engram)](#memoria-persistente-engram)
2. [Seguridad y Multi‑Tenant](#seguridad-y-multi-tenant)
3. [Lambdas en `lib/lambda`](#lambdas-en-liblambda)
4. [Servicio de Contabilidad](#servicio-de-contabilidad)
5. [Reglas SEVERAS para Implementaciones](#reglas-severas-para-nuevas-implementaciones-refactors-y-spec-driven-development)
6. [Pruebas, TDD/BDD y Automatización](#pruebas-tddbdd-y-automatización)
7. [Infraestructura y Utilidades](#infraestructura-y-utilidades-en-el-monorepo)
8. [Microservicios NestJS](#microservicios-nestjs-implementación-y-migración-desde-lambdas)
9. [Autenticación y Credenciales](#autenticación-y-pruebas-manuales)
10. [Expectativas para Modelos y Agentes](#expectativas-para-modelos-y-agentes)
11. [Comandos SDD del Framework](#comandos-sdd-del-framework)
12. [Agentes Autonomos Especializados](#agentes-autonomos-especializados-sistema-de-orquesta)
13. [Zero Errors Policy](#zero-errors-policy-cero-errores)
14. [Compatibilidad Multi-IDE y Multi-Modelo](#compatibilidad-multi-ide-y-multi-modelo)
15. [Pipeline de Calidad Integral](#pipeline-de-calidad-integral)
16. [Comandos SDD Mejorados](#comandos-sdd-mejorados-con-implementación)
17. [Referencias Obligatorias](#referencias-obligatorias-canon-de-madurez)
18. [Checklist de Calidad por Cambio](#checklist-de-calidad-por-cambio)

---

## 1. Arquitectura General

**Memoria persistente (Engram):** Este proyecto usa Engram para memoria persistente que sobrevive entre sesiones y compactaciones. El directorio de datos está configurado en `engineering-knowledge-base/` con sincronización automática via git.

**Lineamiento obligatorio (entornos de desarrollo):** Los desarrolladores **deben** ejecutar en background los daemons de **Engram** (`scripts/engram-sync-daemon.sh`) y **RAG** (`scripts/rag-index-daemon.sh`), o instalar las unidades **systemd** equivalentes. Sin ello, la memoria no se sincroniza al repo remoto y el índice vectorial queda obsoleto. Guía: `docs/lineamiento-memoria-automatica.md`. Arranque: `scripts/start-memory-daemons.sh`.

- **Al guardar**: Usar `mem_save` después de decisiones, completados de trabajo, y descubrimientos
- **Al buscar**: Usar `mem_search` cuando el usuario pregunta sobre cosas pasadas, o proactivamente cuando se detecta trabajo relacionado
- **Al cerrar sesión**: Usar `mem_session_summary` con estructura definida (Goal, Instructions, Discoveries, Accomplished, Next Steps, Relevant Files)
- **Después de compactación**: Usar `mem_context` para recuperar estado antes de continuar
- Ver `engineering-knowledge-base/ENGRAM.md` para detalles de configuración

**Memoria SDD:** Toda pregunta o tarea debe pasar primero por la Memoria (estado en `project.md` / `registry.md`; preguntas sobre reglas o cambios pasados vía RAG: `npm run rag:query -- "pregunta"` o `node rag/scripts/query.mjs`). No responder sin consultar. Ver `openspec/MEMORY.md` y `docs/INDICE-DOCUMENTACION-FRAMEWORK.md`.

---

## Memoria Persistente (Engram)

Este proyecto usa **Engram** como sistema de memoria persistente que sobrevive entre sesiones y compactaciones. La configuración está orquestada desde AGENTS.md y debe ser seguida por todos los modelos (CLAUDE.md, GEMINI.md, QWEN.md).

### Configuración Centralizada

| Componente | Valor |
|------------|-------|
| Directorio de datos | `engineering-knowledge-base/` |
| Proyecto | `framework-sdd` |
| Sync Engram | Automático via git (**daemon obligatorio** en dev) |
| Sync RAG | Reindexado periódico (**daemon obligatorio** en dev; `RAG_INDEX_INTERVAL`) |
| MCP server | Cursor: `.cursor/mcp.json` / global `~/.cursor/mcp.json`; otros IDEs: `docs/mcp-engram-multi-ide.md` |

### Protocolo de Memoria (OBLIGATORIO para todos los modelos)

#### Cuándo GUARDAR (`mem_save`)
Llama **INMEDIATAMENTE** y **SIN QUE TE LO PIDAN** después de:

- **Decisiones o convenciones**: Arquitectura, diseño, team convention, workflow cambio, tool/library choice
- **Completar trabajo**: Bug fix completado (incluye root cause), feature implementada con approach no obvio, config/environment setup
- **Descubrimientos**: Gotcha, edge case, unexpected behavior, patrón establecido, user preference descubierta

Formato requerido:
```
- title: Verbo + qué — corto, searchable (ej: "Fixed N+1 query", "Chose Zustand over Redux")
- type: bugfix | decision | architecture | discovery | pattern | config | preference
- scope: project (default) | personal
- topic_key (opcional): key estable para topics que evolucionan
- content:
  - What: Una frase — qué se hizo
  - Why: Qué lo motivó (user request, bug, performance, etc.)
  - Where: Archivos o paths afectados
  - Learned: Gotchas, edge cases, cosas que te sorprendieron (omitir si none)
```

#### Cuándo BUSCAR (`mem_search`)
- **Reactivo**: Cuando el usuario dice "remember", "recall", "what did we do", "recordar", "acordate", "qué hicimos"
- **Proactivo**: Cuando empezás trabajo en algo que podría haber sido hecho antes, o cuando el usuario menciona un tema sin contexto

Flujo:
1. Primero `mem_context` — recupera historial de sesión reciente (rápido)
2. Si no encuentra, `mem_search` con keywords relevantes
3. Si encuentra algo, usar `mem_get_observation` para contenido completo

#### CIERRE DE SESIÓN (`mem_session_summary`) — OBLIGATORIO
Antes de terminar una sesión o decir "done" / "listo" / "that's it", **DEBES** llamar `mem_session_summary` con esta estructura:

```markdown
## Goal
[What we were working on this session]

## Instructions
[User preferences or constraints discovered — skip if none]

## Discoveries
- [Technical findings, gotchas, non-obvious learnings]

## Accomplished
- [Completed items with key details]

## Next Steps
- [What remains to be done — for the next session]

## Relevant Files
- path/to/file — [what it does or what changed]
```

#### DESPUÉS DE COMPACTACIÓN
Si ves mensaje de compactación o context reset, o ves "FIRST ACTION REQUIRED":
1. **INMEDIATAMENTE** llamar `mem_session_summary` con el contenido resumido de lo hecho antes
2. Luego `mem_context` para recuperar cualquier contexto adicional de sesiones previas
3. Solo **ENTONCES** continuar trabajando

> **No skipping step 1** — sin esto, todo lo hecho antes de la compactación se pierde de la memoria.

### Sincronización automática (Engram + RAG)

**Engram:** el daemon (`scripts/engram-sync-daemon.sh` o systemd `engram-sync-daemon.service`) corre en background y:
- Verifica cambios en la DB cada ~30 segundos
- Ejecuta `engram sync` para crear chunks
- Hace commit y push automático al repositorio git (requiere `ENGRAM_GIT_TOKEN` en `~/.config/framework-sdd/engram-daemon.env`)

**RAG:** el daemon (`scripts/rag-index-daemon.sh` o systemd `rag-index-daemon.service`) reejecuta `rag/scripts/index.mjs` cada `RAG_INDEX_INTERVAL` segundos (default 3600) para mantener `rag.document_chunks` alineado con los Markdown del repo.

Detalle operativo: `docs/lineamiento-memoria-automatica.md` y `engineering-knowledge-base/ENGRAM.md`.

**Principio de Lectura First:** antes de responder cualquier pregunta o comenzar una tarea, consultar la memoria del proyecto (`project.md`, `registry.md`). Para preguntas sobre decisiones pasadas o reglas, usar RAG: `npm run rag:query -- "pregunta"` (o `node rag/scripts/query.mjs`).

**Convenciones de nomenclatura:**
- Lambdas: `fn<Recurso>` (ej: `fnBanco`, `fnTransaccion`)
- Microservicios: `servicio-<dominio>` (ej: `servicio-contabilidad`, `servicio-tesoreria`)
- Entidades TypeORM: `<Recurso>Entidad` (ej: `CajaEntidad`, `BancoEntidad`)
- Servicios: `<Recurso>Service` (ej: `CajaService`, `BancoService`)
- Controladores: `<Recurso>Controller` (ej: `CajaController`, `BancoController`)
- DTOs: `Crear<Recurso>Dto`, `Actualizar<Recurso>Dto`, `<Recurso>ResponseDto`

---

## Las 3 Leyes de Hierro (OBLIGATORIAS)

No negociables. Siempre aplicadas. Sin excepciones.

| Ley | Principio | Aplicación Práctica |
|-----|-----------|---------------------|
| **I. TDD** | Todo código requiere tests | `RED` → `GREEN` → `REFACTOR`, sin excepciones |
| **II. Debugging** | Primero la causa raíz | Reproducir → Aislar → Entender → Corregir → Verificar |
| **III. Verificación** | Evidencia antes que afirmaciones | ✅ "Tests pasan" > ❌ "Creo que funciona" |
| **IV. Location** | El desarrollo es bajo `develop/` | Todo proyecto o código debe residir dentro del directorio `/develop` |
| **V. Evidence** | Certificación por evidencia | Todo cierre de implementación requiere un `EVIDENCE.md` con tests funcionales, endpoints y payloads |

---

## Flujo de Trabajo SDD (6 Fases)

Cada fase tiene **quality gates**. No se avanza sin pasar. **Sin atajos.**

| Fase | Comando SDD | Qué hace |
|------|-------------|----------|
| 1. **Specify** | `/gd:specify` | Convierte la idea en especificación Gherkin con escenarios de prueba, prioridades y esquema DBML |
| 2. **Clarify** | `/gd:clarify` | Un QA virtual detecta ambigüedades y contradicciones antes de programar |
| 3. **Plan** | `/gd:tech-plan` | Blueprint técnico con arquitectura, contratos API y esquema final |
| 4. **Break Down** | `/gd:breakdown` | Divide el plan en tareas concretas con orden de ejecución y paralelismo |
| 5. **Implement** | `/gd:implement` | Ejecuta con TDD estricto: test primero, luego código, luego mejorar |
| 6. **Review** | `/gd:review` | Peer review automático en 7 dimensiones: funcionalidad, tests, rendimiento, arquitectura, seguridad, mantenibilidad, docs |

---

## Detección de Complejidad Automática

No todo necesita las 6 fases. GAF detecta complejidad automáticamente:

| Nivel | Nombre | Cuándo | Fases |
|-------|--------|--------|-------|
| **0** | Atomic | 1 archivo, < 30 min | Implement → Verify |
| **P** | PoC | Validar factibilidad (2-4h) | Hypothesis → Build → Evaluate → Verdict |
| **1** | Micro | 1-3 archivos | Specify (light) → Implement → Review |
| **2** | Standard | Múltiples archivos, 1-3 días | Todas las 6 fases |
| **3** | Complex | Multi-módulo, 1-2 semanas | 6 fases + pseudocódigo |
| **4** | Product | Nuevo sistema, 2+ semanas | 6 fases + constitución + propuesta |

---

## Modelos de Razonamiento (15 disponibles)

Usar según el contexto para tomar mejores decisiones:

| Modelo | Comando SDD | Cuándo usarlos |
|--------|-------------|----------------|
| **Primeros Principios** | `/gd:razonar:primeros-principios` | Descomponer en verdades fundamentales |
| **5 Porqués** | `/gd:razonar:5-porques` | Análisis iterativo de causa raíz |
| **Pareto** | `/gd:razonar:pareto` | Focus 80/20 |
| **Inversión** | `/gd:razonar:inversion` | Resolver al revés: ¿cómo garatizo el fracaso? |
| **Segundo Orden** | `/gd:razonar:segundo-orden` | Consecuencias de las consecuencias |
| **Pre-mortem** | `/gd:razonar:pre-mortem` | Anticipar fallos antes de que ocurran |
| **Minimizar Arrepentimiento** | `/gd:razonar:minimizar-arrepentimiento` | Framework de Jeff Bezos |
| **Costo de Oportunidad** | `/gd:razonar:costo-oportunidad` | Evaluar alternativas sacrificadas |
| **Círculo de Competencia** | `/gd:razonar:circulo-competencia` | Conocer los límites del conocimiento |
| **Mapa vs Territorio** | `/gd:razonar:mapa-territorio` | Modelo vs realidad |
| **Probabilístico** | `/gd:razonar:probabilistico` | Razonar en probabilidades, no certezas |
| **Reversibilidad** | `/gd:razonar:reversibilidad` | ¿Esta decisión se puede deshacer? |
| **RLM Verificación** | `/gd:razonar:rlm-verificacion` | Verificación con sub-LLMs frescos |
| **RLM Cadena de Pensamiento** | `/gd:razonar:rlm-cadena-pensamiento` | Multi-paso Context Folding |
| **RLM Descomposición** | `/gd:razonar:rlm-descomposicion` | Dividir y conquistar con subagentes |

---

## Quality Gates (6 puertas obligatorias)

Puertas de calidad formales que se aplican en cada fase:

| Gate | Qué verifica | Criterio de paso |
|------|--------------|------------------|
| **Spec Gate** | La especificación es completa, no ambigua, medible | Gherkin con escenarios verificables |
| **TDD Gate** | Tests existen antes del código | RED → GREEN → REFACTOR verificado |
| **Coverage Gate** | Cobertura mínima de código | ≥ 85% en módulos de negocio |
| **OWASP Gate** | No vulnerabilidades de seguridad | 0 findings en OWASP Top 10 |
| **Architecture Gate** | Cumple principios de diseño | SOLID verificado, patrones respetados |
| **Docs Gate** | Documentación actualizada | OpenAPI, ADRs, README completos |

---

## Perfiles de Agente (Arquitectos)

6 arquetipos preconfigurados. Usar según el tipo de tarea:

| Perfil | Rol | Mejor para | Modelos de Razonamiento |
|--------|-----|------------|-------------------------|
| 👻 **Phantom Coder** | Full-stack | Pipeline completo, TDD, quality gates, deploy | Primeros Principios, Pre-mortem, 5 Porqués |
| 💀 **Reaper Sec** | Security | OWASP, auditorías, pentest, seguridad ofensa/defensa | Pre-mortem, Inversión, Primeros Principios |
| 🏗 **System Architect** | Architecture | Blueprints, SOLID, APIs, migraciones, diseño de sistemas | Primeros Principios, Segundo Orden, Mapa vs Territorio |
| ⚡ **Speedrunner** | MVP/Startup | PoCs rápidos, estimaciones ágiles, ship first | Pre-mortem, Pareto, Costo de Oportunidad |
| 🔮 **The Oracle** | Reasoning | 15 modelos mentales, análisis profundo, decisiones difíciles | Todos los modelos |
| 🥷 **Dev Dojo** | Learning | Docs vivos, ADRs, reflexiones, crecer construyendo | Primeros Principios, 5 Porqués, Segundo Orden |

---

## Métricas y Telemetría

Seguimiento 100% local. Ningún dato sale de la máquina.

- **Tasa de éxito TDD**: % de tareas que siguen RED → GREEN → REFACTOR
- **Tendencia de cobertura**: Evolución del coverage por módulo
- **Quality gates pass rate**: % de gates aprobada por fase
- **Precisión de estimaciones**: Comparación tiempo estimado vs real
- **Stubs detectados**: Código no implementado detectado automáticamente
- **Hallazgos OWASP**: Vulnerabilidades de seguridad por módulo

Comandos: `npm run metrics` o `npm run dashboard` para visualizar.

---

## 1. Arquitectura General

**Estructura de Directorios:** Por lineamiento obligatorio, todos los proyectos, microservicios y desarrollos deben crearse dentro del directorio `/develop`. No se permite la creación de proyectos fuera de esta ruta.

**Premisa SDD Fundamental:** Este proyecto sigue el marco **Specification-Driven Development (SDD)**. Toda implementación debe comenzar con una especificación verificable, pasar por quality gates, y demostrar evidencia antes de considerarse completa.

- **Backend híbrido**: Lambdas AWS (Node.js 20 ESM en `lib/lambda`) + microservicio NestJS de contabilidad (`servicio-contabilidad`) + Terraform IaC.
- **Base de datos**: PostgreSQL, con uso intensivo de JSONB y extensión pgVector en `servicio-contabilidad`.
- **Automatización avanzada en contabilidad**: `servicio-contabilidad` integra Redis, n8n, formularios dinámicos, IA sobre Bedrock y pgVector, según los módulos y docs bajo `servicio-contabilidad/docs` y `servicio-contabilidad/src`. El uso de BPMN/Camunda forma parte del diseño arquitectónico y está previsto para una fase posterior.
- **Patrón SAGA orquestado**: la solución implementa de forma explícita el patrón SAGA para coordinar transacciones distribuidas entre servicios (por ejemplo, contabilidad, tesorería y otros dominios), usando lambdas de orquestación como base madura de referencia. La integración con BPMN/Camunda para orquestación avanzada está planificada como evolución en una segunda fase.
- **Configuración de Entorno (Microservicios):** Todo microservicio debe incluir un archivo `.env.example` con las semillas de las variables de entorno necesarias (DB, API Keys, etc.). El usuario configurará el `.env` final para migraciones y conexiones externas.

---

## 2. Seguridad y Multi‑Tenant (NO NEGOCIABLE)

### Lambdas (`lib/lambda/*/fn*/`)

- **`tenant_id`** se debe obtener **siempre** desde el JWT, no desde body ni headers de usuario (salvo invocaciones directas sin `requestContext` o Step Functions sin authorizer).
- Cada Lambda dispone de `utils/sanitization.mjs`; la función estándar es `extractTenantId()`:
  - Usa claims como `custom:tenant_id` del token JWT.
  - No aceptes `tenant_id` desde el cuerpo o cabeceras de peticiones HTTP normales: eso es un **vulnerabilidad de seguridad**.

### Microservicios NestJS (`servicio-contabilidad`, `servicio-tesoreria`)

- El microservicio NestJS define un guardia global `JwtTenantGuard` en `src/common/guards/jwt-tenant.guard.ts`, registrado en `AppModule` como `APP_GUARD`:
  - Lee el header `Authorization: Bearer <token>`.
  - Decodifica el payload del JWT (API Gateway ya validó la firma).
  - Construye `request.user` con estructura:
    - `id`: `sub`, `cognito:username` o `username` (o `'sistema'` como fallback).
    - `tenantId`: intenta, en orden, `custom:tenant_id`, `custom:tenantId`, `tenantId`, `custom__tenant_id` (o `null` si no encuentra).
    - `email`: claim `email` si está presente.
    - `roles`: `cognito:groups` o `roles` si existen.
  - Si falta el header o el formato es inválido, deja un usuario sintético (`anonimo`/`sistema` con `tenantId: null`) y registra logs con `Logger`.
- **Regla para controladores y servicios NestJS**:
  - Usa siempre `req.user.tenantId` y `req.user.id` en lugar de valores hardcodeados de tenant o usuario.
  - No re-decoder manualmente el JWT; confía en `JwtTenantGuard` salvo casos muy específicos que ya estén documentados.

---

## 3. Lambdas en `lib/lambda`

### Principios de Diseño de Lambdas

Cada Lambda debe adherir a los siguientes principios de arquitectura:

| Principio | Descripción | Aplicación en código |
|-----------|-------------|---------------------|
| **Responsabilidad Única** | Cada Lambda maneja un dominio específico | `fnTransaccion` vs `fnTransaccionLineas` vs `fnBanco` |
| **Inmutabilidad** | Lambda no mantiene estado entre invocaciones | Pool de conexiones en `utils/database.mjs` como singleton |
| **Diseño para Fallos** | Toda operación de BD debe tener manejo de errores explícito | Mapeo de códigos PostgreSQL a HTTP en `ResponseBuilder` |
| **Transaccionalidad** | Operaciones que modifican datos deben ser atómicas | Transacciones PostgreSQL o rollback en catch |
| **Auditoría** | Todo cambio de estado registra: quién, cuándo, qué | Campos `creado_por`, `actualizado_por`, `eliminado_por` |

### Organización de cada Lambda

Cada función en `lib/lambda/*/fn*/` sigue el patrón descrito en `lib/lambda/INICIO-RAPIDO.md` y en los propios módulos:

- Directorio de función (ejemplo `fnBanco/`):
  - `lambda.config.json`: configuración de despliegue (nombre, runtime, timeout, memoria, método `zip`).
  - `index.mjs`: router principal de la Lambda.
  - `package.json`: dependencias específicas (opcional, según función).
  - `handlers/`: handlers de operaciones (create, get, update, delete, search, analytics, etc.).
  - `utils/`:
    - `database.mjs`: pool de conexiones a PostgreSQL y helpers de queries.
    - `sanitization.mjs`: extracción de JWT/tenant y sanitización de inputs.
    - `responseBuilder.mjs`: construcción de respuestas HTTP homogéneas.
    - `validation.mjs`: validaciones de payload (cuando aplica).

### Router y patrón crítico de GET

- El `index.mjs` centraliza:
  - CORS.
  - Extracción de tenant y usuario.
  - Enrutamiento a handlers en función de método HTTP y path.
- **Patrón obligatorio para GET by id** (para evitar que `/resource/123` caiga en el listado):

```javascript
if (event.pathParameters?.id) {
  return await getByIdHandler(event); // SIEMPRE primero
}
// Después se evalúan rutas de listado, búsqueda, analytics, etc.
```

### CORS y Authorizer AWS Cognito (Solución implementada)

Esta sección documenta las soluciones concretas aplicadas para resolver problemas de CORS y authorizer en API Gateway con AWS Cognito.

#### Problema CORS con OPTIONS retornando 500

**Síntoma:** Las requests OPTIONS a nuevos endpoints retornaban 500 Internal Server Error.

**Causa raíz:** El request template en la integración MOCK de API Gateway necesitaba el formato exacto `{"statusCode": 200}` (con espacio después de los dos puntos). La versión `{"statusCode":200}` (sin espacio) causaba que API Gateway fallara al parsear y retornara 500.

**Solución verificada:**
1. Usar el resource ID de un endpoint existente que ya funciona (ej. `/api/v1/transacciones-estados` con resource ID `40syzw`) como referencia.
2. Copiar la configuración EXACTA del método OPTIONS del endpoint existente.
3. Para nuevos endpoints, crear la integración primero y luego agregar el método OPTIONS.

**Patrón de código Lambda para CORS:**
```javascript
// En index.mjs - Manejo de OPTIONS
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
};

function handleCorsPreFlight() {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message: 'CORS preflight successful' })
  };
}

// En el handler principal
if (event.httpMethod === 'OPTIONS') {
  return handleCorsPreFlight();
}
```

#### Problema con Authorizer Cognito en nuevos endpoints

**Síntoma:** Los nuevos endpoints creados en API Gateway no respondían correctamente con el authorizer Cognito.

**Solución verificada:**
1. Crear el recurso en API Gateway.
2. Agregar el método con `authorizationType: COGNITO_USER_POOLS` y `authorizerId` correcto.
3. Obtener el `authorizerId` correcto del API Gateway:

```bash
# Obtener authorizer ID
aws apigateway get-authorizers --rest-api-id <API_ID> --region us-east-1
# Ejemplo: authorizer ID para GoodERP-Unified-API (4j950zl6na) es: 4hmp9z
```

4. Agregar permisos de Lambda para el recurso:

```bash
aws lambda add-permission \
  --function-name <LambdaName> \
  --statement-id "apigateway-<recurso>-$(date +%s)" \
  --action "lambda:InvokeFunction" \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:<ACCOUNT_ID>:<API_ID>/dev/GET/<resource-path>" \
  --region us-east-1
```

5. **Importante:** Si la creación de integración con AWS CLI falla con el error "Enumeration value for HttpMethod must be non-empty", usar **boto3 (Python)** en lugar de AWS CLI:

```python
import boto3
client = boto3.client('apigateway', region_name='us-east-1')

client.put_integration(
    restApiId='4j950zl6na',
    resourceId='<RESOURCE_ID>',
    httpMethod='GET',
    type='AWS_PROXY',
    uri='arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:<LAMBDA_NAME>/invocations',
    integrationHttpMethod='POST'  # IMPORTANTE: debe ser POST, no GET
)
```

#### Despliegue de API Gateway

Después de crear nuevos endpoints, siempre hacer deployment:

```bash
aws apigateway create-deployment --rest-api-id <API_ID> --stage-name dev --region us-east-1
```

#### Endpoint de ejemplo funcionando

- Resource path: `/api/v1/transacciones-unificadas/edit`
- Resource ID: `d4qlz3`
- Métodos: GET (con Cognito authorizer), POST
- Lambda: `fnOrquestadorTransaccionUnificada`

---

### Patrón de acceso a datos

- PostgreSQL con **pool de conexiones compartido** (singleton en `utils/database.mjs`).
- Todas las queries multi‑tenant deben filtrar por `tenant_id` apropiado.
- Uso de queries parametrizadas (`$1`, `$2`, …) para evitar SQL injection.
- Cuando hay joins complejos, se normaliza la salida a JSON anidado con funciones como `jsonb_build_object()` (ver patrones en lambdas de transacciones y contabilidad).

### Formato de respuesta (ResponseBuilder)

- Todas las Lambdas devuelven respuestas mediante `ResponseBuilder` definido en `utils/responseBuilder.mjs`:

```javascript
ResponseBuilder.success(data, message, statusCode);
ResponseBuilder.error(code, type, message);
ResponseBuilder.validationError(errors);
ResponseBuilder.unauthorized(message);
```

- Cualquier nueva Lambda o handler debe usar estas utilidades para mantener CORS y estructura de respuesta homogénea.

### Despliegue de Lambdas (ZIP optimizado)

Basado en `lib/lambda/INICIO-RAPIDO.md`:

- **Scripts PowerShell en `scripts/lambda/*.ps1`** controlan todo el ciclo:
  - `list-lambdas.ps1`: lista lambdas disponibles y cuáles tienen configuración.
  - `generate-configs.ps1`: genera `lambda.config.json` faltantes (para todas o por módulo, p.ej. `-Module "contabilidad"`).
  - `deploy-lambdas.ps1`:
    - `-DryRun`: valida configuración y empaquetado sin desplegar.
    - `-LambdaNames "fnBanco","fnProducto"`: despliega funciones específicas.
    - `-Module "contabilidad"`: despliega módulo completo.
    - `-UpdateOnly`: actualiza solo lambdas existentes en AWS.
    - `-Environment prod`: despliegues a producción.
- `lambda.config.json` mínimo:

```json
{
  "name": "fnBanco",
  "runtime": { "type": "nodejs20.x", "handler": "index.handler" },
  "resources": { "timeout": 30, "memory": 256 },
  "deployment": { "method": "zip" }
}
```

---

## Servicio de Contabilidad (`servicio-contabilidad`)

### Stack y módulos principales

Según `servicio-contabilidad/docs/03-arquitectura/ARQUITECTURA_COMPLETA.md`, `ESTADO_FINAL_PROYECTO.md` y `src/app.module.ts`:

- **Tecnologías base**:
  - NestJS (backend principal).
  - TypeORM (`TypeOrmModule.forRootAsync`) con `SnakeNamingStrategy` y `autoLoadEntities: true`.
  - PostgreSQL (schema por defecto `contabilidad`).
  - pgVector para búsquedas semánticas y embeddings contables.
  - json-logic como motor de reglas de negocio.
  - EventEmitter (`EventEmitterModule.forRoot()`).
- **Módulos de dominio registrados en `AppModule`**:
  - `MotorReglasModule`, `ContabilidadModule`, `IntegracionSagaModule`, `ComprobantesModule`.
  - `InteligenciaContableModule` (`ia`), `DigitalizacionModule`.
  - `CumplimientoNormativoModule`, `CentrosCostoModule`, `ProvisionesModule`, `IntegracionActivosModule`, `ConsolidacionModule`, `MaestrosModule`.
- **Infraestructura adicional implementada** (según `ESTADO_FINAL_PROYECTO.md` y estructura de `src/`):
  - `src/redis/`: cache, colas y pub/sub.
  - `src/n8n/`: integración con workflows n8n.
  - `src/formularios-dinamicos/`: definición y evaluación de formularios dinámicos con JSONB + JSON Logic.
  - `src/ia/`: servicios de búsqueda semántica, sugerencia de cuentas, anomalías y asistente contable (sobre AWS Bedrock + pgVector).
  - `src/camunda/`: orquestación BPMN de procesos contables.

### Configuración de infraestructura de NestJS

En `src/app.module.ts`:

- `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`.
- `TypeOrmModule.forRootAsync`:
  - Lee `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SCHEMA` desde entorno.
  - `synchronize: false` (migraciones SQL/manuales controlan el esquema).
  - `logging` activado solo en `NODE_ENV=development`.
  - `ssl: { rejectUnauthorized: false }` (espera Postgres con SSL, adaptado al entorno).
- **Regla para agentes**:
  - Nunca hardcodear credenciales ni parámetros de conexión; usar siempre `ConfigService` y la configuración existente.
  - Respetar `SnakeNamingStrategy` al definir nuevas entidades/migraciones.

### Multi‑tenant y JWT en NestJS

- `JwtTenantGuard` (ver sección de seguridad) se registra como `APP_GUARD`, por lo que:
  - Todos los controladores asumen que `request.user` está presente.
  - Cualquier nuevo controlador/módulo debe apoyarse en este guard para extraer `tenantId` y `id`.
  - Si `tenantId` puede ser `null`, el servicio debe decidir explícitamente si rechaza la operación o la maneja como contexto sin tenant (según el caso de uso implementado).

### Contabilidad avanzada y automatización

Basado en `ARQUITECTURA_COMPLETA.md`, `ESTADO_FINAL_PROYECTO.md` y `CERTIFICACION-FUNCIONAL.md`:

- **Dominios cubiertos** (no exhaustivo, pero alineado con módulos reales):
  - Contabilidad core: plan de cuentas, asientos, saldos, períodos, comprobantes contables.
  - Centros de costo, provisiones, integración con activos fijos y consolidación (grupos empresariales, intercompany, reportes consolidados).
  - Cumplimiento normativo: libros oficiales, medios magnéticos, cierres contables.
  - Formularios dinámicos almacenados en JSONB, con lógica condicional y validaciones via JSON Logic.
  - IA contable: búsqueda semántica de cuentas, sugerencia de cuentas, detección de anomalías y asistente contable sobre Bedrock y pgVector.
  - Digitalización: procesamiento de documentos y causación automática a partir de documentos digitalizados.
- **Certificación funcional**:
  - `CERTIFICACION-FUNCIONAL.md` y `docs/INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` definen módulos, endpoints y flujos que deben ser considerados al extender funcionalidad.
  - Antes de cambiar comportamiento en estos módulos, revisar siempre estos documentos para no romper flujos certificados.

### Organización de código y documentación en `servicio-contabilidad`

Según `ESTADO_FINAL_PROYECTO.md`:

- Estructura principal:

```text
servicio-contabilidad/
├── README.md
├── docs/
│   ├── INDICE.md
│   ├── 01-inicio/
│   ├── 02-fases/
│   ├── 03-arquitectura/
│   ├── 04-guias/
│   └── 05-referencia/
├── src/
│   ├── redis/
│   ├── n8n/
│   ├── formularios-dinamicos/
│   ├── ia/
│   ├── camunda/
│   └── (resto de módulos de dominio)
└── database/
    └── migrations/
```

- **Regla para agentes**:
  - Antes de crear nuevos módulos o servicios, revisar primero si ya existe un módulo de dominio equivalente en `src/` y extenderlo.
  - Cualquier nueva guía o especificación del servicio contable debe ubicarse bajo `servicio-contabilidad/docs` siguiendo la organización existente.

---

## Reglas SEVERAS para nuevas implementaciones, refactors y SPEC‑Driven Development

Estas reglas son **obligatorias** y actúan como **BASE DE REFERENCIA DE LA VERDAD** para cualquier cambio en el sistema, con énfasis especial en lambdas de `lib/lambda` (en particular `transacciones`) y en `servicio-contabilidad`.  
No significa que solo apliquen a esos módulos, sino que esos módulos y documentos asociados son el **canon de madurez** que debe usarse como patrón cuando se diseñen o refactoricen otros servicios.  
Cada implementación o refactor debe seguir un flujo **SPEC‑Driven**: primero especificación (basada en las piezas maduras y docs existentes), luego implementación estrictamente alineada con esa SPEC, y finalmente validación contra certificaciones y patrones ya establecidos.  
Si un patrón ya está resuelto en una pieza madura, **se copia**; no se inventan variantes locales.

### 1. Referencias obligatorias (no negociar)

- **Para lambdas de transacciones (`lib/lambda/transacciones/**`)**:
  - Referencia primaria: `fnTransaccionLineas` (`CLAUDE.md`, `index.mjs`, `utils/*`, `constants/errors.mjs`).
  - Para orquestación: `fnOrquestadorTransaccionUnificada` + `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md` + `RESUMEN-CORRECCION-ORQUESTADOR.md`.
  - Para routing y errores: docs de `fnTransaccion` (`CORRECCION-ROUTING.md`, `CORRECCION-RESPONSEBUILDER.md`, `RESUMEN-FINAL-ANALISIS.md`).
- **Para contabilidad NestJS (`servicio-contabilidad`)**:
  - Referencia primaria de patrón de controlador multi‑tenant: `AsientoContableController` y `PlanContableController`.
  - Referencia de certificación y alcance: `CERTIFICACION-FUNCIONAL.md` y `docs/INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md`.

Antes de escribir una sola línea de código en estos dominios, el agente debe **leer** los archivos de referencia aplicables y ajustarse a ellos.

### 2. Multi‑tenant y extracción de tenant (Lambdas de transacciones)

- **Regla absoluta**: seguir exactamente el contrato descrito en `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md` y en `utils/sanitization.mjs` de `fnTransaccionLineas`:
  - Prioridad 1 y 2: JWT claims (Cognito) y formato HTTP API estándar.
  - Prioridad 3: Step Functions sin `authorizer`, extrayendo `tenant_id` del body del evento.
  - Prioridad 4: invocaciones directas de Lambda sin `requestContext`, también desde body.
- Cualquier nueva lambda o refactor de lambdas existentes que participe en el orquestador (`fnTransaccionLineaBodegas`, `fnTransaccionImpuesto`, `fnTransaccionDescuento`, `fnTransaccionComplemento`, `fnTransaccionEstado`, etc.) debe:
  - **Copiar** el `extractTenantId` completo desde `fnTransaccionLineas` y solo ajustar los mensajes de log si es estrictamente necesario.
  - No introducir rutas alternativas para `tenant_id` fuera de las documentadas.

### 3. ResponseBuilder y estructura de errores (Lambdas de transacciones)

- **Regla absoluta**: el `ResponseBuilder` de lambdas de transacciones debe respetar la especificación consolidada en:
  - `fnTransaccionLineas/utils/responseBuilder.mjs` (estructura estándar con `success`, `message`, `timestamp`, `request_id`, `data`, `error`, `metadata`).
  - `fnTransaccion/utils/responseBuilder.mjs` (mapeo explícito de errores PostgreSQL 23503, 23505, 23514, etc., descrito en `RESUMEN-FINAL-ANALISIS.md` y `CORRECCION-RESPONSEBUILDER.md`).
- Cualquier nueva función (`error`, `validationError`, `conflict`, `notFound`, etc.) debe:
  - Mantener el mismo shape de respuesta.
  - Mapear códigos de error de PostgreSQL a HTTP según la tabla ya documentada (404 para FK `REFERENCE_NOT_FOUND`, 409 para unique, 400 para check/validación, 500 para errores inesperados).
  - Incluir siempre `timestamp` y `request_id`.

### 4. Routing y compatibilidad (Lambdas de transacciones)

- Para lambdas expuestas tanto por API Gateway como por invocaciones directas (por ejemplo, desde el orquestador o Step Functions), el `index.mjs` debe:
  - Usar el patrón de `fnTransaccion/CORRECCION-ROUTING.md`:
    - No depender de `pathSegments.length === N` rígidos.
    - Evaluar el último segmento (`lastSegment`) y aceptar `/transacciones`, `/api/transacciones`, `/v1/transacciones`, etc.
    - Aceptar `pathSegments.length === 0` y `path === '/recurso'` para invocaciones directas.
  - Mantener el patrón crítico de GET by id (primero `pathParameters.id`, después lista/búsqueda/analytics).
- Cualquier routing nuevo debe ser **estrictamente compatible** con los paths documentados en `openapi-transacciones-updated.yaml` y docs de ejemplos en `fnTransaccion/ejemplos`.

### 5. Patrones de datos y soft delete en Lambdas maduras

- Cuando se trabajen lambdas que ya implementan soft delete (como `fnTransaccionLineas`):
  - Respetar siempre los campos `eliminado_por` y `eliminado_en`.
  - Asegurar que todas las consultas de lectura filtren por `WHERE eliminado_por IS NULL` salvo que el requerimiento explícitamente pida incluir registros eliminados.
- El mapeo `id_tenant` ↔ `tenantId` debe realizarse solo en la capa de acceso a datos (`database.mjs`), no en los handlers de alto nivel.

### 6. Controladores y servicios en `servicio-contabilidad`

- **Patrón obligatorio de multi‑tenant en controladores**:
  - Usar decorador `@TenantId()` (definido en `src/common/decorators/tenant-id.decorator.ts`) para obtener el tenant del JWT, nunca de parámetros de ruta o body.
  - Para rutas de compatibilidad que incluyen `:tenantId` en la URL (por ejemplo, `GET /api/contabilidad/asientos/tenant/:tenantId` en `AsientoContableController`):
    - Tomar el tenant **solo** del token (`@TenantId() tenantIdDesdeToken`) y usar el parámetro de ruta solo por compatibilidad/naming histórico.
- **Generación de asientos contables**:
  - Seguir el patrón de `AsientoContableController.generarAsiento`:
    - Combinar DTO (`GenerarAsientoDto`) con `dto.datosAdicionales` y **inyectar** `tenantId` desde el token antes de delegar al servicio.
    - El servicio `AsientoContableService` debe recibir datos ya enriquecidos con `tenantId`, no leerlo desde otras fuentes.
- Cualquier nuevo controlador en contabilidad debe:
  - Estar bajo un módulo existente (`ContabilidadModule`, `CumplimientoNormativoModule`, etc.) según el dominio.
  - Documentar rutas y tipos con `@nestjs/swagger` de la misma forma que `AsientoContableController`.

### 7. Respeto estricto a la certificación funcional

- Los módulos/documentos de certificación (`CERTIFICACION-FUNCIONAL.md`, `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md`) marcan **comportamientos ya validados end‑to‑end** (UI + backend).
- Cualquier cambio en endpoints certificados (por ejemplo, plan de cuentas, periodos, libros, asientos) debe:
  - Mantener las rutas HTTP, firmas y contratos de respuesta.
  - Evitar breaking changes: si es necesario cambiar algo, agregar rutas o propiedades nuevas manteniendo las existentes para compatibilidad.
  - Volver a ejecutar los flujos indicados en el informe de pruebas funcionales antes de considerar el cambio “aceptado”.

### 8. Orquestador de transacciones unificadas

- Para cambios en `fnOrquestadorTransaccionUnificada` y lambdas que invoca:
  - Respetar escrupulosamente la especificación de `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md` y `ARQUITECTURA.md` del orquestador.
  - Verificar siempre que **todas** las lambdas invocadas cumplen:
    - Soporte para invocación sin `requestContext.authorizer`.
    - Uso del patrón de `extractTenantId` con prioridades 1–4.
    - Uso de `ResponseBuilder` completo y consistente.
  - Cualquier nueva lambda asociada al orquestador debe declararse en la tabla de estado (equivalente a la tabla de línea 62–69 de `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md`) y alinearse al patrón de referencia.

### 9. SPEC‑Driven Development en este repo

**Workflow SDD Obligatorio:** Este proyecto aplica Specification-Driven Development con detección automática de complejidad. Todo cambio sigue el flujo: Specify → Clarify → Plan → Break Down → Implement → Review.

En este proyecto, el desarrollo guiado por especificaciones se basa en **documentos SPEC y análisis ya existentes en el código** (no en plantillas genéricas). Para cualquier cambio relevante en `transacciones` o `servicio-contabilidad`:

- **Detección de complejidad (OBLIGATORIA)**:
  - Analizar si es nivel 0 (Atomic), P (PoC), 1 (Micro), 2 (Standard), 3 (Complex) o 4 (Product)
  - Para cambios de nivel 2+, seguir todas las 6 fases. Para niveles inferiores, aplicar solo las fases necesarias.

- **1. Punto de partida obligatorio (SPEC existente)**:
  - Lambdas de transacciones: usar como base los SPEC y análisis en `lib/lambda/transacciones` (por ejemplo `SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md`, `CORRECCION-ROUTING.md`, `RESUMEN-FINAL-ANALISIS.md`, `ARQUITECTURA.md` del orquestador, `GUIA-POST-TRANSACCION.md`, etc.).
  - Servicio contabilidad: usar como base `ARQUITECTURA_COMPLETA.md`, `ESTADO_FINAL_PROYECTO.md`, `CERTIFICACION-FUNCIONAL.md`, `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` y los READMEs de submódulos (`redis`, `n8n`, `formularios-dinamicos`, `ia`, `camunda`, etc.).

- **2. Nueva SPEC antes de tocar código**:
  - Para cualquier cambio no trivial (nuevas rutas, cambios de flujo, nuevos módulos, refactors importantes), primero redactar una SPEC concreta bajo:
    - `lib/lambda/<dominio>/<lambda>/` (cuando el cambio es muy específico a una lambda, siguiendo el patrón de los SPEC ya existentes en `transacciones`), o
    - `servicio-contabilidad/docs/02-fases` o `03-arquitectura` (cuando afecta arquitectura o flujos completos del servicio contable).
  - La SPEC debe:
    - Referenciar explícitamente los patrones maduros que se usan como base.
    - Explicar qué se mantiene, qué se extiende y cómo se preserva compatibilidad con lo certificado.
    - Detallar contratos HTTP, mapeos de errores y reglas de multi‑tenant impactadas.

- **3. Implementación estrictamente alineada a la SPEC**:
  - El código nuevo o refactorizado debe ser trazable línea por línea a lo definido en la SPEC.
  - Si durante la implementación se descubre algo que contradice o invalida la SPEC, se **actualiza primero la SPEC** y luego el código, nunca al revés.

- **4. Validación contra las bases maduras**:
  - Tras implementar, validar que:
    - Los patrones de referencia (lambdas maduras, controladores certificados, ResponseBuilders, extractores de tenant, etc.) se siguen sin desviaciones.
    - Los flujos certificados en `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` siguen funcionando (o se amplían con casos nuevos documentados).
  - No se considera un cambio “listo” hasta que esta validación haya sido razonada explícitamente en la SPEC o en un doc de resultados (siguiendo el estilo de `RESUMEN-FINAL-ANALISIS.md` o `RESUMEN-CORRECCION-ORQUESTADOR.md`).

- **5. Cierre y Certificación (OBLIGATORIO para Nivel 2+)**:
  - Tras una implementación exitosa, el agente debe ejecutar automáticamente (o proponer) los siguientes pasos:
    - **Migraciones de BD**: Ejecutar scripts de migración usando Node.js/TypeORM para actualizar el esquema.
    - **Seed de Datos**: Crear/Ejecutar seeds con datos de prueba realistas para el nuevo dominio.
    - **Pruebas E2E Reales**: Ejecutar pruebas contra endpoints reales con datos reales para certificar la solución.
    - **Despliegue de Infraestructura**: Confirmar y proponer el despliegue según el tipo de componente:
      - Lambdas: Vía scripts PowerShell/AWS CLI.
      - Microservicios: Vía Docker/ECS.
      - Frontend: Vía AWS Amplify.
    - **Generación de Evidencia**: Crear el archivo `EVIDENCE.md` con los resultados de los puntos anteriores.

### 10. Prohibiciones explícitas

- **Prohibido** introducir nuevos mecanismos ad‑hoc de multi‑tenant (headers personalizados, query params de `tenant`, body sin seguir los patrones documentados).
- **Prohibido** devolver respuestas “crudas” (objetos o arrays) sin pasar por `ResponseBuilder` en lambdas de dominio (`transacciones`, `contabilidad`, etc.).
- **Prohibido** cambiar rutas HTTP o contratos ya usados en certificaciones sin dejar rutas de compatibilidad equivalentes.
- **Prohibido** ignorar los mapeos de errores PostgreSQL ya establecidos en las lambdas maduras de transacciones.
- **Prohibido** ejecutar migraciones de BD con `psql` o clientes SQL interactivos; las migraciones se ejecutan **únicamente con Node.js** (scripts o runner de migraciones del proyecto).

---

## Pruebas, TDD/BDD y automatización

Esta sección es **obligatoria** para cualquier cambio que toque lógica de negocio, endpoints, multi‑tenant o contratos. El objetivo es pruebas automatizadas rápidas, efectivas y con resultados óptimos, a prueba de errores.

### Principios de pruebas (TDD/BDD) - Leyes de Hierro

- **Ley de Hierro I - TDD (Test-Driven Development)**:
  - Escribir **primero** el test (unidad o integración mínima) que define el comportamiento esperado; luego implementar o refactorizar hasta que pase.
  - Flujo obligatorio: `RED` (test falla) → `GREEN` (test pasa) → `REFACTOR` (mejora código)
  - Los tests deben ser **deterministas** (sin dependencia de hora, orden de ejecución ni datos externos no controlados).
  - Referencia de patrón: tests existentes en lambdas maduras (`lib/lambda/transacciones`) y en `servicio-contabilidad` (TestingModule de NestJS).
  - **Coverage Gate**: Cobertura mínima ≥ 85% en módulos de negocio

- **Ley de Hierro II - Debugging (Causa raíz primero)**:
  - Cuando un test falla, seguir el flujo: Reproducir → Aislar → Entender → Corregir → Verificar
  - Nunca modificar tests para "hacerlos pasar" sin entender la causa raíz
  - Usar modelos de razonamiento como 5 Porqués para análisis de causa raíz

- **Ley de Hierro III - Verificación (Evidencia antes que afirmaciones)**:
  - ✅ "Tests pasan" > ❌ "Creo que funciona"
  - Cada cambio debe demostrar evidencia objetiva de funcionamiento
  - **OWASP Gate**: 0 vulnerabilidades de seguridad antes de marcar como completo

- **BDD (Behavior-Driven Development)**:
  - Los escenarios de negocio se describen en formato **Given/When/Then** (o equivalente), alineados con:
    - `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` y flujos certificados.
    - PO/SPEC del dominio (ej. `PO-tesoreria.md`, SPEC de facturación).
  - Cada escenario BDD debe traducirse en **al menos un test automatizado** (integración o E2E) que valide el flujo completo o el contrato.

### Reglas a prueba de errores

- **Nunca** considerar un cambio “listo” si:
  - Rompe tests existentes sin actualizar primero la SPEC y los tests de forma coherente.
  - Modifica endpoints o contratos certificados sin añadir o actualizar tests que cubran el nuevo/comportamiento compatible.
  - Introduce lógica multi‑tenant o de seguridad sin un test que verifique el comportamiento correcto (tenant desde JWT, rechazo sin token, etc.).
- **Siempre**:
  - Ejecutar la suite de pruebas relevante antes de marcar una tarea como completada (local o en pipeline).
  - Mantener tests **rápidos** en el camino crítico: unitarios y de contrato deben poder ejecutarse en segundos; integración/E2E en un tiempo acotado documentado.
  - Aislar pruebas que tocan BD o APIs externas (mocks, contenedores de test o bases dedicadas) para evitar fallos intermitentes y dependencias frágiles.

### Herramientas y patrones por capa

- **Lambdas (Node.js en `lib/lambda`)**:
  - Framework: **Jest** (o el ya usado en el módulo). Tests unitarios para handlers y `utils` (sanitization, responseBuilder, validación).
  - Integración: tests que invoquen el handler con eventos tipo API Gateway/Step Functions, contra BD de pruebas (Docker o RDS de test), verificando shape de respuesta (`ResponseBuilder`) y códigos HTTP.
  - Patrón: un test por ruta principal (GET by id, POST create, etc.) más al menos un test de error (sin tenant, FK inválida, validación fallida).
- **Microservicios NestJS (`servicio-contabilidad`, futuros)**:
  - **TestingModule** de Nest + **supertest** para endpoints HTTP. No levantar toda la app en cada test si basta con el módulo bajo prueba.
  - Tests unitarios de servicios con dependencias mockeadas (repositorios, otros servicios).
  - Contratos: validar que las respuestas cumplan el shape esperado (y, si existe, el OpenAPI/Swagger del servicio).
- **Contratos API (OpenAPI/Swagger)**:
  - Tests de contrato: peticiones de ejemplo contra los endpoints (o contra un mock del backend) verificando que la respuesta cumple el esquema definido en `SWAGGER-CONTABILIDAD.yml`, `openapi-tesoreria.yaml`, etc.
  - Cualquier cambio en rutas o esquemas de respuesta debe ir acompañado de actualización del OpenAPI y de los tests de contrato que lo usen.
- **Infraestructura (Terraform)**:
  - `terraform validate` y `terraform plan` (o equivalente en pipeline) en cada cambio relevante.
  - Opcional: smoke tests post-despliegue (health checks de ALB, invocación de una lambda de sanity) para detectar errores de configuración.

### Pipelines de automatización

- **Suite rápida (obligatoria por cambio)**:
  - Tests unitarios + tests de contrato (cuando existan) del módulo o lambda afectado.
  - Debe ejecutarse en cada commit o PR; fallo = bloqueo hasta corregir o actualizar SPEC/tests de forma justificada.
- **Suite de integración / funcional**:
  - Tests que requieran BD, APIs o despliegue: ejecutar antes de despliegues a entornos compartidos (staging/producción).
  - Incluir los flujos documentados en `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` (o equivalente por dominio) para garantizar que no se rompen sin detectarlo.

### Ubicación y nomenclatura de tests

- Lambdas: tests junto al código, p. ej. `handlers/createTransaccionLinea.test.mjs` o carpeta `__tests__` en el directorio de la lambda.
- NestJS: archivos `*.spec.ts` junto al módulo/controlador/servicio (convención estándar de Nest).
- Contratos/E2E: carpeta `tests/` en la raíz o dentro del servicio, con nombres que identifiquen el dominio (ej. `tests/contract-contabilidad.spec.js`, `tests/e2e-tesoreria.spec.js`).

### Expectativas para agentes en materia de pruebas

- Al implementar una **nueva lambda o endpoint**: añadir al menos un test automatizado que cubra el happy path y un caso de error relevante (multi‑tenant, validación o BD).
- Al **refactorizar** código maduro: asegurar que los tests existentes sigan pasando; si se cambia comportamiento, actualizar primero la SPEC y luego los tests antes de tocar la implementación.
- Al **cambiar contratos o rutas certificados**: actualizar OpenAPI y tests de contrato en el mismo cambio; no dejar rutas obsoletas sin documentar la deprecación ni tests que las cubran.

### Planes de pruebas (por capa)

Cada cambio debe alinearse al plan de la capa afectada. Los planes definen **qué** probar, **cuándo** y **criterios de éxito**.

#### Plan Lambdas (`lib/lambda/*`)

| Fase | Qué probar | Criterio de éxito | Cuándo |
|------|------------|-------------------|--------|
| **Unidad** | Handlers aislados (payload → respuesta); `sanitization.mjs` (extractTenantId); `responseBuilder.mjs` (shape); validación de payload. | Tests deterministas, sin I/O real; mocks de BD si el handler la usa. | En cada cambio del handler o util. |
| **Integración** | Invocación del handler con evento tipo API Gateway/Step Functions; BD de pruebas (Docker o RDS test). | Respuesta con shape `ResponseBuilder`; códigos HTTP correctos (200, 400, 403, 404, 409); filtro por `tenant_id`. | Antes de PR o despliegue del módulo. |
| **Multi‑tenant y errores** | Request sin JWT; tenant inválido; FK inexistente; unique violation. | Rechazo o 403/404/409 con mensaje coherente; sin fugar datos de otro tenant. | Incluido en integración. |

**Comando de referencia**: ejecutar tests del módulo (ej. `npm test` en la lambda o desde `scripts/` si existe runner). Suite rápida < 2 min.

#### Plan Microservicios NestJS (`servicio-contabilidad`, futuros)

| Fase | Qué probar | Criterio de éxito | Cuándo |
|------|------------|-------------------|--------|
| **Unidad** | Servicios con dependencias mockeadas (repositorios, otros servicios). | Lógica de negocio aislada; no levantar HTTP ni BD. | En cada cambio del servicio. |
| **Controlador** | TestingModule + supertest; endpoints con JWT mockeado o token de test. | Status y body según OpenAPI; uso de `@TenantId()` y `req.user.tenantId`. | En cada cambio de ruta o DTO. |
| **Contrato** | Respuestas de los endpoints contra el esquema del OpenAPI/Swagger del servicio. | Validación de schema (ej. con herramienta o test que cargue el YAML y valide el JSON). | En cada cambio de contrato o antes de release. |
| **Regresión funcional** | Flujos de `INFORME-PRUEBAS-FUNCIONALES-CONTABILIDAD.md` (o equivalente). | Misma secuencia de pasos documentada; mismos resultados esperados. | Antes de despliegue a staging/producción. |

**Comando de referencia**: `npm run test` (unit + controller); suite de contrato/regresión según scripts definidos en el servicio.

#### Plan Contratos API (OpenAPI/Swagger)

| Fase | Qué probar | Criterio de éxito | Cuándo |
|------|------------|-------------------|--------|
| **Contrato** | Peticiones de ejemplo (happy path + 1–2 errores) contra el backend o mock; validar respuesta contra el esquema del OpenAPI. | Status y body cumplen el schema; códigos de error documentados. | En cada cambio en `SWAGGER-CONTABILIDAD.yml`, `openapi-tesoreria.yaml` o equivalentes. |
| **Consistencia** | Mismas rutas y esquemas que consumen frontend o integradores. | Sin breaking changes sin versión o deprecación documentada. | Antes de publicar nueva versión del API. |

**Ubicación sugerida**: `tests/contract-contabilidad.spec.js`, `tests/contract-tesoreria.spec.js` o dentro del servicio en `test/contract/`.

#### Plan Infraestructura (Terraform)

| Fase | Qué probar | Criterio de éxito | Cuándo |
|------|------------|-------------------|--------|
| **Validación** | `terraform validate`; `terraform plan` (sin aplicar). | 0 errores; plan sin cambios inesperados en recursos no tocados. | En cada cambio en `*.tf`. |
| **Smoke (opcional)** | Tras despliegue: health del ALB; invocación de una lambda de sanity. | Respuesta esperada; sin 5xx. | Tras deploy a un entorno de integración. |

#### Plan RAG (`rag/`)

| Fase | Qué probar | Criterio de éxito | Cuándo |
|------|------------|-------------------|--------|
| **Funcional** | `node scripts/test-functional.mjs`: conexión BD, existencia de chunks, embedding, retrieval, forma del chunk. | `X passed, 0 failed`. | Tras cambiar index, query o migraciones; en CI si se integra. |
| **Regresión** | Una pregunta de referencia (ej. multi-tenant) devuelve chunks relevantes. | Al menos un chunk con contenido esperado (ej. tenant/multi). | Incluido en test-functional.mjs. |

**Comando**: `cd rag && npm run test`.

#### Resumen de ejecución por tipo de cambio

| Tipo de cambio | Suite obligatoria | Suite recomendada antes de deploy |
|----------------|-------------------|-----------------------------------|
| Lambda (handler/util) | Unit + integración del módulo | Integración + multi‑tenant |
| NestJS (controller/service) | Unit + tests del controlador | Contrato + flujos de informe funcional |
| OpenAPI / rutas certificadas | Tests de contrato afectados | Suite de regresión del dominio |
| Frontend / UI | **Playwright E2E** + Unit | Regression UI |
| API / Contratos | **Newman (Postman)** + Spec validation | E2E Integración |
| Terraform | validate + plan | Smoke post-deploy (opcional) |
| RAG | `rag/scripts/test-functional.mjs` | — |

---

## Infraestructura y utilidades en el monorepo

- `terraform/`: define VPC, ALB, ECS, Lambdas, API Gateway y otros recursos de infraestructura (no documentado aquí en detalle; seguir archivos `.tf` existentes).
- `sql/` y `servicio-contabilidad/database/migrations`: migraciones SQL/manuales; **no** se usa `synchronize: true` en producción. **Regla fundamental**: las migraciones a la BD se ejecutan **siempre con Node.js** (scripts o runner de migraciones del proyecto), **nunca con `psql`** ni con clientes SQL interactivos para aplicar cambios de esquema.
- **RAG (memoria infinita con índice vectorial)**: el código vive en `rag/` (pgVector, chunking sobre AGENTS.md, project.md, registry.md, specs OpenSpec). Postgres puede ser **local** (`npm run rag:db:up` + `rag/docker-compose.postgres.yml`) o remoto vía `RAG_DB_*` en `rag/.env`. Migraciones: solo Node.js (`npm run rag:migrate` / `rag/scripts/run-migration.mjs`). Indexar: `npm run rag:index`. Consultar: `npm run rag:query -- "pregunta"`. Mantener al día: daemon `scripts/rag-index-daemon.sh` o `npm run memory:daemons:start`. Ver `rag/README.md` y `docs/lineamiento-memoria-automatica.md`.
- Scripts npm en la raíz (cuando estén definidos) se usan para:
  - `npm run extract`: extracción de datos de prueba desde RDS.
  - `npm run generate:postman`: generación de colección Postman desde OpenAPI.
  - `npm run update:openapi`: actualización del OpenAPI con ejemplos.

---

## Microservicios NestJS: Implementación y Migración desde Lambdas

Esta sección es **OBLIGATORIA** para cualquier implementación nueva de microservicios o migración de Lambdas existentes a microservicios NestJS. Sigue estrictamente los patrones establecidos en `servicio-contabilidad` y otros microservicios maduros del repositorio.

### 1. Arquitectura de Microservicios

#### 1.1. Stack Tecnológico Estándar

Cada microservicio NestJS debe usar:

- **Framework**: NestJS 11+ con TypeScript
- **Base de datos**: PostgreSQL con TypeORM
- **Naming**: `SnakeNamingStrategy` para columnas (coherencia con esquema existente)
- **Validación**: `class-validator` + `class-transformer`
- **Documentación**: Swagger/OpenAPI con `@nestjs/swagger`
- **Configuración**: `@nestjs/config` con archivos `.env` por entorno
- **Tests**: Jest + TestingModule + supertest
- **Autenticación**: JWT de AWS Cognito vía `JwtTenantGuard`
- **Programación**: `@nestjs/schedule` para tareas Cron

#### 1.2. User Pools de Cognito por Tipo de Servicio

El sistema usa **dos User Pools** con propósitos diferenciados:

| User Pool ID | ARN | Propósito | Servicios |
|--------------|-----|-----------|-----------|
| `us-east-1_gmre5QtIx` | `arn:aws:cognito-idp:us-east-1:068858795558:userpool/us-east-1_gmre5QtIx` | **Microservicios NestJS** | `servicio-contabilidad`, `servicio-tesoreria`, `servicio-parqueaderos`, `servicio-nomina`, `servicio-reportes` |
| `us-east-1_fQl9BKSxq` | (ver `.env`) | **AWS Lambdas + API Gateway** | `lib/lambda/*`, `servicio-transacciones`, `servicio-core`, `servicio-inventarios`, `servicio-saga` |

**Regla crítica**: Los microservicios NestJS usan **exclusivamente** el User Pool `us-east-1_gmre5QtIx`. El issuer esperado en JWTs es:
```
https://cognito-idp.us-east-1.amazonaws.com/us-east-1_gmre5QtIx
```

#### 1.3. Estructura de Directorios Estándar

```text
servicio-<nombre>/
├── .env.example              # Plantilla de variables de entorno
├── .env                      # Configuración local (no commitear)
├── package.json
├── tsconfig.json
├── nest-cli.json
├── typeorm.config.ts         # Configuración de TypeORM
├── docker-compose.yml        # Servicios auxiliares (Redis, etc.)
├── README.md
├── docs/
│   ├── INDICE.md
│   ├── 01-inicio/
│   ├── 02-fases/
│   ├── 03-arquitectura/
│   ├── 04-guias/
│   └── 05-referencia/
├── src/
│   ├── main.ts               # Punto de entrada
│   ├── app.module.ts         # Módulo principal
│   ├── app.controller.ts     # Controlador raíz (health check)
│   ├── common/
│   │   ├── guards/
│   │   │   └── jwt-tenant.guard.ts       # GUARD GLOBAL OBLIGATORIO
│   │   ├── decorators/
│   │   │   ├── tenant-id.decorator.ts    # @TenantId()
│   │   │   └── user-id.decorator.ts      # @UserId()
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── utils/
│   ├── <modulo-domino-1>/     # Ej: contabilidad, tesoreria
│   │   ├── <modulo-domino-1>.module.ts
│   │   ├── controladores/
│   │   │   └── <recurso>.controller.ts
│   │   ├── servicios/
│   │   │   └── <recurso>.service.ts
│   │   ├── entidades/
│   │   │   └── <recurso>.entidad.ts
│   │   ├── dto/
│   │   │   ├── crear-<recurso>.dto.ts
│   │   │   └── actualizar-<recurso>.dto.ts
│   │   └── repositorios/
│   │       └── <recurso>.repositorio.ts
│   ├── redis/                 # Cache, colas, pub/sub (opcional)
│   ├── n8n/                   # Integración workflows (opcional)
│   ├── ia/                    # IA Bedrock + pgVector (opcional)
│   └── camunda/               # Orquestación BPMN (opcional)
└── database/
    └── migrations/
```

---

### 2. Flujo de Migración: Lambda → Microservicio NestJS

Sigue este flujo **PASO A PASO** para migrar una Lambda existente a un microservicio NestJS. No omitas ningún paso.

#### FASE 1: Análisis y SPEC (OBLIGATORIO ANTES DE CÓDIGO)

**Paso 1.1: Inventariar la Lambda existente**

Documenta en una SPEC bajo `servicio-<nombre>/docs/02-fases/MIGRACION-<LAMBDA>.md`:

```markdown
# Migración: <Lambda Original> → Microservicio

## Lambda Original
- **Path**: `lib/lambda/<modulo>/fn<Nombre>/`
- **Endpoints actuales**: Lista completa de rutas HTTP
- **Handlers existentes**: create, get, update, delete, search, etc.
- **Dependencias externas**: Otras lambdas, servicios, colas
- **Migraciones de BD**: Scripts SQL asociados

## Contratos Actuales
- **Request schemas**: Payloads de entrada por endpoint
- **Response schemas**: Estructura de respuestas (ResponseBuilder)
- **Errores mapeados**: Códigos PostgreSQL → HTTP

## Multi-Tenant
- Método de extracción de tenant (debe ser JWT claims)
- Claims usados: `custom:tenant_id`, etc.

## Reglas de Negocio
- Validaciones específicas
- Cálculos complejos
- Integraciones externas
```

**Paso 1.2: Definir alcance de migración**

- ¿Se migra todo o solo ciertos endpoints?
- ¿Se mantiene compatibilidad con clientes existentes?
- ¿Se requieren rutas de compatibilidad (`/v1/`, `/legacy/`)?

**Paso 1.3: Especificar diferencias arquitectónicas**

```markdown
## Diferencias Lambda vs Microservicio

| Aspecto | Lambda | Microservicio | Acción requerida |
|---------|--------|---------------|------------------|
| Runtime | Node.js 20 ESM | NestJS 11 TypeScript | Transpilación |
| DB Access | Pool en utils/database.mjs | TypeORM + Repositorios | Refactor a entidades |
| Auth | extractTenantId() manual | JwtTenantGuard + decoradores | Usar @TenantId() |
| Response | ResponseBuilder.mjs | DTOs + Swagger | Crear DTOs equivalentes |
| Deploy | ZIP + scripts PS1 | Docker/EC2 o ECS | Configurar infra |
```

---

#### FASE 2: Configuración Inicial del Microservicio

**Paso 2.1: Crear estructura base (si no existe)**

```bash
# Si el microservicio ya existe, saltar a Paso 2.2
mkdir servicio-<nombre>
cd servicio-<nombre>
npm init -y
npm install --save @nestjs/core @nestjs/common @nestjs/config @nestjs/typeorm \
  @nestjs/swagger class-validator class-transformer pg uuid
npm install --save-dev @nestjs/cli @nestjs/testing typescript ts-node @types/node
```

**Paso 2.2: Configurar archivos base**

Crear/actualizar `.env.example`:

```ini
# Entorno
NODE_ENV=development
PORT=3003

# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=gooderp
DB_SCHEMA=<nombre_servicio>

# AWS Cognito (User Pool para microservicios NestJS)
COGNITO_USER_POOL_ID=us-east-1_gmre5QtIx
COGNITO_REGION=us-east-1

# Redis (opcional, para cache/colas)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Colas (RabbitMQ para SAGA)
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=<servicio>.exchange
```

**Paso 2.3: Configurar AppModule con guards globales**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtTenantGuard } from './common/guards/jwt-tenant.guard';
import { <ModuloPrincipal>Module } from './<modulo-principal>/<modulo-principal>.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        schema: configService.get('DB_SCHEMA', 'public'),
        entities: [__dirname + '/**/*.entidad{.ts,.js}'],
        synchronize: false, // NUNCA en producción
        logging: configService.get('NODE_ENV') === 'development',
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    <ModuloPrincipal>Module,
    // Otros módulos de dominio
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtTenantGuard }, // GUARD GLOBAL OBLIGATORIO
  ],
})
export class AppModule {}
```

---

#### FASE 3: Implementación de Seguridad y Multi-Tenant

**Paso 3.1: Copiar JwtTenantGuard (PATRÓN OBLIGATORIO)**

Crear `src/common/guards/jwt-tenant.guard.ts` **IDÉNTICO** al de `servicio-contabilidad`:

```typescript
// src/common/guards/jwt-tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';

/**
 * JwtTenantGuard
 * 
 * Decodifica el JWT Bearer sin re-verificar firma (API Gateway ya lo hizo).
 * Popula req.user con { id, tenantId, email, roles } para que los controladores
 * puedan usar req.user.tenantId en lugar de hardcodear valores.
 * 
 * Cognito User Pool: us-east-1_gmre5QtIx
 * Issuer esperado: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_gmre5QtIx
 */
@Injectable()
export class JwtTenantGuard implements CanActivate {
  private readonly logger = new Logger('JwtTenantGuard');

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Intentar obtener del header Authorization (Bearer token)
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      this.logger.warn('No se encontró header Authorization Bearer');
      request.user = { id: 'anonimo', tenantId: null, email: null, roles: [] };
      return true;
    }

    try {
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.error('Token JWT con formato inválido (no tiene 3 partes)');
        request.user = { id: 'anonimo', tenantId: null, email: null, roles: [] };
        return true;
      }

      // Decodifica el payload (base64url → base64 → utf8)
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);

      // Mapeo robusto de claims (ORDEN DE PRIORIDAD)
      const tenantId =
        payload['custom:tenant_id'] ||      // Prioridad 1: Claim estándar Cognito
        payload['custom:tenantId'] ||       // Prioridad 2: Variación camelCase
        payload['tenantId'] ||              // Prioridad 3: Genérico
        payload['custom__tenant_id'] ||     // Prioridad 4: Variación con guión bajo
        null;

      const userId =
        payload.sub ||                      // Prioridad 1: Subject (UUID)
        payload['cognito:username'] ||      // Prioridad 2: Username de Cognito
        payload['username'] ||              // Prioridad 3: Genérico
        'sistema';                          // Fallback

      request.user = {
        id: userId,
        tenantId: tenantId,
        email: payload.email || null,
        roles: payload['cognito:groups'] || payload['roles'] || [],
      };

      if (!tenantId) {
        this.logger.warn(`JWT decodificado pero sin tenantId para el usuario ${userId}`);
      }

      this.logger.debug(`Usuario autenticado: ${userId}, Tenant: ${tenantId}`);

    } catch (error) {
      this.logger.error(`Error decodificando JWT: ${error.message}`);
      request.user = { id: 'sistema', tenantId: null, email: null, roles: [] };
    }

    return true;
  }
}
```

**Paso 3.2: Crear decoradores @TenantId() y @UserId()**

```typescript
// src/common/decorators/tenant-id.decorator.ts
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorador @TenantId()
 * 
 * Extrae el ID del inquilino (tenant) del objeto request.user (populado por JwtTenantGuard).
 * Si no se encuentra un tenantId, lanza una excepción de UnauthorizedException.
 * 
 * USO OBLIGATORIO en todos los endpoints que requieran multi-tenencia.
 * NUNCA obtener tenantId de parámetros de ruta, body o query params.
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException(
        'Multi-tenencia requerida: ID de inquilino no encontrado en el token JWT.'
      );
    }

    return tenantId;
  },
);
```

```typescript
// src/common/decorators/user-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador @UserId()
 * 
 * Extrae el ID del usuario del objeto request.user (populado por JwtTenantGuard).
 * Usa el claim 'sub' de Cognito como identificador único.
 * 
 * Cognito User Pool: us-east-1_gmre5QtIx
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || 'sistema';
  },
);
```

---

#### FASE 4: Migración de Entidades y Acceso a Datos

**Paso 4.1: Convertir queries SQL a entidades TypeORM**

Para cada tabla usada por la Lambda, crear una entidad TypeORM:

```typescript
// src/<modulo>/entidades/<recurso>.entidad.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('nombre_tabla') // Usar snake_case automáticamente por SnakeNamingStrategy
export class <Recurso>Entidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', name: 'creado_por', nullable: true })
  creadoPor: string;

  @CreateDateColumn({ type: 'timestamp', name: 'creado_en' })
  creadoEn: Date;

  @Column({ type: 'uuid', name: 'actualizado_por', nullable: true })
  actualizadoPor: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'actualizado_en', nullable: true })
  actualizadoEn: Date;

  @Column({ type: 'uuid', name: 'eliminado_por', nullable: true })
  eliminadoPor: string;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
```

**Paso 4.2: Crear repositorio personalizado (opcional pero recomendado)**

```typescript
// src/<modulo>/repositorios/<recurso>.repositorio.ts
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { <Recurso>Entidad } from '../entidades/<recurso>.entidad';

@Injectable()
export class <Recurso>Repositorio extends Repository<<Recurso>Entidad> {
  constructor(private dataSource: DataSource) {
    super(<Recurso>Entidad, dataSource.createEntityManager());
  }

  async findByTenant(tenantId: string): Promise<<Recurso>Entidad[]> {
    return this.find({
      where: { tenantId, eliminadoPor: null }, // Soft delete filter
      order: { creadoEn: 'DESC' },
    });
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<<Recurso>Entidad | null> {
    return this.findOne({
      where: { id, tenantId, eliminadoPor: null },
    });
  }
}
```

**Paso 4.3: Migrar queries complejos desde la Lambda**

Si la Lambda usa queries SQL complejos con `jsonb_build_object()`, crear métodos personalizados en el repositorio:

```typescript
// Ejemplo: Query con joins y JSONB desde Lambda
// SELECT 
//   t.id,
//   t.nombre,
//   jsonb_build_object('id', u.id, 'nombre', u.nombre) as usuario_creador
// FROM transacciones t
// LEFT JOIN usuarios u ON t.creado_por = u.id
// WHERE t.tenant_id = $1

async findWithRelations(tenantId: string): Promise<any[]> {
  return this.dataSource.query(
    `SELECT 
      t.id,
      t.nombre,
      jsonb_build_object('id', u.id, 'nombre', u.nombre) as usuarioCreador
    FROM transacciones t
    LEFT JOIN usuarios u ON t.creado_por = u.id
    WHERE t.tenant_id = $1
      AND t.eliminado_por IS NULL
    ORDER BY t.creado_en DESC`,
    [tenantId]
  );
}
```

---

#### FASE 5: Migración de Controladores (Endpoints)

**Paso 5.1: Patrón de controlador multi-tenant**

```typescript
// src/<modulo>/controladores/<recurso>.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { <Recurso>Service } from '../servicios/<recurso>.service';
import { Crear<Recurso>Dto } from '../dto/crear-<recurso>.dto';
import { Actualizar<Recurso>Dto } from '../dto/actualizar-<recurso>.dto';
import { <Recurso>Entidad } from '../entidades/<recurso>.entidad';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';

@ApiTags('<recurso>')
@ApiBearerAuth() // Requiere JWT Bearer
@Controller('api/<modulo>/<recurso>')
export class <Recurso>Controller {
  constructor(private readonly service: <Recurso>Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo <recurso>' })
  @ApiResponse({ 
    status: 201, 
    description: '<Recurso> creado exitosamente',
    type: <Recurso>Entidad,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Solicitud inválida (validación de datos)',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado (JWT inválido o faltante)',
  })
  async crear(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: Crear<Recurso>Dto,
  ): Promise<<Recurso>Entidad> {
    // Inyectar tenantId y userId desde el token (NO desde el body)
    return await this.service.crear(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los <recurso> del tenant autenticado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de <recurso>',
    type: [<Recurso>Entidad],
  })
  async obtenerPorTenant(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<<Recurso>Entidad[]> {
    return await this.service.obtenerPorTenant(tenantId, { limit, offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener <recurso> por ID' })
  @ApiParam({ name: 'id', description: 'UUID del <recurso>' })
  @ApiResponse({ 
    status: 200, 
    description: '<Recurso> encontrado',
    type: <Recurso>Entidad,
  })
  @ApiResponse({ 
    status: 404, 
    description: '<Recurso> no encontrado',
  })
  async obtenerPorId(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<<Recurso>Entidad> {
    return await this.service.obtenerPorId(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar <recurso> existente' })
  @ApiResponse({ 
    status: 200, 
    description: '<Recurso> actualizado exitosamente',
  })
  @ApiResponse({ 
    status: 404, 
    description: '<Recurso> no encontrado',
  })
  async actualizar(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Actualizar<Recurso>Dto,
  ): Promise<<Recurso>Entidad> {
    return await this.service.actualizar(tenantId, userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar <recurso> (soft delete)' })
  @ApiResponse({ 
    status: 204, 
    description: '<Recurso> eliminado exitosamente',
  })
  @ApiResponse({ 
    status: 404, 
    description: '<Recurso> no encontrado',
  })
  async eliminar(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.eliminar(tenantId, userId, id);
  }
}
```

**Paso 5.2: Rutas de compatibilidad (si se requieren)**

Si migras desde Lambdas con rutas establecidas, mantener compatibilidad:

```typescript
// Ruta legacy con :tenantId en URL (por compatibilidad)
// El tenant REAL se obtiene del token, NO de la URL
@Get('tenant/:tenantId/listar')
@ApiOperation({ 
  summary: 'Listar <recurso> (ruta legacy por compatibilidad)',
  description: 'El tenantId de la URL se ignora; se usa el del token JWT.',
})
async listarCompatibilidad(
  @TenantId() tenantIdDesdeToken: string,  // ✅ USAR ESTE
  @Param('tenantId') tenantIdDeUrl: string, // ❌ IGNORAR (solo compatibilidad)
): Promise<<Recurso>Entidad[]> {
  // Usar SIEMPRE el tenant del token
  return await this.service.obtenerPorTenant(tenantIdDesdeToken);
}
```

---

#### FASE 6: Migración de Servicios (Lógica de Negocio)

**Paso 6.1: Patrón de servicio con multi-tenant**

```typescript
// src/<modulo>/servicios/<recurso>.service.ts
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { <Recurso>Entidad } from '../entidades/<recurso>.entidad';
import { Repository } from 'typeorm';
import { Crear<Recurso>Dto } from '../dto/crear-<recurso>.dto';
import { Actualizar<Recurso>Dto } from '../dto/actualizar-<recurso>.dto';

@Injectable()
export class <Recurso>Service {
  private readonly logger = new Logger(<Recurso>Service.name);

  constructor(
    @InjectRepository(<Recurso>Entidad)
    private readonly repositorio: Repository<<Recurso>Entidad>,
  ) {}

  async crear(
    tenantId: string,
    userId: string,
    dto: Crear<Recurso>Dto,
  ): Promise<<Recurso>Entidad> {
    this.logger.debug(`Creando <recurso> para tenant ${tenantId}`);

    const entidad = this.repositorio.create({
      ...dto,
      tenantId,
      creadoPor: userId,
    });

    try {
      return await this.repositorio.save(entidad);
    } catch (error) {
      // Mapeo de errores PostgreSQL
      if (error.code === '23505') { // Unique violation
        throw new ConflictException(`Ya existe un <recurso> con esos valores`);
      }
      if (error.code === '23503') { // FK violation
        throw new NotFoundException(`Referencia inválida`);
      }
      throw error;
    }
  }

  async obtenerPorTenant(
    tenantId: string,
    opciones?: { limit?: number; offset?: number },
  ): Promise<<Recurso>Entidad[]> {
    return this.repositorio.find({
      where: { tenantId, eliminadoPor: null },
      take: opciones?.limit,
      skip: opciones?.offset,
      order: { creadoEn: 'DESC' },
    });
  }

  async obtenerPorId(
    tenantId: string,
    id: string,
  ): Promise<<Recurso>Entidad> {
    const entidad = await this.repositorio.findOne({
      where: { id, tenantId, eliminadoPor: null },
    });

    if (!entidad) {
      throw new NotFoundException(
        `<Recurso> con ID ${id} no encontrado para tenant ${tenantId}`
      );
    }

    return entidad;
  }

  async actualizar(
    tenantId: string,
    userId: string,
    id: string,
    dto: Actualizar<Recurso>Dto,
  ): Promise<<Recurso>Entidad> {
    const entidad = await this.obtenerPorId(tenantId, id);

    Object.assign(entidad, dto, {
      actualizadoPor: userId,
      actualizadoEn: new Date(),
    });

    try {
      return await this.repositorio.save(entidad);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(`Valores duplicados`);
      }
      throw error;
    }
  }

  async eliminar(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    const entidad = await this.obtenerPorId(tenantId, id);

    // Soft delete: marcar como eliminado en lugar de borrar físicamente
    entidad.eliminadoPor = userId;
    entidad.eliminadoEn = new Date();

    await this.repositorio.save(entidad);
  }
}
```

---

#### FASE 7: DTOs y Validación

**Paso 7.1: Crear DTOs con class-validator**

```typescript
// src/<modulo>/dto/crear-<recurso>.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class Crear<Recurso>Dto {
  @ApiProperty({
    description: 'Nombre del <recurso>',
    example: 'Ejemplo de nombre',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional',
    example: 'Descripción detallada',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Metadata adicional en formato JSON',
    example: { clave: 'valor' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

```typescript
// src/<modulo>/dto/actualizar-<recurso>.dto.ts
import { PartialType } from '@nestjs/swagger';
import { Crear<Recurso>Dto } from './crear-<recurso>.dto';

// Todos los campos son opcionales para actualización parcial
export class Actualizar<Recurso>Dto extends PartialType(Crear<Recurso>Dto) {}
```

---

#### FASE 8: Migración de Errores y Respuestas

**Paso 8.1: Mapeo de errores PostgreSQL desde Lambda**

Las Lambdas usan `ResponseBuilder` para mapear errores. En NestJS, usar filtros de excepción o try-catch con mapeo explícito:

| Código PostgreSQL | HTTP Status | Excepción NestJS | Mensaje |
|-------------------|-------------|------------------|---------|
| `23503` (FK) | 404 | `NotFoundException` | "Referencia no encontrada" |
| `23505` (Unique) | 409 | `ConflictException` | "Recurso ya existe" |
| `23514` (Check) | 400 | `BadRequestException` | "Validación fallida" |
| `42P01` (Table) | 500 | `InternalServerErrorException` | "Error de base de datos" |

**Paso 8.2: Filtro global de excepciones (opcional)**

```typescript
// src/common/filters/postgres-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class PostgresExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const error = exception.driverError as any;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    // Mapeo de errores PostgreSQL
    if (error.code === '23503') {
      status = HttpStatus.NOT_FOUND;
      message = 'Referencia no encontrada (violación de clave foránea)';
    } else if (error.code === '23505') {
      status = HttpStatus.CONFLICT;
      message = 'Recurso ya existe (violación de unicidad)';
    } else if (error.code === '23514') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validación fallida (violación de check)';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: error.code,
    });
  }
}
```

---

#### FASE 9: Pruebas y Validación

**Paso 9.1: Tests unitarios de servicios**

```typescript
// src/<modulo>/<recurso>.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { <Recurso>Service } from './<recurso>.service';
import { <Recurso>Entidad } from '../entidades/<recurso>.entidad';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('<Recurso>Service', () => {
  let service: <Recurso>Service;
  let repository: Repository<<Recurso>Entidad>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <Recurso>Service,
        {
          provide: getRepositoryToken(<Recurso>Entidad),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<<Recurso>Service>(<Recurso>Service);
    repository = module.get<Repository<<Recurso>Entidad>>(getRepositoryToken(<Recurso>Entidad));
  });

  it('debe crear un <recurso> exitosamente', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const userId = 'a4b8d478-60b1-70dc-4d9c-65c75aa45c0c';
    const dto = { nombre: 'Test' };
    const entidadCreada = { id: 'uuid', ...dto, tenantId, creadoPor: userId };

    mockRepository.create.mockReturnValue(entidadCreada);
    mockRepository.save.mockResolvedValue(entidadCreada);

    const resultado = await service.crear(tenantId, userId, dto);

    expect(resultado).toEqual(entidadCreada);
    expect(repository.create).toHaveBeenCalledWith({ ...dto, tenantId, creadoPor: userId });
  });

  it('debe lanzar ConflictException si hay violación de unicidad', async () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const userId = 'user-id';
    const dto = { nombre: 'Test' };

    mockRepository.create.mockReturnValue(dto);
    mockRepository.save.mockRejectedValue({ code: '23505' });

    await expect(service.crear(tenantId, userId, dto))
      .rejects.toThrow(ConflictException);
  });
});
```

**Paso 9.2: Tests de integración de controladores**

```typescript
// src/<modulo>/<recurso>.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { <Recurso>Controller } from './<recurso>.controller';
import { <Recurso>Service } from './<recurso>.service';
import { JwtTenantGuard } from '../../common/guards/jwt-tenant.guard';

describe('<Recurso>Controller', () => {
  let controller: <Recurso>Controller;
  let service: <Recurso>Service;

  const mockService = {
    crear: jest.fn(),
    obtenerPorTenant: jest.fn(),
    obtenerPorId: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [<Recurso>Controller],
      providers: [
        { provide: <Recurso>Service, useValue: mockService },
        { provide: JwtTenantGuard, useValue: { canActivate: () => true } },
      ],
    }).compile();

    controller = module.get<<Recurso>Controller>(<Recurso>Controller);
    service = module.get<<Recurso>Service>(<Recurso>Service);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });
});
```

**Paso 9.3: Tests E2E con supertest**

```typescript
// test/<recurso>-e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtTenantGuard } from './../src/common/guards/jwt-tenant.guard';

describe('<Recurso> (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  const TEST_JWT = 'eyJraWQiOiJYSFlFT3V4dmdMblFkZWZVUVwvWlczVElYVW1ZMkhvU0lOaGhlOEpxUkNlMD0i...';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    // Mock del guard para pruebas E2E
    app.overrideGuard(JwtTenantGuard).useGuard({
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = {
          id: 'test-user-id',
          tenantId: '11111111-1111-1111-1111-111111111111',
          email: 'test@example.com',
          roles: [],
        };
        return true;
      },
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/<modulo>/<recurso> (POST) - debe crear un nuevo recurso', () => {
    return request(app.getHttpServer())
      .post('/api/<modulo>/<recurso>')
      .set('Authorization', `Bearer ${TEST_JWT}`)
      .send({ nombre: 'Test E2E' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.nombre).toBe('Test E2E');
      });
  });

  it('/api/<modulo>/<recurso> (GET) - debe listar recursos del tenant', () => {
    return request(app.getHttpServer())
      .get('/api/<modulo>/<recurso>')
      .set('Authorization', `Bearer ${TEST_JWT}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

---

#### FASE 10: Documentación y Validación Final

**Paso 10.1: Actualizar OpenAPI/Swagger**

- Ejecutar `npm run start:dev` y acceder a `http://localhost:3003/api`
- Verificar que todos los endpoints estén documentados
- Exportar especificación: `curl http://localhost:3003/api-json > openapi.json`

**Paso 10.2: Crear guía de migración**

Documentar en `servicio-<nombre>/docs/02-fases/MIGRACION-<LAMBDA>-RESULTADOS.md`:

```markdown
# Resultados de Migración: <Lambda> → Microservicio

## Resumen
- **Lambda original**: `lib/lambda/<modulo>/fn<Nombre>/`
- **Microservicio destino**: `servicio-<nombre>/`
- **Fecha de migración**: YYYY-MM-DD
- **Estado**: ✅ Completada / ⚠️ Parcial / ❌ Fallida

## Endpoints Migrados

| Endpoint Original | Endpoint Nuevo | Estado | Notas |
|-------------------|----------------|--------|-------|
| POST /transacciones | POST /api/<modulo>/<recurso> | ✅ | Mismo contrato |
| GET /transacciones/:id | GET /api/<modulo>/<recurso>/:id | ✅ | Mismo contrato |

## Pruebas Ejecutadas

| Tipo de Prueba | Resultado | Cobertura |
|----------------|-----------|-----------|
| Unitarios | ✅ 100% passed | Services: 85% |
| Integración | ✅ 100% passed | Controllers: 90% |
| E2E | ✅ 100% passed | Endpoints críticos: 100% |

## Diferencias y Decisiones de Diseño

1. **Multi-tenant**: Se mantiene extracción desde JWT (claim `custom:tenant_id`)
2. **Soft delete**: Se implementa con `@DeleteDateColumn()` de TypeORM
3. **Errores**: Mapeo explícito de códigos PostgreSQL a HTTP status

## Rollback Plan

Si hay problemas en producción:
1. Revertir DNS/ALB a Lambda original
2. Desplegar versión anterior del microservicio
3. Investigar logs y errores
```

**Paso 10.3: Checklist de validación final**

```markdown
## Checklist Pre-Producción

### Código
- [ ] Todos los endpoints migrados y funcionando
- [ ] Tests unitarios pasando (>80% cobertura)
- [ ] Tests de integración pasando
- [ ] Tests E2E pasando (flujos críticos)
- [ ] Linting y formato sin errores

### Seguridad
- [ ] JwtTenantGuard configurado como guard global
- [ ] @TenantId() usado en todos los endpoints
- [ ] No hay hardcodeo de tenantId o userId
- [ ] Validación de DTOs activa (whitelist, transform)

### Multi-Tenant
- [ ] Todas las queries filtran por tenantId
- [ ] Soft delete implementado (eliminado_por IS NULL)
- [ ] Auditoría: creado_por, actualizado_por, eliminado_por

### Documentación
- [ ] OpenAPI/Swagger actualizado
- [ ] Guía de migración creada
- [ ] README del servicio actualizado
- [ ] Variables de entorno documentadas en .env.example

### Infraestructura
- [ ] Dockerfile configurado (si aplica)
- [ ] docker-compose.yml para desarrollo
- [ ] Scripts de migración de BD creados
- [ ] Variables de entorno en CI/CD configuradas
```

---

### 3. Prohibiciones Explícitas en Microservicios

- **Prohibido** hardcodear `tenantId` o `userId` en servicios o controladores.
- **Prohibido** obtener `tenantId` desde parámetros de ruta, body o query params (usar siempre `@TenantId()`).
- **Prohibido** omitir `JwtTenantGuard` como guard global en `AppModule`.
- **Prohibido** usar `synchronize: true` en TypeORM para producción.
- **Prohibido** ejecutar migraciones con `psql` o clientes SQL interactivos (usar TypeORM migrations).
- **Prohibido** devolver entidades directas sin DTOs (usar `class-transformer` para serialización).
- **Prohibido** ignorar errores de base de datos sin mapeo a HTTP status apropiado.
- **Prohibido** crear mecanismos ad-hoc de autenticación (usar siempre `JwtTenantGuard`).
- **Prohibido** usar el User Pool incorrecto (`us-east-1_fQl9BKSxq` es para Lambdas, NO para microservicios NestJS).

---

### 4. Referencias Obligatorias

Antes de implementar cualquier microservicio o migración:

1. **Patrón de controlador**: `servicio-contabilidad/src/contabilidad/controladores/plan-contable.controller.ts`
2. **Patrón de servicio**: `servicio-contabilidad/src/contabilidad/servicios/plan-contable.service.ts`
3. **JwtTenantGuard**: `servicio-contabilidad/src/common/guards/jwt-tenant.guard.ts`
4. **Decoradores**: `servicio-contabilidad/src/common/decorators/tenant-id.decorator.ts`
5. **Entidades TypeORM**: `servicio-contabilidad/src/contabilidad/entidades/*.entidad.ts`
6. **Documentación**: `servicio-contabilidad/docs/03-arquitectura/ARQUITECTURA_COMPLETA.md`
7. **Certificación funcional**: `servicio-contabilidad/CERTIFICACION-FUNCIONAL.md`

---

### 5. Servicio Tesorería como Base Funcional (Patrón de Referencia)

El microservicio `servicio-tesoreria` es el **ejemplo más completo y funcional** de implementación NestJS en este repositorio. Debe usarse como referencia para cualquier nuevo microservicio o extensión de los existentes.

#### 5.1 Características Distintivas

El servicio de tesorería implementa patrones avanzados que deben replicarse:

| Característica | Implementación en servicio-tesoreria | Referencia |
|----------------|--------------------------------------|------------|
| **Módulos múltiples** | `TesoreriaModule` + `CarteraModule` | `src/tesoreria/tesoreria.module.ts` |
| **Programación Cron** | `@nestjs/schedule` para tareas periódicas | `AppModule` línea 21 |
| **Interceptors globales** | `ResponseInterceptor` + `LoggingInterceptor` | `src/common/interceptors/` |
| **Filtros de excepciones** | `AllExceptionsFilter` para manejo centralizado | `src/common/filters/all-exceptions.filter.ts` |
| **Transacciones BD** | QueryRunner con startTransaction/commit/rollback | `caja.service.ts` líneas 42-44 |
| **Auditoría** | `AuditService` para registro de operaciones | `src/tesoreria/services/audit.service.ts` |
| **Entidades completas** | Entidades con enums, relaciones y validaciones | `src/tesoreria/entities/` |
| **DTOs avanzados** | DTOs con validaciones anidadas y composed types | `src/tesoreria/dtos/caja.dto.ts` |
| **Patrón de Módulo** | Estructura: controllers/services/entities/dtos en mismo módulo | `src/tesoreria/` |

#### 5.2 AppModule con Configuración Completa

```typescript
// servicio-tesoreria/src/app.module.ts - PATRÓN DE REFERENCIA
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),  // ← Tareas Cron
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        schema: configService.get('DB_SCHEMA', 'tesoreria'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: {
          rejectUnauthorized: false,
        },
      }),
      inject: [ConfigService],
    }),
    TesoreriaModule,
    CarteraModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtTenantGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
```

**Elementos obligatorios a incluir:**
- `ScheduleModule.forRoot()` para tareas programadas
- `APP_INTERCEPTOR` para `ResponseInterceptor` y `LoggingInterceptor`
- `APP_FILTER` para `AllExceptionsFilter`
- `autoLoadEntities: true` en TypeORM
- `schema` específico del dominio (ej: `tesoreria`, `contabilidad`)

#### 5.3 Patrón de Controlador Multi-Tenant con Swagger

```typescript
// servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts - PATRÓN DE REFERENCIA
@ApiTags('Cajas')
@ApiBearerAuth()
@Controller('tesoreria/cajas')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva caja' })
  @ApiResponse({ status: 201, description: 'Caja creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(
    @Body() dto: CreateCajaDto,
    @TenantId() tenantId: string,
    @UserId() userId: string
  ) {
    return this.cajaService.create(dto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las cajas' })
  @ApiResponse({ status: 200, description: 'Lista de cajas' })
  async findAll(@TenantId() tenantId: string) {
    return this.cajaService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una caja por ID' })
  @ApiResponse({ status: 200, description: 'Caja encontrada' })
  @ApiResponse({ status: 404, description: 'Caja no encontrada' })
  async findOne(
    @Param('id') id: string,
    @TenantId() tenantId: string
  ) {
    return this.cajaService.findOne(id, tenantId);
  }

  @Post(':id/apertura')
  @ApiOperation({ summary: 'Abrir una caja' })
  async abrirCaja(
    @Param('id') id: string,
    @Body() dto: AperturaCajaDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    return this.cajaService.abrirCaja(id, dto, tenantId, userId);
  }
}
```

#### 5.4 Patrón de Servicio con Transacciones

```typescript
// servicio-tesoreria/src/tesoreria/services/caja.service.ts - PATRÓN DE REFERENCIA
@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(CajaEntity)
    private readonly cajaRepository: Repository<CajaEntity>,
    @InjectRepository(CajaOperacionEntity)
    private readonly operacionRepository: Repository<CajaOperacionEntity>,
    @InjectRepository(ArqueoCajaEntity)
    private readonly arqueoRepository: Repository<ArqueoCajaEntity>,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateCajaDto, tenantId: string, userId: string): Promise<CajaEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const caja = this.cajaRepository.create({
        ...dto,
        tenantId,
        estado: EstadoCaja.INACTIVA,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedCaja = await queryRunner.manager.save(caja);

      // Operaciones relacionadas en la misma transacción
      for (const sedeId of dto.sedeIds) {
        await queryRunner.manager.query(
          `INSERT INTO tesoreria.caja_sedes (caja_id, sede_id, id_tenant, created_by) VALUES ($1, $2, $3, $4)`,
          [savedCaja.id, sedeId, tenantId, userId],
        );
      }

      await queryRunner.commitTransaction();
      return savedCaja;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

#### 5.5 Archivos de Referencia Clave

| Archivo | Propósito |
|---------|-----------|
| `servicio-tesoreria/src/app.module.ts` | Configuración completa de módulos, guards, interceptors, filters |
| `servicio-tesoreria/src/tesoreria/tesoreria.module.ts` | Ejemplo de módulo de dominio con múltiples controladores y servicios |
| `servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts` | Controlador con operaciones CRUD, acciones específicas y validaciones |
| `servicio-tesoreria/src/tesoreria/services/caja.service.ts` | Servicio con transacciones, auditoría y lógica de negocio compleja |
| `servicio-tesoreria/src/tesoreria/entities/caja.entity.ts` | Entidad con enums, validaciones y relaciones |
| `servicio-tesoreria/src/tesoreria/dtos/caja.dto.ts` | DTOs con validación avanzada y composición |
| `servicio-tesoreria/src/common/interceptors/response.interceptor.ts` | Interceptor de respuesta para formato consistente |
| `servicio-tesoreria/src/common/interceptors/logging.interceptor.ts` | Interceptor de logging para trazabilidad |
| `servicio-tesoreria/src/common/filters/all-exceptions.filter.ts` | Filtro global de excepciones |
| `servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` | Guard de autenticación y multi-tenant |
| `servicio-tesoreria/src/common/decorators/tenant-id.decorator.ts` | Decorador @TenantId() |
| `servicio-tesoreria/test/*.e2e-spec.ts` | Tests E2E con supertest |

#### 5.6 Reglas para Nuevo Microservicio Basado en servicio-tesoreria

1. **Copiar estructura de AppModule**: Incluir ScheduleModule, ResponseInterceptor, LoggingInterceptor, AllExceptionsFilter
2. **Usar mismo patrón de módulos**: controllers/services/entities/dtos dentro del mismo módulo de dominio
3. **Mantener nomenclatura**: Controllers en `controllers/`, servicios en `services/`, entidades en `entities/`, DTOs en `dtos/`
4. **Seguir patrón de transacciones**: Usar QueryRunner para operaciones que involucren múltiples tablas
5. **Implementar auditoría**: Integrar AuditService para registrar operaciones críticas
6. **Usar enums para estados**: Definir enums para estados de entidad (ej: `EstadoCaja`, `TipoOperacionCaja`)
7. **Documentar con Swagger**: Usar `@ApiTags`, `@ApiOperation`, `@ApiResponse` en cada endpoint

---

## Autenticación y pruebas manuales

**Microservicios NestJS:**
- **Cognito User Pool**: `us-east-1_gmre5QtIx`
- **ARN**: `arn:aws:cognito-idp:us-east-1:068858795558:userpool/us-east-1_gmre5QtIx`
- **Issuer**: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_gmre5QtIx`

**Lambdas AWS:**
- **Cognito User Pool**: `us-east-1_fQl9BKSxq`
- Credenciales de prueba (documentadas en `SWAGGER.yml`):
  - Usuario: `admin@gooderp.com`
  - Password: `Admin123!`

**Token de prueba para microservicios:**
Usar el JWT proporcionado en `servicio-contabilidad/test-cognito-jwt.js` o generar uno nuevo con:

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id <client-id> \
  --auth-parameters USERNAME=admin@gooderp.com,PASSWORD=Admin123! \
  --region us-east-1
```

Todos los endpoints protegidos requieren JWT Bearer, excepto `/auth/custom-login` cuando esté explícitamente documentado.

---

## Expectativas para modelos y agentes

- **Cualquier modelo** (Gemini, Claude, Copilot u otro) que trabaje en este repo debe tomar este archivo (AGENTS.md) como contrato maestro. Ver también [MODELS.md](MODELS.md) para la regla única y referencias a memoria infinita y ultra-economizer.
- Trabaja siempre siguiendo los patrones descritos arriba **tal como están implementados** en `lib/lambda` y `servicio-contabilidad`.
- Antes de introducir un nuevo patrón o variación, revisa primero:
  - Código existente (`utils/*`, módulos NestJS, guards, servicios).
  - Documentos en `servicio-contabilidad/docs` y `lib/lambda/*.md`.
- No inventes nuevos mecanismos de multi‑tenant, autenticación, respuesta HTTP o despliegue mientras existan ya utilidades y patrones consolidados en este repo.

---

## Comandos SDD del Framework

El framework ofrece **94+ comandos** organizados por categoría. Todos son texto plano y funcionan en cualquier IDE/modelo.

### Comandos Principales del Flujo (Pipeline)

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:start` | `/gd:iniciar`, `/gd:comenzar` | Iniciar tarea con detección automática de complejidad |
| `/gd:specify` | `/gd:especificar` | Convertir idea en especificación Gherkin con escenarios de prueba |
| `/gd:clarify` | `/gd:clarificar`, `/gd:detectar-ambiguedad` | Detectar ambigüedades y contradicciones antes de programar |
| `/gd:plan` | `/gd:tech-plan`, `/gd:diseñar`, `/gd:planificar-tecnico` | Generar blueprint técnico con arquitectura y contratos |
| `/gd:breakdown` | `/gd:desglosar` | Dividir plan en tareas concretas con orden de ejecución |
| `/gd:implement` | `/gd:aplicar` | Ejecutar con TDD: RED → GREEN → REFACTOR |
| `/gd:review` | `/gd:auditar`, `/gd:pr-review` | Peer review automático en 7 dimensiones |
| `/gd:verify` | `/gd:validar`, `/gd:verificar` | Validar que implementación coincide SPEC y tasks |
| `/gd:archive` | `/gd:archivar` | Sincronizar delta specs a specs principales y archivar cambio |
| `/gd:prd` | | Generar Product Requirement Document desde fuentes |
| `/gd:preflight` | | Simular costo y consumo de tokens antes de ejecutar |
| `/gd:validar-spec` | | Validar calidad de especificación antes de planificar |
| `/gd:rapido` | | Modo rápido para tareas pequeñas (Nivel 1) |
| `/gd:completo` | | Modo completo para proyectos complejos (Nivel 3) |
| `/gd:reflexionar` | | Reflexionar sobre tarea para mejorar calidad |
| `/gd:pseudocodigo` | | Generar pseudocódigo agnóstico de tecnología |

### Comandos de Análisis y Decisiones

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:explore` | `/gd:explorar` | Explorar codebase antes de proponer cambios |
| `/gd:estimate` | `/gd:estimar` | Estimar con 4 modelos: FP, COCOMO, Poker, Historical |
| `/gd:roundtable` | `/gd:mesa-redonda` | Discusión multi-perspectiva: CPO, UX, Business |
| `/gd:tech-panel` | `/gd:mesa-tecnica` | Panel de expertos: Tech Lead, Backend, Frontend, Architect |
| `/gd:security-audit` | `/gd:auditar-seguridad` | Auditoría estática OWASP Top 10 |
| `/gd:poc` | `/gd:proof-of-concept` | Proof of Concept con timebox y criterios claros |
| `/gd:destilar` | `/gd:minar-referencias` | Extraer specs de código existente (behavior reverse engineering) |
| `/gd:debate` | | Debate adversarial: PM vs Architect vs QA |
| `/gd:drift` | | Detectar drift entre SPEC y código implementado |
| `/gd:reversa` | | Extraer arquitectura de codebase existente (ingeniería inversa) |
| `/gd:presentar` | | Generar presentación interactiva HTML desde contenido |
| `/gd:spec-score` | | Puntuación cuantitativa de calidad de especificaciones (0-100) |
| `/gd:tea` | | Testing Autónomo End-to-End: genera, ejecuta y reporta tests |
| `/gd:playwright` | | Automatización de pruebas funcionales E2E para Frontend |
| `/gd:tech-debt` | | Detectar y cuantificar deuda técnica |
| `/gd:time-travel` | | Debugger de razonamiento que muestra decisiones del framework |
| `/gd:voice` | | Integrar con Claude Code Voice Mode para dictar specs |
| `/gd:webhook` | | Configurar triggers externos para automatizar comandos |

### Comandos de Sesión y Contexto

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:continue` | `/gd:continuar` | Recuperar sesión previa sin perder contexto |
| `/gd:status` | `/gd:estado`, `/gd:donde-estoy` | Mostrar estado actual del proyecto |
| `/gd:doctor` | `/gd:diagnostico` | Diagnosticar y reparar problemas de framework/entorno |
| `/gd:capture` | `/gd:capturar`, `/gd:memorizar` | Capturar ideas sin interrumpir el flujo |
| `/gd:migrate` | `/gd:migrar` | Planificar migración entre stacks (Vue→React, JS→TS) |
| `/gd:recall` | | Consultar memoria de sesiones anteriores |
| `/gd:session` | `/gd:analizar-sesiones` | Analizar patrones de sesiones |
| `/gd:close` | `/gd:cerrar-sesion` | Cerrar sesión correctamente con summary |
| `/gd:agente` | | Cargar agente especializado para tarea específica |
| `/gd:traspasar` | | Generar documento de traspaso para otra sesión |
| `/gd:traspaso` | | Transferir contexto entre sesiones |

### Comandos de Calidad y Gates

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:gate` | | Definir y ejecutar quality gates personalizados |
| `/gd:threshold` | | Configurar thresholds de coverage, quality, etc. |
| `/gd:quality` | | Verificar calidad del código (SOLID, patrones, etc.) |
| `/gd:guardian` | |卫守: protege contra cambios que violan la SPEC |
| `/gd:stub-detect` | `/gd:limpiar-slop` | Detectar código no implementado (TODO, stubs) |
| `/gd:data-policy` | | Enforzar políticas de datos y privacidad |

### Comandos de Contratos y APIs

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:contract-api` | `/gd:contrato-api` | Definir contratos REST/GraphQL con retries, circuit breaker |
| `/gd:contract-ui` | `/gd:contrato-ui` | Definir contratos UI (components, states, contracts) |
| `/gd:specs` | | Gestionar specs Gherkin del proyecto |
| `/gd:diagram` | | Generar diagramas automáticamente (Mermaid) |

### Comandos de Documentación y Tracking

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:changelog` | `/gd:changelog-auto` | Generar changelog automáticamente |
| `/gd:release` | | Gestionar releases y versiones |
| `/gd:audit-trail` | | Mantener auditoría de decisiones y cambios |
| `/gd:history` | `/gd:historial` | Ver historial de cambios del proyecto |
| `/gd:reference` | `/gd:referencia` | Gestionar referencias y documentación |

### Comandos de Testing

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:test-unit` | | Generar tests unitarios automáticamente |
| `/gd:testing` | | Gestionar estrategia de testing completa |
| `/gd:e2e` | | Generar tests E2E desde specs |

### Comandos de Skills y Extensibilidad

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:skill-create` | `/gd:crear-skill` | Crear nueva skill iterativamente |
| `/gd:skill` | | Usar skills existentes |
| `/gd:marketplace` | | Buscar e instalar skills del marketplace |

### Comandos de Estimación y Planning

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:planning` | | Planning poker con múltiples modelos de estimación |
| `/gd:fast-forward` | `/gd:avance-rapido` | Modo fast-forward para tareas simples |
| `/gd:incorporate` | `/gd:incorporar` | Incorporar cambios de otra branch |

### Comandos de Métricas y Dashboard

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:metrics` | `/gd:metricas` | Métricas en terminal |
| `/gd:dashboard` | | Dashboard HTML interactivo |
| `/gd:context-health` | | Salud del contexto y memoria |
| `/gd:tracing` | | Tracing de operaciones |

### Comandos de RAG y Memoria

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:rag` | | Indexar y buscar en memoria vectorial |
| `/gd:code-rag` | `/gd:tech-rag` | RAG específico para código técnico |
| `/gd:worktree` | | Gestionar worktrees para múltiples features |

### Comandos de Actualización y Mantenimiento

| Comando | Alias | Qué hace |
|---------|-------|-----------|
| `/gd:update` | `/gd:actualizar` | Actualizar GAF a última versión |
| `/gd:upgrade` | | Upgrade de versión del proyecto |
| `/gd:version` | | Ver versiones actuales |

### Modelos de Razonamiento (15)

| Comando | Cuándo usar |
|---------|-------------|
| `/gd:razonar:primeros-principios` | Descomponer a verdades fundamentales |
| `/gd:razonar:5-porques` | Causa raíz de bug o decisión |
| `/gd:razonar:pareto` | Focus en 20% que genera 80% valor |
| `/gd:razonar:inversion` | ¿Cómo garatizo el fracaso? |
| `/gd:razonar:segundo-orden` | Consecuencias de consecuencias |
| `/gd:razonar:pre-mortem` | Anticipar fallos antes de que ocurran |
| `/gd:razonar:minimizar-arrepentimiento` | Decisiones con menor regret |
| `/gd:razonar:costo-oportunidad` | Evaluar alternativas sacrificadas |
| `/gd:razonar:circulo-competencia` | Conocer límites del conocimiento |
| `/gd:razonar:mapa-territorio` | Modelo vs realidad |
| `/gd:razonar:probabilistico` | Razonar en probabilidades |
| `/gd:razonar:reversibilidad` | ¿Esta decisión se puede deshacer? |
| `/gd:razonar:rlm-verificacion` | Verificar con sub-LLMs frescos |
| `/gd:razonar:rlm-cadena-pensamiento` | Multi-paso Context Folding |
| `/gd:razonar:rlm-descomposicion` | Dividir con subagentes |

> **"Context Window = RAM, File System = Disk"**

1. **Persistencia sobre conversación** — Escribirlo, no solo decirlo
2. **Estructura sobre caos** — Archivos claros, roles claros
3. **Recuperación sobre reinicio** — Nunca perder progreso
4. **Evidencia sobre afirmaciones** — Mostrar, no contar
5. **Simpleridad sobre complejidad** — Todo en tu idioma

---

## Integración con CI/CD

Para ejecutar quality gates en cada Pull Request:

```yaml
# .github/workflows/sdd-check.yml
- uses: gaf/gaf-sdd@main
  with:
    gates: all          # spec, tdd, coverage, owasp, custom
    min-coverage: 85
    comment-pr: true    # Publicar resultados como comentario
```

---

## Certificación SDD del Proyecto

Badges que pueden agregarse al README cuando el proyecto cumpla los criterios:

```
[![SDD Certified](https://img.shields.io/badge/SDD_Certified-Don_Cheli-6c5ce7?style=for-the-badge)](https://github.com/gaf/gaf-sdd)
[![TDD](https://img.shields.io/badge/TDD-Iron_Law_Enforced-00cec9?style=for-the-badge)](https://github.com/gaf/gaf-sdd)
[![OWASP](https://img.shields.io/badge/OWASP-Audited_by_Don_Cheli-e17055?style=for-the-badge)](https://github.com/gaf/gaf-sdd)
```

Criterios de certificación:
- Todas las implementaciones siguen flujo SDD (Specify → Review)
- TDD obligatorio en todo código nuevo
- Coverage ≥ 85% en módulos de negocio
- 0 vulnerabilidades OWASP en análisis de seguridad
- Documentación completa (OpenAPI, ADRs, README)

---

## Agentes Autonomos Especializados (Sistema de Orquesta)

El framework implementa **agentes autonomos profundos** especializados por dominio, con memoria persistente y ejecución robusta.

### Arquitectura de Agentes

| Agente | Dominio | Responsabilidad | Memoria Persistente |
|--------|---------|-----------------|---------------------|
| 🖥️ **Agente Backend** | `lib/lambda/*`, `servicio-*/src` | Lambdas, microservicios, APIs, BD | `project.md`, `registry.md`, SPECs |
| 🎨 **Agente Frontend** | Angular apps, componentes | UI/UX, servicios, estados, routing | `project.md`, componentes docs |
| 🏗️ **Agente Infraestructura** | `terraform/`, docker, cloud | IaC, despliegue, recursos, networking | `terraform/` state, configs |
| 🧪 **Agente QA/E2E** | Pruebas automatizadas | Funcionales, integración, contrato | `INFORME-PRUEBAS-FUNCIONALES-*` |
| 🎭 **Agente Playwright** | Frontend Automation | Pruebas funcionales E2E de UI/UX | `project.md`, Playwright scripts |
| 🔍 **Agente Review** | Code review, calidad | Static analysis, security, performance | `RESUMEN-*.md`, análisis previos |
| 📊 **Agente Negocio** | Requisitos, validación | BDD scenarios, validación domain | SPECs, Gherkin, certificación |

### Reglas de Ejecución de Agentes

**Para cada tarea, el agente debe:**
1. **Consultar memoria primero** — Leer `project.md`, `registry.md`, SPECs relacionadas
2. **Consultar RAG** — Para preguntas sobre decisiones pasadas: `npm run rag:query -- "pregunta"`
3. **Verificar SPEC** — Toda implementación debe partir de SPEC verificable
4. **Ejecutar TDD** — RED → GREEN → REFACTOR obligatorio
5. **Validar Quality Gates** — Spec, TDD, Coverage, OWASP, Architecture, Docs
6. **Documentar evidencia** — "Tests pasan" > "Creo que funciona"
7. **Actualizar memoria** — Al cerrar, actualizar `project.md` y `registry.md`

---

## Zero Errors Policy (Cero Errores)

**Reglas absolutas para evitar alucinaciones, invenciones y suposiciones:**

### Antes de escribir código

| Regla | Acción Obligatoria |
|-------|-------------------|
| **No asumir** | Siempre consultar SPEC existente antes de implementar |
| **No inventar** | Si no existe patrón, copiar de referencias obligatorias |
| **No suponer** | Verificar cada decisión contra documentación existente |
| **No completar** | Si falta información, pedir clarificación explícita |

### Durante la implementación

| Regla | Acción Obligatoria |
|-------|-------------------|
| **Copiar patrón espejo** | Para lambdas: usar `fnTransaccionLineas` como referencia |
| **Copiar patrón espejo** | Para NestJS: usar `servicio-tesoreria` como referencia |
| **Validar contratos** | Antes de cambiar API, verificar OpenAPI existente |
| **Verificar multi-tenant** | Siempre extraer tenant desde JWT, nunca de body/params |

### Después de implementar

| Regla | Acción Obligatoria |
|-------|-------------------|
| **Evidence-based** | Documentar evidencia: logs, tests, métricas |
| **No dejar stubs** | Si hay `// TODO` o código incompleto, documentar en SPEC |
| **Validar certificaciones** | Ejecutar flujos de `INFORME-PRUEBAS-FUNCIONALES-*.md` |

### Anti-Patrones Prohibidos

- ❌ `"Asumiendo que..."` — NUNCA asumir sin evidencia
- ❌ `"Probablemente..."` — NUNCA guess sin verificar
- ❌ `"Debería funcionar..."` — NUNCA afirmar sin tests
- ❌ `"Creo que..."` — NUNCA opinion sin datos
- ❌ `"Completaré después..."` — NUNCA dejar código incompleto

---

## Compatibilidad Multi-IDE y Multi-Modelo

El framework es **100% agnóstico** al medio de ejecución y modelo AI.

### IDEs Soportados

| IDE | Archivo de Configuración |
|-----|--------------------------|
| **Cursor** | `.cursorrules` (ya existe) |
| **Claude Code** | `CLAUDE.md` (ya existe) |
| **Gemini CLI** | `GEMINI.md` (ya existe) |
| **OpenCode** | `AGENTS.md` (este archivo) |
| **VSCode** | Configuración en `.vscode/` |
| **Github Copilot** | Configuración en `.github/` |
| **Qwen CLI** | Adaptar desde `AGENTS.md` |
| **Kilo/Kiro** | Adaptar desde `AGENTS.md` |

### Modelos AI Soportados

| Modelo | Configuración |
|--------|---------------|
| **Claude Sonnet** | Usar `CLAUDE.md` como referencia |
| **Gemini 2.5** | Usar `GEMINI.md` como referencia |
| **Qwen 3** | Adaptar desde `AGENTS.md` |
| **MiniMax** | Adaptar desde `AGENTS.md` |
| **GPT-4o** | Adaptar desde `AGENTS.md` |

### Reglas de Compatibilidad

1. **Todo comando SDD funciona en cualquier IDE** — Los comandos `/gd:*` son texto plano
2. **Todo patrón funciona en cualquier modelo** — Los patrones son código/documentación, no prompts
3. **Memoria es agnóstica** — `project.md`, `registry.md`, RAG funcionan con cualquier modelo
4. **Tests son universales** — Jest, supertest, Playwright funcionan con cualquier modelo

---

## Pipeline de Calidad Integral

### Flujo de Ejecución Completa

```
Idea → Specify → Clarify → Plan → Break Down → Implement → Review → Deploy → Verify
```

| Fase | Quality Gate | Agente Responsable | Evidencia Requerida |
|------|--------------|---------------------|---------------------|
| Specify | Spec Gate | Agente Negocio | Gherkin con escenarios |
| Clarify | Spec Gate | Agente Review | SPEC validada, sin ambigüedades |
| Plan | Architecture Gate | System Architect | Blueprint + DBML |
| Break Down | - | Agente Backend/Frontend | Tasks con criterios |
| Implement | TDD Gate + Coverage Gate | Agente Backend/Frontend | Tests pasando, ≥85% coverage |
| Review | OWASP + Architecture | Agente Review + Reaper Sec | Reporte de review |
| Deploy | - | Agente Infraestructura | Terraform apply |
| Verify | Regression Gate | Agente QA/E2E | Tests E2E pasando |

### Integración CI/CD Completa

```yaml
# .github/workflows/sdd-full.yml
name: SDD Quality Gates
on: [pull_request, push]

jobs:
  spec-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate SPEC
        run: npm run spec:validate

  tdd-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests with Coverage
        run: npm test -- --coverage --threshold=85

  owasp-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: OWASP Scan
        run: npm run security:audit

  e2e-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E Tests
        run: npm run test:e2e
```

---

## Comandos SDD Mejorados con Implementación

### Comandos Principales (con ejecución autónoma)

| Comando | Implementación |
|---------|----------------|
| `/gd:start "<tarea>"` | Auto-detectar complejidad → generar SPEC → iniciar flujo |
| `/gd:specify "<idea>"` | Generar Gherkin con escenarios, priorizar, definir DBML |
| `/gd:clarify` | Detectar ambigüedades → pedir clarificación → validar SPEC |
| `/gd:tech-plan` | Generar blueprint técnico con arquitectura y contratos |
| `/gd:breakdown` | Dividir en tareas con orden, paralelismo y criterios de aceptación |
| `/gd:implement` | Ejecutar RED → GREEN → REFACTOR con evidencia |
| `/gd:review` | Peer review 7 dimensiones con评分 y recomendaciones |
| `/gd:verify` | Validar contra SPEC, ejecutar migraciones, seeds y certificar con EVIDENCE.md |

### Comandos de Análisis

| Comando | Implementación |
|---------|----------------|
| `/gd:explore` | Escanear codebase, identificar patrones, encontrar referencias |
| `/gd:estimate` | 4 modelos: Function Points, COCOMO, Planning Poker, Historical |
| `/gd:roundtable` | Simular CPO vs UX vs Business con objeciones |
| `/gd:tech-panel` | Panel: Tech Lead + Backend + Frontend + Architect |
| `/gd:security-audit` | OWASP Top 10 estático con reporte |
| `/gd:poc` | Timebox 2-4h, criterios de éxito, validar factibilidad |

### Comandos de Sesión

| Comando | Implementación |
|---------|----------------|
| `/gd:continue` | Restaurar contexto desde `project.md`, `registry.md` |
| `/gd:status` | Mostrar estado: módulos, cambios, quality gates |
| `/gd:doctor` | Diagnosticar: git, framework, environment, ofrecerfix |
| `/gd:capture` | Guardar idea en `.kiro/` sin interrumpir |
| `/gd:migrate` | Plan: Vue→React, JS→TS con equivalencias |

### Modelos de Razonamiento

| Comando | Cuándo usar |
|---------|-------------|
| `/gd:razonar:primeros-principios` | Descomponer a verdades fundamentales |
| `/gd:razonar:5-porques` | Causa raíz de bug o decisión |
| `/gd:razonar:pareto` | Focus en 20% que genera 80% valor |
| `/gd:razonar:inversion` | ¿Cómo garatizo el fracaso? |
| `/gd:razonar:segundo-orden` | Consecuencias de consecuencias |
| `/gd:razonar:pre-mortem` | Anticipar fallos antes de que ocurran |
| `/gd:razonar:minimizar-arrepentimiento` | Decisiones con menor regret |
| `/gd:razonar:costo-oportunidad` | Evaluar alternativas sacrificadas |
| `/gd:razonar:circulo-competencia` | Conocer límites del conocimiento |
| `/gd:razonar:mapa-territorio` | Modelo vs realidad |
| `/gd:razonar:probabilistico` | Razonar en probabilidades |
| `/gd:razonar:reversibilidad` | ¿Esta decisión se puede deshacer? |
| `/gd:razonar:rlm-verificacion` | Verificar con sub-LLMs frescos |
| `/gd:razonar:rlm-cadena-pensamiento` | Multi-paso Context Folding |
| `/gd:razonar:rlm-descomposicion` | Dividir con subagentes |

---

## Referencias Obligatorias (Canon de Madurez)

**Antes de escribir código en cualquier dominio, el agente debe LEER estos archivos:**

### Lambdas de Transacciones

| Archivo | Propósito |
|---------|-----------|
| `lib/lambda/transacciones/fnTransaccionLineas/CLAUDE.md` | Patrón de lambda madura |
| `lib/lambda/transacciones/fnTransaccionLineas/index.mjs` | Router y estructura |
| `lib/lambda/transacciones/fnTransaccionLineas/utils/sanitization.mjs` | extractTenantId |
| `lib/lambda/transacciones/fnTransaccionLineas/utils/responseBuilder.mjs` | Respuestas estándar |
| `lib/lambda/transacciones/fnTransaccionLineas/constants/errors.mjs` | Mapeo errores PG |
| `lib/lambda/transacciones/SPEC-CORRECCION-LAMBDAS-ORQUESTADOR.md` | Orquestación SAGA |

### Microservicios NestJS

| Archivo | Propósito |
|---------|-----------|
| `servicio-tesoreria/src/app.module.ts` | Configuración completa |
| `servicio-tesoreria/src/tesoreria/controllers/caja.controller.ts` | Controlador patrón |
| `servicio-tesoreria/src/tesoreria/services/caja.service.ts` | Servicio con transacciones |
| `servicio-tesoreria/src/common/guards/jwt-tenant.guard.ts` | Multi-tenant guard |
| `servicio-tesoreria/src/common/decorators/tenant-id.decorator.ts` | @TenantId() |
| `servicio-contabilidad/CERTIFICACION-FUNCIONAL.md` | Endpoints certificados |

### Documentación de Proyecto

| Archivo | Propósito |
|---------|-----------|
| `project.md` | Estado actual de módulos y cambios |
| `registry.md` | Índice numerado de todos los cambios |
| `AGENTS.md` | Este archivo — contrato maestro |
| `npm run rag:query -- "…"` / `rag/scripts/query.mjs` | Consultar decisiones pasadas (RAG) |

---

## Checklist de Calidad por Cambio

Para cualquier cambio, verificar:

### Antes de empezar
- [ ] Consultar `project.md` y `registry.md`
- [ ] Consultar RAG si hay preguntas: `npm run rag:query -- "pregunta"`
- [ ] Identificar nivel de complejidad (0-P-1-2-3-4)
- [ ] Determinar fases SDD requeridas

### Specify + Clarify
- [ ] SPEC en formato Gherkin (Given/When/Then)
- [ ] Escenarios de prueba verificables
- [ ] Sin ambigüedades detectadas
- [ ] DBML o esquema de datos definido

### Plan + Break Down
- [ ] Blueprint técnico con arquitectura
- [ ] Contratos API definidos (OpenAPI)
- [ ] Tareas con criterios de aceptación
- [ ] Orden de ejecución y paralelismo claro

### Implement (TDD)
- [ ] Test escrito ANTES del código (RED)
- [ ] Código hace pasar el test (GREEN)
- [ ] Refactor aplicado (REFACTOR)
- [ ] Coverage ≥ 85%
- [ ] Tests deterministas

### Review
- [ ] OWASP: 0 vulnerabilidades
- [ ] SOLID verificado
- [ ] Patrones respetados
- [ ] Documentación completa

### Post-Implementación
- [ ] Actualizar `project.md`
- [ ] Actualizar `registry.md`
- [ ] Ejecutar flujos de certificación si aplica
- [ ] Evidence documentada

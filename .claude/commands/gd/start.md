# /gd:start — Iniciar Tarea con Detección Automática de Stack y Complejidad

## Alias
- `/gd:iniciar`
- `/gd:comenzar`

---

## Uso

```
/gd:start [descripción de la tarea]
/gd:start --stack=frontend [descripción]
/gd:start --stack=backend [descripción]
/gd:start --stack=fullstack [descripción]
```

---

## Paso 1 — Detección de Stack

Si no se pasa `--stack`, detectar automáticamente por keywords en la descripción:

| Keyword detectada | Stack activado |
|-------------------|----------------|
| componente, angular, ui, pantalla, vista, template, scss, feature, playwright | `frontend` |
| lambda, handler, endpoint, api, nestjs, microservicio, crud, bd, postgresql, tenant, jwt | `backend` |
| fullstack, feature completa, integración frontend backend | `fullstack` |

Si el stack no puede determinarse, preguntar:
> "¿Esta tarea es de frontend (Angular), backend (Lambda/NestJS) o ambos?"

Una vez determinado, cargar el perfil correspondiente desde `openspec/config.yaml → stacks.<stack>`.

**Si stack = frontend** → delegar a `/gd:start-frontend` con la misma descripción.  
**Si stack = backend** → delegar a `/gd:start-backend` con la misma descripción.  
**Si stack = fullstack** → ejecutar de forma estrictamente secuencial: **BD → backend → frontend → certificación**.

### Modo estricto obligatorio si `--stack=frontend`

Cuando el stack sea frontend, el trabajo DEBE anclarse al proyecto real:
- `develop/frontend/gooderp-client`
- `src/app/app.routes.ts`
- raíces reales: `auth/`, `core/`, `shared/`, `modules/`, `features/`, `component/`, `configuration/`, `services/`, `models/`, `logistica/`

Antes de proponer implementación, el comando DEBE identificar explícitamente:
1. **módulo o ruta exacta** a intervenir;
2. **patrón espejo** existente que se va a seguir;
3. **archivos candidatos** que sí se tocarán;
4. **archivos o capas que NO se tocarán**;
5. si el cambio pertenece a `modules/`, `features/`, `shared/`, `core/` o `component/`.

### Reglas no negociables para frontend

- **NUNCA** inventar carpetas top-level nuevas dentro de `src/app`.
- **NUNCA** crear una arquitectura paralela si ya existe un módulo, componente o servicio equivalente.
- **SIEMPRE** reutilizar el path canónico existente (`modules/<dominio>`, `shared/`, `core/`, etc.).
- `shared/` es solo para piezas reutilizables cross-module.
- `core/` es solo para servicios globales, interceptors, api/config y modelos transversales.
- `features/` se usa para verticales modernas aisladas como `parqueaderos`, siguiendo `smart/`, `dumb/`, `models/` y `services/`.
- `component/` y algunas áreas como `logistica/` son legado: solo se modifican si la ruta actual ya vive allí.
- Si el pedido no indica módulo o ruta suficiente, **NO implementar todavía**: primero devolver ubicación sugerida y aclaración mínima.

### Modo estricto obligatorio si `--stack=backend`

Cuando el stack sea backend, el trabajo DEBE anclarse al proyecto real:
- `develop/backend/gooderp-orchestation`
- lambdas en `lib/lambda/**`
- microservicios en `servicio-**`
- despliegue/API Gateway/AWS según scripts y configuración del repo

Antes de proponer implementación, el comando DEBE identificar explícitamente:
1. **si el cambio es Lambda o servicio NestJS**;
2. **ruta exacta** a intervenir;
3. **patrón espejo** real (`fnTipoDescuento`, `servicio-tesoreria`, etc.);
4. **métodos HTTP involucrados** y si falta alguno;
5. **impacto en CORS, API Gateway, despliegue y certificación funcional**.

### Reglas no negociables para backend

- **NUNCA** inventar una estructura paralela a `lib/lambda/<dominio>/fn*`.
- **NUNCA** crear un servicio fuera del patrón `servicio-<nombre>/src/**`.
- **SIEMPRE** seguir los patrones maduros ya existentes del repo.
- Toda Lambda expuesta por API Gateway debe revisar **GET, POST, PUT, DELETE y OPTIONS**, con CORS coherente en código y gateway.
- `OPTIONS` y CORS deben resolverse antes de cualquier validación de negocio.
- Si el requerimiento pide CRUD y faltan métodos, se deben completar según el patrón real.
- Para Lambdas, usar `ResponseBuilder`, `extractTenantId`, `handlers/`, `utils/` y `lambda.config.json`.
- Para servicios NestJS, usar guard global `JwtTenantGuard`, decorador `@TenantId()`, módulos y capas ya existentes.
- Toda salida debe considerar despliegue a AWS y certificación funcional cuando el cambio lo requiera.
- Si el pedido no indica dominio o recurso suficiente, **NO implementar todavía**: primero devolver ubicación sugerida y aclaración mínima.

---

## Paso 2 — Detección de Complejidad

Independientemente del stack, evaluar complejidad:

| Nivel | Nombre | Cuándo | Fases SDD |
|-------|--------|--------|-----------|
| **0** | Atomic | 1 archivo, < 30 min | Implement → Verify |
| **P** | PoC | Validar factibilidad (2-4h) | Hypothesis → Build → Evaluate → Verdict |
| **1** | Micro | 1-3 archivos | Specify (light) → Implement → Review |
| **2** | Standard | Múltiples archivos, 1-3 días | Todas las 6 fases |
| **3** | Complex | Multi-módulo, 1-2 semanas | 6 fases + pseudocódigo |
| **4** | Product | Nuevo sistema, 2+ semanas | 6 fases + constitución + propuesta |

---

## Paso 3 — Razonamiento Previo (Nivel 2+)

Para Nivel 2 o superior, antes de especificar activar razonamiento:

```
/gd:razonar --modelo=primeros-principios [descripción]
```

Esto verifica que el problema esté correctamente encuadrado antes de escribir la SPEC. Evita especificar la solución equivocada con mucho detalle.

---

## Paso 4 — Inicio de Flujo

| Nivel | Flujo |
|-------|-------|
| 0-1 | `/gd:implement` directo (con contexto de stack inyectado) |
| 2+ | `/gd:specify` → `/gd:clarify` → `/gd:plan` → `/gd:breakdown` → `/gd:implement` → `/gd:review` |

En todos los casos, el contexto del stack (patrones, estructuras, convenciones) se inyecta en cada fase del flujo.

### Secuencia obligatoria para requerimientos transversales

Si el requerimiento toca más de una capa, por ejemplo:
- base de datos;
- lambda o servicio backend;
- formulario, pantalla o comportamiento frontend;

el comando DEBE ordenar el trabajo así:

1. **BD primero**
   - validar impacto en tabla, columna, constraints o datos;
   - decidir si requiere migración, ajuste de schema o compatibilidad.
2. **Backend segundo**
   - ajustar lambda/servicio para soportar el nuevo contrato;
   - completar métodos, validaciones, CORS y payloads necesarios.
3. **Frontend tercero**
   - adaptar formulario, facade, servicio y UI solo después de asegurar el contrato backend.
4. **Certificación al final**
   - validar flujo completo de punta a punta;
   - ejecutar pruebas unitarias, validaciones backend/consumos, integración frontend y Playwright E2E;
   - dejar evidencia funcional y técnica.

### Regla severa

En cambios transversales, el comando **NO** debe empezar por frontend solo porque el prompt fue lanzado con `--stack=frontend`. Debe detectar el alcance real y reconducirlo a ejecución secuencial fullstack.

Ejemplo:

```text
gd:start --stack=frontend "... cambiar marca en /items/new, lambda fnProducto y tabla BD ..."
```

Eso se debe reinterpretar como:
- tipo real: **fullstack transversal**
- orden obligatorio: **BD → fnProducto → /items/new → certificación completa**

---

## Salida Esperada al Ejecutar

```
🎯 Stack detectado: [frontend|backend|fullstack]
📊 Nivel de complejidad: [0|P|1|2|3|4] — [Atomic|PoC|Micro|Standard|Complex|Product]
📋 Fases: [lista de fases]
📁 Proyecto: [path del proyecto]
📌 Referencia: [módulo/lambda de referencia]
📍 Ubicación exacta sugerida: [ruta real dentro del proyecto]
🪞 Patrón espejo: [archivo o módulo existente]
🌐 Endpoint base: [si aplica para Lambda/API Gateway]
� Secuencia: [BD → backend → frontend → certificación]🧪 Pruebas obligatorias: [unitarias → backend/consumos → integración frontend → Playwright E2E]�🚦 Modo: strict

→ Iniciando con /gd:[primera-fase]...
```

---

## Comandos Especializados

Para activar directamente el contexto especializado sin detección:

```
/gd:start-frontend [descripción]   → GoodERP Client real, Angular 19, rutas reales, strict mode
/gd:start-backend [descripción]    → GoodERP Orchestation real, Lambda/NestJS, CORS, AWS, certificación
```

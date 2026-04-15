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
**Si stack = fullstack** → ejecutar ambos en secuencia: backend primero, frontend segundo.

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

---

## Salida Esperada al Ejecutar

```
🎯 Stack detectado: [frontend|backend|fullstack]
📊 Nivel de complejidad: [0|P|1|2|3|4] — [Atomic|PoC|Micro|Standard|Complex|Product]
📋 Fases: [lista de fases]
📁 Proyecto: [path del proyecto]
📌 Referencia: [módulo/lambda de referencia]

→ Iniciando con /gd:[primera-fase]...
```

---

## Comandos Especializados

Para activar directamente el contexto especializado sin detección:

```
/gd:start-frontend [descripción]   → Angular 19, Smart/Dumb, Facades, Playwright
/gd:start-backend [descripción]    → Lambda ESM o NestJS, multi-tenant, TDD
```

# /gd:start-backend — Iniciar Tarea Backend (Lambda / NestJS + AWS)

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:start-backend` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Alias
- `/gd:iniciar-backend`
- `/gd:backend`

---

## Uso

```
/gd:start-backend [descripción de la tarea]
/gd:start-backend --change=<slug> [descripción]
/gd:start-backend --project=gooderp-orchestation [descripción]
/gd:start-backend --project=sigat-orchestation [descripción]
```

---

## Proyecto real

| `--project=` | Ruta real |
|---|---|
| `gooderp-orchestation` (default) | `develop/backend/gooderp-orchestation` → `/home/cto-grupo4d/Documents/Good4D/GitHub/dev/gooderp-orchestation` |
| `sigat-orchestation` | `develop/backend/sigat-orchestation` |

Si no se pasa `--project=`, asumir `gooderp-orchestation`.

---

## Paso 1 — Clasificar el tipo de cambio backend

Antes de cualquier implementación, determinar:

```
¿Es Lambda?     → lib/lambda/<dominio>/fn<Nombre>/
¿Es NestJS?     → servicio-<nombre>/src/
¿Es fullstack?  → gd:start --stack=fullstack detecta el alcance real
```

| Indicador en el prompt | Tipo |
|---|---|
| fn*, handler, endpoint HTTP, API Gateway, CRUD básico | Lambda |
| módulo NestJS, RabbitMQ, saga, servicio complejo | NestJS |
| migración SQL, nuevo dominio con lambdas + servicio | Fullstack backend |

---

## Paso 2 — Estructura real del repositorio

### Lambdas
```
lib/lambda/
  <dominio>/           ← agendamiento, auth, contabilidad, core, inventario, etc.
    fn<Nombre>/
      index.mjs        ← handler principal
      handlers/        ← handlers por método HTTP (GET, POST, PUT, DELETE, OPTIONS)
      utils/           ← utilidades de dominio
      lambda.config.json ← configuración de despliegue (nombre AWS, runtime, memoria, etc.)
      package.json
      __tests__/       ← tests Jest
```

### Servicios NestJS
```
servicio-<nombre>/
  src/
    <dominio>/
      <dominio>.module.ts
      <dominio>.controller.ts
      <dominio>.service.ts
      dto/
      entities/
  test/
```

### Dominios lambda existentes
```
agendamiento, auth, camposDinamicos, configuracionEventos, contabilidad,
core, email, fiscal, fnCognitoTokenExchange, fnCustomLogin,
functionsConfiguration, geografico, helpers, inventario, kb, motorReglas,
negocio, nomina, parqueaderos, produccion, reportes, saga, tesoreria,
transacciones, transversal
```

---

## Paso 3 — Identificar Lambda de referencia (patrón espejo)

**NUNCA** inventar una estructura nueva. Buscar la Lambda más cercana al dominio.

Lambda de referencia canónica: `lib/lambda/inventario/fnEntradaInventario/`

Estructura obligatoria de una Lambda:
```
fn<Nombre>/
  index.mjs              ← exporta handler, enruta a handlers/ por método HTTP
  handlers/
    get.mjs              ← lógica GET
    post.mjs             ← lógica POST
    put.mjs              ← lógica PUT
    delete.mjs           ← lógica DELETE
    options.mjs          ← CORS preflight (siempre presente)
  utils/
    db.mjs               ← conexión PostgreSQL (pg)
    response.mjs         ← ResponseBuilder
  lambda.config.json     ← nombre AWS, runtime nodejs20.x, memoria 256, timeout 30
  package.json
```

### Reglas de implementación Lambda

- `tenantId` siempre desde JWT: `custom:tenant_id` — NUNCA desde body o query param
- `OPTIONS` primero — siempre presente, sin validación de negocio
- Usar `ResponseBuilder` para todas las respuestas (no construir JSON manualmente)
- Usar `extractTenantId` desde el evento Lambda
- Cada método HTTP en su propio archivo dentro de `handlers/`
- Si la lambda tiene CRUD completo: GET lista, GET por ID, POST, PUT, DELETE, OPTIONS — los 6 métodos

---

## Paso 4 — Despliegue real

**No hay GitHub Actions de despliegue en este repo.**

El despliegue se hace con `lambda-deploy` (herramienta local del repo):

```bash
cd develop/backend/gooderp-orchestation
node lambda-deploy/deploy.mjs --function=fn<Nombre> --domain=<dominio>
```

O directamente con AWS CLI:
```bash
cd lib/lambda/<dominio>/fn<Nombre>
zip -r function.zip . --exclude "node_modules/*" "*.test.mjs" "*.md"
aws lambda update-function-code \
  --function-name <nombre-en-lambda.config.json> \
  --zip-file fileb://function.zip
```

El nombre de función AWS está en `lambda.config.json → name`.

**Antes de desplegar**: confirmar que `lambda.config.json` tiene el nombre AWS correcto.

---

## Paso 5 — Tests obligatorios (gate bloqueante)

```
/gd:test-Backend --change=<slug>
```

Umbrales mínimos:
| Tipo | Umbral |
|---|---|
| Smoke / CORS / Auth | 100% |
| Happy path | ≥ 95% |
| Coverage líneas Lambda | ≥ 80% |
| Coverage líneas NestJS | ≥ 85% |

Si el gate falla: **DETENER**, reportar qué falló, volver a implementar. No avanzar a `/gd:review`.

---

## Paso 6 — Checklist previo a implementación

Antes de escribir código, el agente DEBE confirmar:

- [ ] ¿Lambda o NestJS?
- [ ] Dominio exacto: `lib/lambda/<dominio>/`
- [ ] Nombre de la función AWS: valor de `lambda.config.json → name`
- [ ] Lambda de referencia (patrón espejo) identificada
- [ ] Métodos HTTP requeridos: GET / POST / PUT / DELETE / OPTIONS
- [ ] `tenantId` validado — viene de JWT `custom:tenant_id`
- [ ] `EVIDENCE.md` creado con `change-slug`
- [ ] Rama `fix/<slug>` creada en el repo

---

## Salida Esperada al Ejecutar

```text
Tipo: [Lambda|NestJS|Fullstack backend]
Proyecto: develop/backend/gooderp-orchestation
Dominio: lib/lambda/<dominio>/
Lambda objetivo: fn<Nombre>
Nombre AWS: [valor de lambda.config.json → name]
Patrón espejo: lib/lambda/<dominio-referencia>/fn<Referencia>/
Métodos HTTP: [GET|POST|PUT|DELETE|OPTIONS]
Change slug: <change-slug>
Gate tests: /gd:test-Backend
Despliegue: node lambda-deploy/deploy.mjs --function=fn<Nombre>
Política: strict + zero-error + tenantId-desde-JWT

→ Iniciando con /gd:implement --change=<change-slug>...
```

---

## Reglas no negociables

- **NUNCA** implementar sobre rama base directamente — siempre `fix/<slug>`
- **NUNCA** `tenantId` desde body, headers manuales o query params — solo JWT `custom:tenant_id`
- **NUNCA** inventar una estructura de carpetas fuera de `lib/lambda/<dominio>/fn<Nombre>/`
- **NUNCA** omitir `OPTIONS` en una lambda expuesta por API Gateway
- **NUNCA** construir respuestas JSON manualmente — usar `ResponseBuilder`
- **SIEMPRE** incluir CORS antes de cualquier validación de negocio
- **SIEMPRE** verificar que `lambda.config.json → name` coincide con el nombre AWS real

---

## Flujo completo (referencia rápida)

```
/gd:start-backend
  → Identificar Lambda/NestJS + dominio + patrón espejo
  → /gd:implement --change=<slug>   (TDD: RED → GREEN → REFACTOR)
  → /gd:test-Backend                (gate bloqueante)
  → /gd:review --change=<slug>
  → /gd:verify --change=<slug>
  → /gd:close  --change=<slug>      (EVIDENCE.md completo)
  → /gd:deploy --change=<slug>      (lambda-deploy o AWS CLI)
  → /gd:archive --change=<slug>
```

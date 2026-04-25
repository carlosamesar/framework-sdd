# /gd:specify — Especificación de Requisitos (Nivel 2+)

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:specify` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Alias
- `/gd:especificar`
- `/gd:spec`

---

## Propósito

Convertir la descripción de alto nivel de una tarea en una especificación estructurada y verificable:
- Criterios de aceptación precisos
- Contratos de API o interfaces (si aplica)
- Reglas de negocio explícitas
- Escenarios de borde y casos de error

Esta fase produce el documento `SPEC.md` del cambio. Sin él, las fases `plan`, `implement` y `verify` no tienen base.

---

## Parámetros

```
/gd:specify [descripción del cambio]
/gd:specify --change=<slug> [descripción]
/gd:specify --project=<proyecto> [descripción]
```

El `--change=<slug>` define el identificador del cambio que viajará a todos los comandos posteriores:
- `implement`, `review`, `verify`, `close`, `release`, `deploy`, `archive`
- Se usa en `npm run evidence:gate -- --change=<slug>`

Si no se pasa `--change=`, generar un slug automático con formato `kebab-case` desde la descripción (máx 40 caracteres).

---

## Inputs requeridos

Antes de escribir la SPEC, el agente debe confirmar:

1. **Stack** — frontend / backend / fullstack (heredado de `/gd:start`)
2. **Proyecto** — repo real (heredado de `--project=`)
3. **Nivel de complejidad** — Standard (2), Complex (3) o Product (4)
4. **Descripción del cambio** — qué debe hacer el sistema (no cómo)

Si falta alguno de estos, solicitarlos antes de continuar.

---

## Proceso

### 1. Identificar el dominio funcional

Determinar qué área del sistema se ve afectada:
- Módulo / feature / lambda / servicio
- Capa: BD, backend, frontend, integración
- Actores involucrados: usuario, tenant, sistema externo

### 2. Redactar criterios de aceptación

Formato **Gherkin**: `Given / When / Then` (o bullet estructurado si es más claro):

```
AC-01: [Criterio de aceptación 1]
  Given: [estado inicial]
  When: [acción disparada]
  Then: [resultado esperado]
  And: [condición adicional si aplica]
```

Cada criterio debe ser:
- **Verificable**: se puede testear automáticamente o con un paso manual preciso
- **Atómico**: cubre una sola condición
- **Sin ambigüedad**: sin "debería", "puede que", "a veces"

### 3. Definir contratos (si aplica)

Para backend:
- Endpoint URL, método HTTP
- Request body / query params
- Response shape (status codes + payload)
- Errores esperados (400, 401, 403, 404, 500)

Para frontend:
- Inputs del componente (`@Input`)
- Eventos emitidos (`@Output`)
- Estado interno relevante (Signal / BehaviorSubject)
- Comportamiento visual esperado

### 4. Listar reglas de negocio

Reglas que condicionan el comportamiento:
- Validaciones específicas del dominio
- Restricciones multi-tenant (`tenantId` desde JWT `custom:tenant_id`)
- Límites de datos, formatos, permisos

### 5. Definir escenarios de borde

- ¿Qué pasa si el payload llega vacío?
- ¿Qué pasa si el tenant no tiene permiso?
- ¿Qué pasa si hay un error de red?
- ¿Qué pasa con datos en bordes numéricos (0, null, max)?

---

## Salida Esperada

Archivo `SPEC.md` creado en:
```
openspec/changes/<change-slug>/SPEC.md
```

Si el directorio `openspec/changes/<change-slug>/` no existe, crearlo antes de escribir el archivo.

Estructura del archivo:

```markdown
# SPEC — <change-slug>

## Descripción
[Qué resuelve este cambio en una oración]

## Stack / Proyecto
- Stack: [frontend|backend|fullstack]
- Proyecto: [ruta real]
- Módulo: [nombre del módulo o lambda]

## Criterios de Aceptación
- AC-01: ...
- AC-02: ...

## Contratos
[Endpoints / Inputs-Outputs / Interfaces]

## Reglas de Negocio
- [Regla 1]
- [Regla 2]

## Escenarios de Borde
- [Borde 1]
- [Borde 2]

## Change Slug
`<change-slug>` — usar en todos los comandos siguientes:
  /gd:clarify --change=<change-slug>
  /gd:plan --change=<change-slug>
  ...
```

---

## Gate de Salida

La SPEC solo está lista cuando:
- [ ] Todos los criterios de aceptación son verificables
- [ ] Los contratos están definidos (o declarados como N/A con justificación)
- [ ] Las reglas de negocio clave están listadas
- [ ] El `change-slug` está definido y documentado

Si algún punto no puede resolverse, **pasar a `/gd:clarify`** antes de continuar.

---

## Siguiente paso

```
/gd:clarify --change=<change-slug>
```

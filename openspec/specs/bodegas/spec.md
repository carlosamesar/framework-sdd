# Spec: Bodega — tipo_bodega y responsables

## Context

Tabla `public.bodegas` en GoodERP. Lambda `fnBodega` gestiona CRUD multi-tenant.

---

## REQ-01: Campo tipo_bodega

**MUST** aceptar los valores `'Virtual'` y `'Fisica'` solamente.  
**MUST** ser opcional en creación (DEFAULT NULL permitido).  
**MUST** ser actualizable vía PUT.

### Scenario 1.1 — Crear bodega con tipo_bodega válido
```
Given: POST /bodegas con body { codigo, nombre, tipo_bodega: "Virtual" }
When: tenantId válido en JWT
Then: 201 Created, response incluye tipo_bodega: "Virtual"
```

### Scenario 1.2 — Crear bodega sin tipo_bodega
```
Given: POST /bodegas con body { codigo, nombre } sin tipo_bodega
When: tenantId válido
Then: 201 Created, tipo_bodega: null en response
```

### Scenario 1.3 — tipo_bodega inválido rechazado
```
Given: POST /bodegas con tipo_bodega: "Almacen"
Then: 400 Bad Request, error: "tipo_bodega must be 'Virtual' or 'Fisica'"
```

---

## REQ-02: Campo responsables (JSONB)

**MUST** ser array de objetos `{ id_usuario: UUID, es_principal: boolean }`.  
**MUST** tener exactamente un objeto con `es_principal: true` si el array no está vacío.  
**MUST NOT** aceptar UUIDs inválidos en `id_usuario`.  
**MAY** ser null o array vacío.

### Scenario 2.1 — Crear bodega con responsables válidos
```
Given: POST /bodegas con responsables: [{ id_usuario: "<uuid>", es_principal: true }, { id_usuario: "<uuid2>", es_principal: false }]
Then: 201 Created, responsables persiste en DB
```

### Scenario 2.2 — Sin responsable principal → rechazo
```
Given: responsables: [{ id_usuario: "<uuid>", es_principal: false }]
Then: 400 Bad Request, error: "responsables must have exactly one principal"
```

### Scenario 2.3 — Múltiples principales → rechazo
```
Given: responsables: [{ id_usuario: "<uuid>", es_principal: true }, { id_usuario: "<uuid2>", es_principal: true }]
Then: 400 Bad Request
```

### Scenario 2.4 — UUID inválido en responsables → rechazo
```
Given: responsables: [{ id_usuario: "no-es-uuid", es_principal: true }]
Then: 400 Bad Request, error sobre UUID inválido
```

### Scenario 2.5 — responsables vacío o null → aceptado
```
Given: responsables: [] o responsables: null
Then: 201/200 OK, sin validación de principal
```

---

## REQ-03: Migración DB idempotente

**MUST** crear ENUM `tipo_bodega_enum ('Virtual', 'Fisica')` si no existe.  
**MUST** agregar columna `tipo_bodega` tipo `tipo_bodega_enum` si no existe.  
**MUST** agregar columna `responsables` tipo `JSONB` si no existe.  
**MUST** ejecutarse sin error si ya fue aplicada (idempotente).

# Design: Endpoint Unificado de Cambio de Estado de Transacción

**Change**: `transaccion-cambio-estado-unificado`
**Date**: 2026-04-08
**Status**: APPROVED

---

## 1. Arquitectura General

### 1.1 Componentes Afectados

| Componente | Acción | Descripción |
|------------|--------|-------------|
| `utils/responseBuilder.mjs` | MODIFICAR | Agregar `notFound()` (404) y `forbidden()` (403) |
| `handlers/cambiarEstado.mjs` | CREAR | Handler principal del endpoint |
| `handlers/cambiarEstado.test.mjs` | CREAR | Tests TDD del handler |
| `index.mjs` | MODIFICAR | Routing + import de nuevas funciones |

### 1.2 Flujo de Ejecución

```
API Gateway → index.mjs (handler)
  ├── OPTIONS → handleCorsPreFlight()
  ├── GET     → handleGetRequest()
  └── POST
        ├── path includes '/cambiar-estado'?
        │     YES → cambiarEstadoHandler(event, tenantId)
        │           ├── validatePayload()     → 400 si falla
        │           ├── fetchTransaccion()    → 404 si no existe
        │           ├── checkTenantOwnership() → 403 si otro tenant
        │           ├── validateTransition()  → 409 si inválida
        │           └── executeAtomicUpdate() → 200 OK
        └── NO  → handlePostRequest() (comportamiento existente)
```

---

## 2. Decisiones de Diseño

### 2.1 Routing en index.mjs

**Decisión**: Detectar la nueva ruta con `event.path?.includes('/cambiar-estado')` **antes** del `handlePostRequest` en el bloque `if (httpMethod === 'POST')`.

**Justificación**: Patrón ya usado en la lambda para sub-rutas especiales. No requiere cambios en la firma de `handlePostRequest`. Es flexible con variaciones de path (`/api/v1/transacciones-unificadas/abc123/cambiar-estado`).

**Código a insertar antes de la línea 516**:
```javascript
// Ruta especial: POST /{id}/cambiar-estado
if (event.httpMethod === 'POST' && event.path?.includes('/cambiar-estado')) {
  const { cambiarEstadoHandler } = await import('./handlers/cambiarEstado.mjs');
  return await cambiarEstadoHandler(event, tenantId, correlationId);
}
```

### 2.2 Extracción de userId

**Decisión**: Extraer `userId` (claim `sub`) manualmente desde el payload JWT decodificado en base64, dentro de `cambiarEstado.mjs`.

**Justificación**: `sanitization.mjs` solo exporta `extractTenantId`. No existe util de extracción de `userId`. Seguir el patrón de decodificar el JWT directamente como se hace en otros handlers del orquestador.

```javascript
function extractUserId(event) {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return 'sistema';
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    return payload.sub || payload['cognito:username'] || payload.username || 'sistema';
  } catch {
    return 'sistema';
  }
}
```

### 2.3 Acceso a Base de Datos

**Decisión**: Usar `TransactionManager` para las operaciones de escritura atómica (UPDATE transacciones + INSERT transaccion_estado).

Para el SELECT inicial (fetch de la transacción), usar también `TransactionManager` ya que incluye `getClient()` para queries simples.

**Justificación**: El orquestador ya tiene `utils/transactionManager.mjs`. No existe `utils/database.mjs`. Usar el patrón ya establecido en la lambda.

**Importación**:
```javascript
import TransactionManager from '../utils/transactionManager.mjs';
```

### 2.4 Consulta de Estado Actual por nombre

**Decisión**: El handler recibe `id_estado` (UUID del estado destino). Para validar la transición, necesita el **nombre** del estado origen y el **nombre** del estado destino.

**Estrategia**:
1. Fetch de la transacción por `id_transaccion` → obtiene `id_estado` actual
2. JOIN o sub-query contra tabla `transaccion_estados` para obtener el nombre del estado origen
3. Query separada para obtener el nombre del estado destino por `id_estado` (payload)

**Query de fetch**:
```sql
SELECT t.id, t.id_estado, t.id_tenant, e.nombre AS estado_nombre
FROM transacciones t
JOIN transaccion_estados e ON e.id = t.id_estado
WHERE t.id = $1
```

**Query de estado destino**:
```sql
SELECT id, nombre FROM transaccion_estados WHERE id = $1
```

### 2.5 Matriz de Transiciones

**Decisión**: Definir la matriz como objeto literal inmutable en el handler, indexado por nombre de estado.

```javascript
const TRANSICIONES_PERMITIDAS = {
  'BORRADOR':   ['PENDIENTE', 'ANULADA'],
  'PENDIENTE':  ['APROBADA', 'RECHAZADA', 'ANULADA'],
  'APROBADA':   ['COMPLETADA'],
  'RECHAZADA':  [],
  'ANULADA':    [],
  'COMPLETADA': [],
};
```

### 2.6 Operación Atómica (UPDATE + INSERT)

**Decisión**: Usar `TransactionManager.executeInTransaction(callback)` con dos queries dentro del callback:

1. `UPDATE transacciones SET id_estado = $1, actualizado_por = $2, actualizado_en = NOW() WHERE id = $3 AND id_tenant = $4`
2. `INSERT INTO transaccion_estado (id, id_transaccion, id_estado, id_tenant, creado_por, creado_en) VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW())`

**Patrón**:
```javascript
const tm = new TransactionManager();
const result = await tm.executeInTransaction(async (client) => {
  await client.query('UPDATE transacciones SET ...', [...]);
  await client.query('INSERT INTO transaccion_estado ...', [...]);
  return { ... };
});
```

### 2.7 ResponseBuilder — Funciones a Agregar

**`notFound(message)`**: HTTP 404, código `NOT_FOUND`
**`forbidden(message)`**: HTTP 403, código `FORBIDDEN`

Ambas siguen el mismo shape que las funciones existentes y delegán a `error()`.

---

## 3. Estructura del Handler cambiarEstado.mjs

```javascript
// handlers/cambiarEstado.mjs

import TransactionManager from '../utils/transactionManager.mjs';
import { 
  success, error, validationError, unauthorized, forbidden, notFound 
} from '../utils/responseBuilder.mjs';

const TRANSICIONES_PERMITIDAS = { ... };

function extractUserId(event) { ... }

function validatePayload(body) { ... }  // Verifica id_transaccion y id_estado como UUIDs

async function fetchTransaccion(client, idTransaccion) { ... }  // SELECT + JOIN estados

async function fetchEstadoNombre(client, idEstado) { ... }  // SELECT nombre FROM transaccion_estados

function isValidTransition(estadoOrigen, estadoDestino) { ... }

export async function cambiarEstadoHandler(event, tenantId, correlationId) {
  // 1. Parse body
  // 2. Validate payload (400)
  // 3. Fetch transaccion + estado origen (404)
  // 4. Check tenant ownership (403)
  // 5. Fetch estado destino nombre (404)
  // 6. Validate transition (409)
  // 7. Atomic UPDATE + INSERT
  // 8. Return 200
}
```

---

## 4. Esquema de BD Referenciado

### Tabla `transacciones` (existente, MODIFICAR)
- `id` UUID PK
- `id_estado` UUID FK → `transaccion_estados.id`
- `id_tenant` UUID
- `actualizado_por` UUID
- `actualizado_en` TIMESTAMP

### Tabla `transaccion_estados` (existente, solo lectura)
- `id` UUID PK
- `nombre` VARCHAR (ej: 'PENDIENTE', 'APROBADA', etc.)

### Tabla `transaccion_estado` (existente, INSERT)
- `id` UUID PK (uuid_generate_v4())
- `id_transaccion` UUID FK
- `id_estado` UUID FK
- `id_tenant` UUID
- `creado_por` UUID
- `creado_en` TIMESTAMP

---

## 5. Contrato HTTP Final

Ver `spec.md` — Contract HTTP section.

Resumen:
- `POST /api/v1/transacciones-unificadas/{id}/cambiar-estado`
- Body: `{ id_transaccion: uuid, id_estado: uuid }`
- Responses: 200, 400, 401, 403, 404, 409, 500

---

## 6. Consideraciones de Seguridad (OWASP)

| Riesgo | Mitigación |
|--------|-----------|
| Injection (SQL) | Queries parametrizadas con `$1, $2, ...` en todos los queries |
| Broken Access Control | Verificar `id_tenant` del JWT contra `id_tenant` de la transacción (AC-6) |
| Cross-tenant data leak | El SELECT siempre usa el `tenantId` del JWT para verificar ownership |
| Replay / IDOR | El `id_transaccion` del body se verifica contra el `id_tenant` del JWT, no contra URL params solos |

---

## 7. Deviations from Spec

Ninguna. El diseño es completamente trazable a `spec.md`.

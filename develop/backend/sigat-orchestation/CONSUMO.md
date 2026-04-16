# CONTRATO DE CONSUMO DE SERVICIOS — Frontend Integration

**Versión**: 2.0 | **Fecha**: 2026-04-14
**Propósito**: Contrato único de integración para el frontend
**Base URL**: `http://localhost:3081`

> **IMPORTANTE**: El frontend **SOLO** conecta al **API Gateway** (puerto 3081). Todos los servicios internos son accedidos exclusivamente a través del gateway mediante proxy routing.

---

## Arquitectura de Conexión

```
┌──────────────┐
│   Frontend   │
│  (Browser)  │
└──────┬───────┘
       │ HTTP/WebSocket
       │ http://localhost:3081
       ▼
┌──────────────────────────────────────┐
│      SIGAT API Gateway (:3081)         │  ← PUNTO ÚNICO DE ENTRADA
│  • Autenticación JWT                   │
│  • Rate Limiting                     │
│  • Proxy Routing a microsservicios    │
└──────┬──────┬──────┬──────┬─────────┘
        │      │      │      │
   ┌────┘  ┌───┘  ┌───┘  ┌─┘
   ▼       ▼      ▼      ▼
Tenant  Workspace Integr. Notif.
:3040   :3050   :3060   :3090
```

### Proxy Routing del Gateway

| Path en Gateway | Servicio Destino | Puerto | Rewrite Aplicado |
|----------------|---------------|--------|----------------|
| `/api/v1/auth/*` | sigat-api-gateway | 3081 | — |
| `/api/v1/tenant/*` | sigat-tenant | 3040 | `/api/v1/tenant` → `/api/v1` |
| `/api/v1/workspace/*` | sigat-workspace | 3050 | `/api/v1/workspace` → `/api/v1` |
| `/api/v1/integration/*` | sigat-integration | 3060 | `/api/v1/integration` → `/api/v1` |
| `/api/v1/notifications/*` | sigat-notifications | 3090 | `/api/v1/notifications` → `/api/v1` |

> **Nota**: Planificación y Alertas están dentro del servicio `workspace`, por lo que se acceden via `/api/v1/workspace/planning/*` y `/api/v1/workspace/alerts/*`

---

## Convenciones Generales

### Headers Obligatorios para Todas las Requests

```http
Authorization: Bearer <access_token>
Content-Type: application/json
X-Tenant-ID: <tenant-uuid>  (opcional, si no está en JWT)
```

### Formato de Respuesta de Error

```json
{
  "statusCode": 401,
  "message": "JWT requerido",
  "error": "Unauthorized"
}
```

### Formato de Fechas

Todas las fechas se envían en formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`
Ejemplo: `2026-04-14T12:00:00.000Z`

---

## Índice de Endpoints

1. [Autenticación](#1-autenticación)
2. [Usuarios](#2-usuarios)
3. [Maestros/Catálogos](#3-maestroscatálogos)
4. [Actividades y Canvas](#4-actividades-y-canvas)
   - 4.1 a 4.12: Actividades
   - 4.13 a 4.18: Canvas Templates
5. [Planificación](#5-planificación)
6. [Alertas](#6-alertas)
7. [Notificaciones](#7-notificaciones)
8. [Dashboard](#8-dashboard)
9. [Integraciones Externas](#9-integraciones-externas)
10. [WebSocket](#10-websocket)

---

## 1. Autenticación

**Base Path**: `/api/v1/auth`

### 1.1 Login — Iniciar Sesión

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**Request**:
```json
{
  "username": "admin@sigat.com",
  "password": "Admin123!",
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "deviceInfo": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

**Response 200**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "username": "admin@sigat.com",
    "email": "admin@sigat.com",
    "tenantId": "11111111-1111-1111-1111-111111111111",
    "roles": ["admin"]
  },
  "sessionId": "session-uuid"
}
```

**Response 401** (credenciales inválidas):
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

**Response 503** (servicio no disponible):
```json
{
  "statusCode": 503,
  "message": "Servicio de autenticación no disponible",
  "error": "Service Unavailable"
}
```

---

### 1.2 Refresh Token — Renovar Access Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.3 Logout — Cerrar Sesión

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response 204**: Sin contenido (éxito)

---

### 1.4 Get Me — Obtener Usuario Actual

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "id": "user-uuid",
  "username": "admin@sigat.com",
  "email": "admin@sigat.com",
  "tenantId": "11111111-1111-1111-1111-111111111111",
  "roles": ["admin"]
}
```

---

### 1.5 Listar Sesiones Activas

```http
GET /api/v1/auth/sessions
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "jti": "jwt-uuid",
    "userId": "user-uuid",
    "tenantId": "tenant-uuid",
    "lastAccess": "2026-04-14T12:00:00.000Z",
    "deviceInfo": "Mozilla/5.0..."
  }
]
```

---

### 1.6 Revocar Sesión

```http
DELETE /api/v1/auth/sessions/:jti
Authorization: Bearer <access_token>
```

**Response 204**: Sin contenido (éxito)

---

## 2. Usuarios

**Base Path**: `/api/v1/users`

### 2.1 Crear Usuario

```http
POST /api/v1/users
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "email": "usuario@sigat.com",
  "password_hash": "hashed_password",
  "role_id": "role-uuid"
}
```

**Response 201**:
```json
{
  "id": "user-uuid",
  "email": "usuario@sigat.com",
  "tenantId": "tenant-uuid",
  "roleId": "role-uuid",
  "isActive": true,
  "createdAt": "2026-04-14T12:00:00.000Z"
}
```

---

### 2.2 Listar Usuarios

```http
GET /api/v1/users?role=aprobador
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "user-uuid",
    "email": "admin@sigat.com",
    "tenantId": "tenant-uuid",
    "isActive": true
  }
]
```

---

### 2.3 Actualizar Usuario

```http
PATCH /api/v1/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "is_active": false,
  "role_id": "new-role-uuid"
}
```

**Response 200**: Usuario actualizado

---

### 2.4 Crear Unidad Organizacional

```http
POST /api/v1/organizational-units
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "name": "Dirección de Salud Pública",
  "parent_id": "parent-uuid"
}
```

**Response 201**: Unidad creada

---

### 2.5 Listar Unidades Organizacionales

```http
GET /api/v1/organizational-units
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "ou-uuid",
    "name": "Secretaría de Salud",
    "parentId": null,
    "children": [
      {
        "id": "ou-uuid-2",
        "name": "Dirección de Salud Pública",
        "parentId": "ou-uuid"
      }
    ]
  }
]
```

---

## 3. Maestros/Catálogos

**Base Path**: `/api/tenants/masters`

### 3.1 Listar Maestros por Tipo

```http
GET /api/tenants/masters?type=CONDICION
Authorization: Bearer <access_token>
```

**Valores de type**: `CONDICION`, `INTERVENCION`, `PRESTACION`, `TIPO_ACTIVIDAD`, `POBLACION`, `DEPENDENCIA`

**Response 200**:
```json
[
  {
    "id": "master-uuid",
    "type": "CONDICION",
    "code": "01",
    "name": "ASIGNADA",
    "parentId": null,
    "isActive": true
  },
  {
    "id": "master-uuid-2",
    "type": "CONDICION",
    "code": "02",
    "name": "EN EJECUCIÓN",
    "parentId": null,
    "isActive": true
  }
]
```

---

### 3.2 Obtener Árbol de Maestros

```http
GET /api/tenants/masters/tree?type=DEPENDENCIA
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "master-uuid",
    "name": "SECRETARÍA DE SALUD",
    "code": "SEC-SALUD",
    "children": [
      {
        "id": "master-uuid-2",
        "name": "SUBSECRETARÍA SALUD PÚBLICA",
        "children": []
      }
    ]
  }
]
```

---

### 3.3 Crear Maestro

```http
POST /api/tenants/masters
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "type": "CONDICION",
  "code": "05",
  "name": "CANCELADA",
  "parent_id": "parent-uuid"
}
```

**Response 201**: Maestro creado

---

### 3.4 Obtener Maestro por ID

```http
GET /api/tenants/masters/:id
Authorization: Bearer <access_token>
```

**Response 200**: Maestro individual

---

## 4. Actividades

**Base Path**: `/api/v1/workspaces/activities`

### 4.1 Crear Actividad Básica

```http
POST /api/v1/workspaces/activities
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "masterId": "master-uuid",
  "projectId": "project-uuid",
  "statusId": "status-uuid",
  "activityFramework": "Plan anual",
  "dateInitial": "2026-04-14T00:00:00.000Z",
  "dateFinal": "2026-04-30T00:00:00.000Z",
  "schema": {},
  "actionProjectId": "action-uuid"
}
```

**Response 201**: Actividad creada

---

### 4.2 Crear Actividad con Canvas (Completo)

```http
POST /api/v1/workspaces/activities/canvas
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "masterId": "master-uuid",
  "projectId": "project-uuid",
  "statusId": "status-uuid",
  "activityFramework": "Plan anual",
  "dateInitial": "2026-04-14T00:00:00.000Z",
  "dateFinal": "2026-04-30T00:00:00.000Z",
  "aprobadorUserId": "user-uuid",
  "dependenciaId": "master-uuid",
  "codigo": "ACT-2026-001",
  "tipoIntervencionId": "master-uuid",
  "tipoPrestacionId": "master-uuid",
  "condicionActualId": "master-uuid",
  "tipoActividadId": "master-uuid",
  "poblacionObjetoId": "master-uuid",
  "descripcion": "Descripción de la actividad...",
  "acompanantes": [
    { "responsableId": "user-uuid" }
  ],
  "subregiones": [
    {
      "subregionId": "master-uuid",
      "municipioId": "master-uuid",
      "entidadId": "master-uuid"
    }
  ]
}
```

**Response 201**:
```json
{
  "id": "activity-uuid",
  "tenantId": "tenant-uuid",
  "userId": "user-uuid",
  "activityFramework": "Plan anual",
  "dateInitial": "2026-04-14T00:00:00.000Z",
  "dateFinal": "2026-04-30T00:00:00.000Z",
  "schema": {
    "aprobadorUserId": "user-uuid",
    "dependenciaId": "master-uuid",
    "codigo": "ACT-2026-001",
    "descripcion": "Descripción...",
    "acompanantes": [...],
    "subregiones": [...]
  }
}
```

---

### 4.3 Obtener Canvas de Actividad

```http
GET /api/v1/workspaces/activities/:id/canvas
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "id": "activity-uuid",
  "canvas": {
    "aprobadorUserId": "user-uuid",
    "dependenciaId": "master-uuid",
    "codigo": "ACT-2026-001",
    "descripcion": "Descripción...",
    "acompanantes": [...],
    "subregiones": [...]
  }
}
```

---

### 4.4 Actualizar Canvas

```http
PATCH /api/v1/workspaces/activities/:id/canvas
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request** (campos parciales):
```json
{
  "descripcion": "Nueva descripción",
  "condicionActualId": "new-master-uuid"
}
```

**Response 200**: Canvas actualizado

---

### 4.5 Completar Canvas con IA

```http
POST /api/v1/workspaces/activities/:id/canvas/complete
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "user_input": "Completa el análisis de la actividad"
}
```

**Response 200**: Resultado del procesamiento IA

---

### 4.6 Listar Adjuntos

```http
GET /api/v1/workspaces/activities/:id/attachments
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "attachment-uuid",
    "fileName": "documento.pdf",
    "fileType": "survey_pdf",
    "status": "pending",
    "createdAt": "2026-04-14T12:00:00.000Z"
  }
]
```

---

### 4.7 Agregar Adjunto

```http
POST /api/v1/workspaces/activities/:id/attachments
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "fileUrl": "https://storage.example.com/file.pdf",
  "attachmentType": "survey_pdf"
}
```

**Response 201**: Adjunto creado

---

### 4.8 Listar Revisiones

```http
GET /api/v1/workspaces/activities/:id/reviews
Authorization: Bearer <access_token>
```

**Response 200**: Historial de revisiones

---

### 4.9 Enviar Revisión

```http
POST /api/v1/workspaces/activities/:id/reviews
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "newStatusId": "status-uuid",
  "comments": "Actividad aprobada"
}
```

**Response 201**: Revisión creada

---

### 4.10 Obtener Actividad

```http
GET /api/v1/workspaces/activities/:id
Authorization: Bearer <access_token>
```

**Response 200**: Actividad completa

---

### 4.11 Actualizar Actividad

```http
PATCH /api/v1/workspaces/activities/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "statusId": "new-status-uuid",
  "dateFinal": "2026-04-15T00:00:00.000Z"
}
```

**Response 200**: Actividad actualizada

---

### 4.12 Agregar Compromiso

```http
POST /api/v1/workspaces/activities/:id/commitments
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "tipo": "entregable",
  "fecha_limite": "2026-04-20",
  "descripcion": "Entregar informe"
}
```

**Response 201**: Compromiso creado

---

### 4.13 Listar Canvas Templates

```http
GET /api/v1/workspace/canvas-templates?activity_type=TIPO_ACTIVIDAD&framework=Plan+anual
Authorization: Bearer <access_token>
```

**Parámetros Query**:
- `activity_type` (opcional): tipo de actividad
- `framework` (opcional): framework del plan

**Response 200**:
```json
[
  {
    "id": "template-uuid",
    "name": "Template Salud Pública",
    "activityType": "TIPO_ACTIVIDAD",
    "activityFramework": "Plan anual",
    "version": 1,
    "isActive": true,
    "schema": {
      "fields": [
        { "key": "descripcion", "type": "textarea", "required": true },
        { "key": "dependenciaId", "type": "master", "required": true }
      ]
    },
    "createdAt": "2026-04-14T12:00:00.000Z",
    "updatedAt": "2026-04-14T12:00:00.000Z"
  }
]
```

---

### 4.14 Obtener Canvas Template Activo

```http
GET /api/v1/workspace/canvas-templates/active?activity_type=TIPO_ACTIVIDAD&framework=Plan+anual
Authorization: Bearer <access_token>
```

**Parámetros Query** (obligatorios):
- `activity_type`: tipo de actividad
- `framework`: framework del plan

**Response 200**:
```json
{
  "id": "template-uuid",
  "name": "Template Salud Pública",
  "activityType": "TIPO_ACTIVIDAD",
  "isActive": true,
  "schema": { ... }
}
```

**Response 200** (no configurado):
```json
{
  "template": null,
  "message": "No template configured for this activity type"
}
```

---

### 4.15 Obtener Canvas Template por ID

```http
GET /api/v1/workspace/canvas-templates/:id
Authorization: Bearer <access_token>
```

**Response 200**: Template completo

---

### 4.16 Crear Canvas Template

```http
POST /api/v1/workspace/canvas-templates
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "name": "Template Salud Pública",
  "activityType": "TIPO_ACTIVIDAD",
  "activityFramework": "Plan anual",
  "schema": {
    "fields": [
      { "key": "descripcion", "type": "textarea", "required": true },
      { "key": "dependenciaId", "type": "master", "required": true }
    ]
  }
}
```

**Response 201**: Template creado

---

### 4.17 Actualizar Canvas Template

```http
PATCH /api/v1/workspace/canvas-templates/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "name": "Template Salud Pública v2",
  "schema": { ... }
}
```

> **Nota**: Cada actualización incrementa la versión automáticamente.

**Response 200**: Template actualizado

---

### 4.18 Eliminar Canvas Template

```http
DELETE /api/v1/workspace/canvas-templates/:id
Authorization: Bearer <access_token>
```

> **Nota**: Desactivación lógica (soft delete). El template no se elimina, se marca inactivo.

**Response 204**: Sin contenido

---

## 5. Planificación

**Base Path**: `/api/v1/workspace/planning`

> **Nota**: Este módulo está dentro del servicio workspace. El frontend llama via gateway: `/api/v1/workspace/planning/*`

### 5.1 Crear Nivel de Planificación

```http
POST /api/v1/workspace/planning/levels
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "name": "Programa de Infraestructura 2026",
  "levelType": "programa",
  "parentId": "parent-uuid",
  "order": 1,
  "description": "Descripción del nivel",
  "metadata": {}
}
```

**Response 201**: Nivel creado

---

### 5.2 Obtener Árbol de Planificación

```http
GET /api/v1/workspace/planning/levels/tree
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "level-uuid",
    "name": "Programa de Infraestructura 2026",
    "levelType": "programa",
    "children": [
      {
        "id": "level-uuid-2",
        "name": "Macroproyecto Salud",
        "levelType": "macroproyecto"
      }
    ]
  }
]
```

---

### 5.3 Programar Meta Mensual

```http
POST /api/v1/workspace/planning/levels/:id/schedule
Authorization: Bearer <access_token>
```

**Request**:
```json
{
  "year": 2026,
  "month": 4,
  "target": 100,
  "unitOfMeasure": "porcentaje"
}
```

**Response 201**: Programación creada

---

### 5.4 Obtener Progreso

```http
GET /api/v1/workspace/planning/levels/:id/progress/:year
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "progress": 75.5,
  "target": 100,
  "executed": 75.5,
  "months": [
    { "month": 1, "target": 8.33, "executed": 10 },
    { "month": 2, "target": 8.33, "executed": 15 }
  ]
}
```

**Request**:
```json
{
  "name": "Programa de Infraestructura 2026",
  "levelType": "programa",
  "parentId": "parent-uuid",
  "order": 1,
  "description": "Descripción del nivel",
  "metadata": {}
}
```

**Response 201**: Nivel creado

---

### 5.2 Obtener Árbol de Planificación

```http
GET /workspace/planning/levels/tree
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "level-uuid",
    "name": "Programa de Infraestructura 2026",
    "levelType": "programa",
    "children": [
      {
        "id": "level-uuid-2",
        "name": "Macroproyecto Salud",
        "levelType": "macroproyecto"
      }
    ]
  }
]
```

---

### 5.3 Programar Meta Mensual

```http
POST /workspace/planning/levels/:id/schedule
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "year": 2026,
  "month": 4,
  "target": 100,
  "unitOfMeasure": "porcentaje"
}
```

**Response 201**: Programación creada

---

### 5.4 Obtener Progreso

```http
GET /workspace/planning/levels/:id/progress/:year
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "progress": 75.5,
  "target": 100,
  "executed": 75.5,
  "months": [
    { "month": 1, "target": 8.33, "executed": 10 },
    { "month": 2, "target": 8.33, "executed": 15 }
  ]
}
```

---

## 6. Alertas

**Base Path**: `/api/v1/workspace/alerts`

> **Nota**: Este módulo está dentro del servicio workspace. El frontend llama via gateway: `/api/v1/workspace/alerts/*`

### 6.1 Listar Alertas Pendientes

```http
GET /api/v1/workspace/alerts/pending
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "alert-uuid",
    "title": "Actividad próxima a vencer",
    "priority": "HIGH",
    "status": "PENDING",
    "metadata": {
      "activityId": "activity-uuid",
      "dueDate": "2026-04-15"
    },
    "createdAt": "2026-04-14T12:00:00.000Z"
  }
]
```

---

### 6.2 Descartar Alerta

```http
PATCH /api/v1/workspace/alerts/:id/dismiss
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{ "message": "Alerta descartada" }
```

---

### 6.3 Ejecutar Monitoreo Manual

```http
POST /api/v1/workspace/alerts/check-deadlines
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{ "message": "Proceso de monitoreo ejecutado con exito" }
```

---

## 7. Notificaciones

**Base Path**: `/api/v1/notifications/dashboard`

### 7.1 Listar Notificaciones

```http
GET /api/v1/notifications/dashboard/notifications?limit=20&offset=0
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "id": "notif-uuid",
    "type": "activity_created",
    "title": "Nueva actividad creada",
    "message": "La actividad \"Plan anual\" ha sido creada.",
    "priority": "MEDIUM",
    "status": "PENDING",
    "metadata": {
      "activityId": "activity-uuid",
      "link": "/activities/activity-uuid"
    },
    "createdAt": "2026-04-14T12:00:00.000Z"
  }
]
```

---

### 7.2 Badge Count

```http
GET /api/v1/notifications/dashboard/notifications/unread-count
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{ "count": 8 }
```

---

### 7.3 Marcar como Leída

```http
PATCH /api/v1/notifications/dashboard/notifications/:id/read
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{ "success": true }
```

---

### 7.4 Obtener Preferencias

```http
GET /api/v1/notifications/preferences
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "userId": "user-uuid",
  "tenantId": "tenant-uuid",
  "channels": {
    "websocket": true,
    "email": true,
    "in_app": true
  },
  "quietHoursStart": null,
  "quietHoursEnd": null
}
```

---

### 7.5 Actualizar Preferencias

```http
PATCH /api/v1/notifications/preferences
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request**:
```json
{
  "channels": {
    "email": false
  },
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00"
}
```

**Response 200**: Preferencias actualizadas

---

## 8. Dashboard

**Base Path**: `/api/v1/notifications/dashboard`

### 8.1 Resumen del Dashboard

```http
GET /api/v1/notifications/dashboard/summary
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "pending": 10,
  "critical": 3,
  "dueToday": 5,
  "overdue": 2,
  "unreadNotifications": 8
}
```

---

### 8.2 Semáforo de Estados

```http
GET /api/v1/notifications/dashboard/traffic-light
Authorization: Bearer <access_token>
```

**Response 200**:
```json
{
  "summary": {
    "total": 45,
    "green": 30,
    "yellow": 10,
    "orange": 3,
    "red": 2
  },
  "byEntity": {
    "activities": {
      "total": 20,
      "green": 15,
      "yellow": 3,
      "orange": 1,
      "red": 1
    },
    "commitments": {
      "total": 15,
      "green": 10,
      "yellow": 3,
      "orange": 1,
      "red": 1
    },
    "alerts": {
      "total": 10,
      "green": 5,
      "yellow": 4,
      "orange": 1,
      "red": 0
    }
  },
  "updatedAt": "2026-04-14T12:00:00.000Z"
}
```

---

## 9. Integraciones Externas

**Base Path**: `/api/v1/integrations`

> **Nota**: Integración con sistemas externos (Sinergia-DNP)

### 9.1 Sincronizar con Sinergia-DNP

```http
POST /api/v1/integrations/sync/sinergia/:territorioId
Authorization: Bearer <access_token>
```

**Response 200**:
```json
[
  {
    "external_id": "sinergia-123",
    "name": "Meta de Salud Pública",
    "target_value": 100,
    "actual_value": 75,
    "source_system": "SINERGIA-DNP",
    "last_sync": "2026-04-14T12:00:00.000Z"
  }
]
```

---

## 10. WebSocket

**URL**: `ws://localhost:3081`

### 10.1 Conexión

```javascript
const socket = io('ws://localhost:3081', {
  query: { token: 'eyJhbGciOiJIUzI1NiIs...' }
});
```

> **Requisito**: JWT válido en query param `token`

---

### 10.2 Eventos Entrantes

#### notification:new
```javascript
socket.on('notification:new', (data) => {
  // {
  //   title: "Nueva actividad creada",
  //   message: "La actividad \"Plan anual\" ha sido creada.",
  //   priority: "MEDIUM",
  //   link: "/activities/activity-uuid"
  // }
});
```

#### traffic-light:update
```javascript
socket.on('traffic-light:update', (data) => {
  // {
  //   summary: { total: 45, green: 30, yellow: 10, red: 5 },
  //   byEntity: { activities: {...}, commitments: {...}, alerts: {...} }
  // }
});
```

#### badge:count
```javascript
socket.on('badge:count', (data) => {
  // { count: 8 }
});
```

---

### 10.3 Ping/Pong

```javascript
socket.emit('ping'); // → 'pong'
```

---

## Códigos de Error Estándar

| Código | Significado |
|--------|-----------|
| 400 | Bad Request — Parámetros inválidos |
| 401 | Unauthorized — JWT requerido o inválido |
| 403 | Forbidden — Sin permisos |
| 404 | Not Found — Recurso no encontrado |
| 429 | Too Many Requests — Rate limit excedido |
| 503 | Service Unavailable — Servicio no disponible |

---

## Enums de Referencia

### ActivityFramework
- `Plan anual`
- `Plan de desarrollo`

### AlertPriority
- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

### AlertStatus
- `PENDING`
- `SENT`
- `DISMISSED`

### NotificationPriority
- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

### NotificationStatus
- `PENDING`
- `SENT`
- `READ`
- `FAILED`

### PlanningLevelType
- `programa`
- `macroproyecto`
- `proyecto`
- `componente`
- `actividad`
- `tarea`
- `entregable`

### AttachmentType
- `survey_pdf`
- `attendance_pdf`
- `evidence`

---

**Documento generado**: 2026-04-14
**Última actualización**: 2026-04-14
**Mantenimiento**: Actualizar con cada nuevo endpoint o cambio en contratos
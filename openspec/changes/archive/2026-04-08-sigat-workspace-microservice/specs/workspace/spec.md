# Spec: Workspace Activities (SIGAT)

## Requirements

### R1 — Crear actividad

**Dado** un JWT con `custom:tenant_id` y `sub`  
**Cuando** `POST /api/v1/workspaces/activities` con body válido según `CreateWorkspaceActivityDto`  
**Entonces** se persiste `workspace_activities` con `tenant_id` y `user_id` del token, no del body.

### R2 — Plan anual exige action_project_id

**Dado** `activity_framework` = `Plan anual`  
**Cuando** falta `action_project_id`  
**Entonces** la API responde 400 (validación).

### R3 — Obtener y actualizar

**Dado** una actividad del mismo tenant  
**Cuando** `GET /api/v1/workspaces/activities/:id` o `PATCH` con `UpdateWorkspaceActivityDto`  
**Entonces** se devuelve o actualiza el registro; otro tenant recibe 404.

### R4 — Adjuntos

**Dado** actividad existente del tenant  
**Cuando** `POST .../attachments` con `AddAttachmentDto`  
**Entonces** se crea fila en `workspace_activity_attachments`; si tipo es `survey_pdf` o `attendance_pdf`, `processing_status` = `pending` (job async pendiente de implementar).

### R5 — Reviews

**Dado** actividad existente  
**Cuando** `POST .../reviews` con `new_status_id` y `comments`  
**Entonces** se registra `previous_status_id` actual, se guarda la bitácora y se actualiza `status_id` de la actividad.

### R6 — Historial

**Cuando** `GET .../reviews`  
**Entonces** lista ordenada por `created_at` ascendente o descendente (documentar en código; default DESC).

## Non-functional

- Sin credenciales en repo; configuración vía env (`DB_*`, `PORT`).

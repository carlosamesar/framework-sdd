
# Arquitectura

El proceso de agendamiento se implementa como una función Lambda ubicada en `develop/backend/gooderp-orchestation/lib/lambda/agendamiento/fnAgendamiento`. Esta Lambda es responsable de recibir solicitudes de agendamiento, validar los datos de entrada, aplicar reglas de negocio estrictas y registrar la operación en el sistema de auditoría.

Flujo general:
- Recepción de la solicitud de agendamiento vía API Gateway.
- Validación de datos obligatorios (fecha, hora, recurso, usuario, motivo).
- Evaluación de reglas de negocio (no solapamiento, horarios válidos, recursos disponibles).
- Registro de la operación en el sistema de auditoría y respuesta estructurada.



# Contratos

**Endpoint:** `/agendamiento/crear`

**Método:** POST

**Body esperado:**
```json
{
	"fecha": "YYYY-MM-DD",
	"hora": "HH:mm",
	"recursoId": "string",
	"usuarioId": "string",
	"motivo": "string"
}
```

**Respuesta:**
```json
{
	"ok": true,
	"agendamientoId": "string",
	"mensaje": "Agendamiento registrado exitosamente"
}
```

**Errores:**
- 400: Datos inválidos o incompletos
- 409: Solapamiento de horario o recurso no disponible



# Criterios QA

- No se permite crear agendamientos con campos obligatorios vacíos.
- No se permite solapamiento de horarios para el mismo recurso.
- El sistema debe rechazar horarios fuera del rango permitido (08:00-18:00).
- El registro debe aparecer en el sistema de auditoría con todos los datos relevantes.
- El registro del agendamiento debe permitir editarse si el usuario lo requiere.
- Se debe tener una visual de todas las citas programadas con sus diferentes estados (confirmada, pendiente, cancelada).
- Pruebas unitarias y E2E deben cubrir:
	- Caso exitoso
	- Datos inválidos
	- Solapamiento
	- Recurso no disponible
	- Auditoría

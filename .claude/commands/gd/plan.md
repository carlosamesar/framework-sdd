# /gd:plan — Generar Blueprint Técnico

## Propósito
Crear un blueprint técnico completo con arquitectura, contratos API, esquema de BD y decisiones de diseño, basado en la especificación clarificada. Produce un documento ejecutable que guía toda la implementación.

## Alias
- `/gd:tech-plan`
- `/gd:diseñar`
- `/gd:planificar-tecnico`

---

## Prerrequisitos
- Spec en estado `CLARIFIED` o `APPROVED` (output de `/gd:clarify` sin BLOCKERs)
- Change activo en `openspec/changes/[slug]/`

---

## Cómo Funciona

1. **Leer spec clarificada** y extraer requerimientos técnicos
2. **Identificar el stack** (Lambda, NestJS, o ambos) y los patrones maduros de referencia
3. **Diseñar contratos API** con request/response schemas completos
4. **Diseñar el esquema de BD** en DBML con multi-tenant explícito
5. **Identificar riesgos** y decisiones de arquitectura (ADRs si Nivel ≥ 2)
6. **Integrar razonamiento** para decisiones irreversibles (ver abajo)

---

## Plantilla de Output Obligatoria

```markdown
# PLAN TÉCNICO: [Nombre del cambio]

## Metadata
- **Change**: [slug]
- **Stack**: Lambda | NestJS | Fullstack
- **Nivel**: [0-4]
- **Referencia**: [patrón maduro de referencia]

## Arquitectura

### Componentes Involucrados
```
[Diagrama ASCII de componentes y flujo de datos]

API Gateway → Lambda fnXxx → DynamoDB / RDS
                ↓
            EventBridge → Lambda fnYyy (async)
```

### Patrón de Referencia
- **Lambda**: `lib/lambda/transacciones/fnTransaccionLineas/` — estructura y manejo de errores
- **NestJS**: `servicio-tesoreria/src/` — módulos, DTOs, guards
- **Multi-tenant**: Siempre desde JWT — `const tenantId = event.requestContext.authorizer.claims['custom:tenant_id']`

## Contratos API

### [MÉTODO] /api/[recurso]

**Request**
```json
{
  "campo1": "string — descripción y validaciones",
  "campo2": "number — rango válido"
}
```

**Response 200**
```json
{
  "id": "uuid",
  "campo1": "string",
  "createdAt": "ISO8601"
}
```

**Errores**
| Status | Código | Mensaje | Cuándo |
|--------|--------|---------|--------|
| 400 | VALIDATION_ERROR | [mensaje] | Input inválido |
| 401 | UNAUTHORIZED | Token inválido o expirado | Sin JWT o JWT inválido |
| 403 | FORBIDDEN | Sin permisos para este recurso | Rol insuficiente |
| 404 | NOT_FOUND | [recurso] no encontrado | ID no existe en el tenant |
| 500 | INTERNAL_ERROR | Error interno | Fallo no controlado |

## Esquema de Base de Datos

```dbml
Table [nombre_tabla] {
  id          uuid       [pk, default: `uuid_generate_v4()`]
  tenant_id   uuid       [not null, ref: > tenants.id, note: 'NUNCA de body — siempre de JWT']
  [campo]     [tipo]     [not null | null, note: 'descripción']
  created_at  timestamp  [not null, default: `now()`]
  updated_at  timestamp  [not null, default: `now()`]

  indexes {
    (tenant_id, [campo_busqueda]) [name: 'idx_[tabla]_tenant_[campo]']
  }
}
```

**Migraciones requeridas**: [lista de ALTER TABLE o CREATE TABLE]

## Decisiones de Arquitectura

### ADR-001: [Decisión tomada]
- **Contexto**: [por qué es necesario decidir]
- **Opciones**: A) [opción A] | B) [opción B]
- **Decisión**: [opción elegida]
- **Consecuencias**: [trade-offs aceptados]

## Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| [riesgo 1] | Alta/Media/Baja | Alto/Medio/Bajo | [cómo mitigar] |

## Checklist de Plan

- [ ] Todos los endpoints del spec tienen contrato completo (request + response + errores)
- [ ] tenant_id extraído de JWT en todos los endpoints/lambdas
- [ ] Esquema DBML completo con índices para queries principales
- [ ] Decisiones irreversibles documentadas como ADR
- [ ] Stack identificado y patrón de referencia seleccionado
```

---

## Uso

```
/gd:plan
/gd:plan [slug]   # para un change específico
```

---

## Integración con Razonamiento

Antes de tomar decisiones arquitectónicas irreversibles (cambios de esquema, elección de patrón):

```
/gd:razonar --modelo=reversibilidad [opciones arquitectónicas a evaluar]
```

Para proyectos Nivel 3-4, análisis de efectos de segundo orden:

```
/gd:razonar --modelo=segundo-orden [descripción del plan]
```

Para pre-mortem antes de una migración de datos:

```
/gd:razonar --modelo=pre-mortem [descripción de la migración]
```

---

## Reglas Críticas

1. **Multi-tenant obligatorio**: Todo endpoint que toque datos de negocio debe extraer `tenant_id` del JWT — nunca del body, nunca de params
2. **Contratos primero**: Los contratos API son el contrato con el frontend — no se cambian sin coordinar
3. **Índices explícitos**: Todo DBML debe incluir los índices necesarios para las queries del spec
4. **Referencia a patrón maduro**: Siempre identificar el archivo de referencia en el repo

---

## Salida Estructurada (agentes ReAct)

Emitir JSON al final según `openspec/templates/react-outputs/plan.output.schema.json` (contratos API, riesgos, regla de tenant).

---

## Siguiente Paso
Después del plan técnico, usar `/gd:breakdown` para dividir en tareas implementables.

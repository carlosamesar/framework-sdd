# /gd:recall — Consultar Memoria de Sesiones Anteriores

## Propósito
Consultar la memoria persistente de Engram para recuperar qué se hizo, por qué se tomaron ciertas decisiones y en qué archivos se trabajó en sesiones anteriores. Es la interface de búsqueda sobre el historial de conocimiento del proyecto.

---

## Cómo Funciona

1. **Buscar en Engram** con `mem_search` o `mem_context`
2. **Recuperar observaciones** relevantes al query
3. **Mostrar en orden** de relevancia con fecha, tipo y contenido
4. **Expandir** si se necesita más detalle con `mem_get_observation`

---

## Casos de Uso Principales

### "¿Qué hicimos la semana pasada?"
```
/gd:recall sesión anterior
```
→ Ejecuta `mem_context` para las últimas sesiones

### "¿Por qué elegimos DynamoDB?"
```
/gd:recall decisión DynamoDB
```
→ Ejecuta `mem_search "DynamoDB decision"`

### "¿Dónde está el código de autenticación JWT?"
```
/gd:recall jwt autenticación cognito
```
→ Ejecuta `mem_search "jwt cognito auth"` y muestra archivos afectados

### "¿Cómo resolvimos el bug de transacciones duplicadas?"
```
/gd:recall bug transacciones duplicadas
```
→ Ejecuta `mem_search "transacciones duplicadas bugfix"` con tipo `bugfix`

---

## Uso

```
/gd:recall [consulta en lenguaje natural]
/gd:recall --recent                    # últimas N observaciones de la sesión
/gd:recall --type=decision             # solo decisiones arquitectónicas
/gd:recall --type=bugfix               # solo bug fixes
/gd:recall --type=pattern              # solo patrones establecidos
/gd:recall --type=config               # solo configuraciones
/gd:recall --session=[id]              # todo lo de una sesión específica
/gd:recall --file=[ruta]               # todo lo relacionado a un archivo
```

---

## Tipos de Observaciones en Engram

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `decision` | Decisión arquitectónica o técnica | "Usar DynamoDB sobre RDS" |
| `bugfix` | Bug resuelto con causa raíz | "Fix N+1 en UserList" |
| `architecture` | Cambio estructural en el sistema | "Migración a JWT" |
| `pattern` | Patrón o convención establecida | "Deploy: S3 sync + CloudFront invalidation" |
| `config` | Configuración de entorno o herramientas | "Cognito User Pool IDs" |
| `discovery` | Hallazgo no obvio sobre el codebase | "TypeORM schema no-default requiere clase explícita en save()" |
| `session_summary` | Resumen de sesión completa | Todo lo de una sesión de trabajo |

---

## Output del Comando

```markdown
## Recall: "[query]"

**Encontradas**: N observaciones relevantes

---

### [1] [tipo] — [título]
**Fecha**: 2026-04-09 | **Proyecto**: framework-sdd
**Relevancia**: Alta

**What**: [descripción de lo que se hizo]
**Why**: [por qué se hizo]
**Where**: [archivos afectados]
**Learned**: [gotchas o aprendizajes]

---

### [2] [session_summary] — Session summary: framework-sdd
**Fecha**: 2026-04-07 | **Proyecto**: framework-sdd

**Goal**: [qué se trabajó en esa sesión]
**Accomplished**: [lista de completados]
**Relevant Files**: [archivos clave]

---

*Para ver el contenido completo de una observación: `/gd:recall --id=[N]`*
```

---

## Búsqueda Avanzada

```
# Combinar términos
/gd:recall tenant_id jwt cognito

# Buscar por archivo
/gd:recall --file=src/modules/caja/

# Buscar por fecha
/gd:recall --from=2026-04-01 --to=2026-04-14 transacciones

# Expandir una observación específica
/gd:recall --id=247
```

---

## Integración con el Workflow

`/gd:recall` debe ejecutarse **proactivamente** al inicio de cualquier tarea para:
1. Verificar si ya se trabajó en algo similar antes
2. Recuperar decisiones de arquitectura que aplican
3. Encontrar patrones que deben reutilizarse
4. Evitar repetir errores pasados

---

## Siguiente Paso
Usar el conocimiento recuperado para informar la tarea actual.
Para guardar nueva información: el agente lo hace automáticamente con `mem_save` después de cada trabajo significativo.

# /gd:audit-trail — Registro de Auditoría de Decisiones y Cambios

## Propósito
Mantener y consultar un registro de auditoría completo de decisiones técnicas, cambios de arquitectura, quality gates ejecutados y aprobaciones. Responde la pregunta: "¿Quién decidió qué, cuándo y por qué?"

---

## Cómo Funciona

1. **Registrar automáticamente** cada evento significativo del pipeline SDD
2. **Indexar en Engram** para búsqueda y recuperación rápida
3. **Escribir en `openspec/audit-trail.md`** como registro persistente en disco
4. **Consultar el historial** con filtros por change, fecha o tipo de evento

---

## Eventos Auditados Automáticamente

| Evento | Cuándo se registra | Datos capturados |
|--------|-------------------|-----------------|
| `spec:created` | Al crear la spec | Autor, change, fecha, nivel |
| `spec:approved` | Al pasar `/gd:clarify` | Issues encontrados, resueltos |
| `plan:created` | Al generar el blueprint | Stack, decisiones ADR |
| `gate:executed` | Al ejecutar cualquier `/gd:gate` | Gate, veredicto, issues |
| `implement:started` | Al iniciar tarea | Tarea ID, archivos afectados |
| `implement:completed` | Al completar tarea | Tests pasando, coverage |
| `review:completed` | Al finalizar `/gd:review` | Scores 7D, veredicto |
| `verify:completed` | Al finalizar `/gd:verify` | Cobertura spec, veredicto |
| `archive:completed` | Al archivar el change | ID registro, archivos archivados |
| `decision:recorded` | Al registrar un ADR | Contexto, opciones, decisión |

---

## Formato de Registro de Evento

```markdown
## [AUDIT-YYYY-MM-DD-NNN] [tipo-evento]

**Fecha**: YYYY-MM-DD HH:mm UTC
**Change**: [slug] (C-[NNN])
**Fase**: specify | plan | implement | review | verify | archive
**Actor**: agente | usuario:[nombre]

### Evento: [tipo-evento]
**Descripción**: [qué ocurrió en una oración]
**Datos**: campo: valor
**Resultado**: PASS | FAIL | REGISTERED | SKIPPED
```

---

## Uso

```
/gd:audit-trail                          # mostrar audit trail del change activo
/gd:audit-trail [slug]                   # audit trail de un change específico
/gd:audit-trail --all                    # todos los eventos de todos los changes
/gd:audit-trail --type=gate             # solo eventos de gates
/gd:audit-trail --type=decision         # solo ADRs y decisiones
/gd:audit-trail --from=2026-04-01       # desde una fecha
/gd:audit-trail --search="tenant_id"    # búsqueda por texto
/gd:audit-trail record                  # registrar un evento manual
```

---

## Registro Manual de Decisión (ADR)

```
/gd:audit-trail record

# El agente solicitará:
Tipo de evento: decision
Descripción: Decidimos usar DynamoDB en lugar de RDS para la tabla de eventos
Contexto: El volumen esperado es > 1M registros/día y no necesitamos JOINs
Opciones consideradas: RDS PostgreSQL | DynamoDB | MongoDB Atlas
Decisión: DynamoDB — sin JOIN requirements, costo predecible, TTL nativo
Consecuencias: Sin queries relacionales, migración costosa si requisitos cambian
```

---

## Consulta del Audit Trail

```markdown
## Audit Trail — [nombre del change]

### Timeline

| # | Fecha | Evento | Resultado | Actor |
|---|-------|--------|-----------|-------|
| 1 | 2026-04-10 09:00 | spec:created | REGISTERED | agente |
| 2 | 2026-04-10 10:30 | gate:spec | PASS | agente |
| 3 | 2026-04-10 14:00 | decision:recorded | ADR-001: Elegir DynamoDB | usuario:carlos |
| 4 | 2026-04-11 09:45 | implement:completed T01 | PASS (coverage 91%) | agente |
| 5 | 2026-04-12 10:00 | gate:security | FAIL → tenant_id en body | agente |
| 6 | 2026-04-12 11:00 | gate:security | PASS (re-ejecución) | agente |
| 7 | 2026-04-12 12:00 | review:completed | PASS (score: 94/100) | agente |
| 8 | 2026-04-12 15:00 | archive:completed | C-043 registrado | agente |
```

---

## Persistencia

| Destino | Propósito |
|---------|----------|
| `openspec/audit-trail.md` | Registro global en Markdown (legible por humanos) |
| Engram `mem_save` | Observaciones individuales buscables entre sesiones |

---

## Siguiente Paso
Para consultar decisiones históricas: `/gd:recall [término de búsqueda]`
Para ver el estado actual del change: `/gd:status`
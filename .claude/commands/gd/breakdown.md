# /gd:breakdown — Dividir Plan en Tareas Concretas

## Propósito
Dividir el blueprint técnico en tareas implementables con orden de ejecución, dependencias y criterios de done claros. Cada tarea debe poder ser implementada por un agente autónomamente sin contexto adicional.

## Alias
- `/gd:desglosar`

---

## Prerrequisitos
- Plan técnico completo (`design.md` o `plan.md` en `openspec/changes/[slug]/`)
- Spec en estado `APPROVED` o `CLARIFIED`

---

## Cómo Funciona

1. **Leer el plan técnico** y extraer componentes a construir
2. **Identificar unidades atómicas**: cada tarea toca máximo 2-3 archivos relacionados
3. **Mapear dependencias** entre tareas (no ejecutar B antes que A)
4. **Determinar paralelismo**: qué tareas pueden ejecutarse en paralelo
5. **Asignar estimación** de tiempo en minutos
6. **Generar el `tasks.md`** en el directorio del change

---

## Plantilla de Output Obligatoria (`tasks.md`)

```markdown
# Tasks: [Nombre del cambio]

## Resumen
- **Total de tareas**: N
- **Estimación total**: X horas
- **Nivel**: [0-4]
- **Orden de ejecución**: Secuencial | Paralelo parcial

## Orden de Ejecución

```
[T01] Crear entidades de BD
  ↓
[T02] Crear repositorio       [T03] Crear DTOs
  ↓                                ↓
[T04] Implementar handler ←────────┘
  ↓
[T05] Configurar Lambda / Controller
  ↓
[T06] Tests de integración
  ↓
[T07] Actualizar documentación
```

---

## Tareas

### [T01] [Nombre de la tarea]

**Objetivo**: [Una oración — qué se construye]  
**Archivos a crear/modificar**:
- `[ruta/archivo.ts]` — [qué hace]
- `[ruta/otro.ts]` — [qué hace]

**Criterios de Aceptación**:
- [ ] [Criterio medible y específico]
- [ ] [Tests escritos antes que código (TDD)]
- [ ] [No rompe tests existentes]

**Estimación**: [X] min  
**Depende de**: —  
**Patrón de referencia**: `[ruta/archivo-maduro.ts]`

---

### [T02] [Siguiente tarea]

**Objetivo**: ...  
**Archivos a crear/modificar**: ...  
**Criterios de Aceptación**:
- [ ] ...
**Estimación**: [X] min  
**Depende de**: T01
```

---

## Criterios de Granularidad de Tareas

Una tarea está **bien granulada** cuando:
- Toca ≤ 3 archivos relacionados
- Puede completarse en 15-120 minutos
- Tiene criterios de aceptación verificables sin correr toda la app
- Un agente puede ejecutarla con solo leer el plan técnico y la tarea

Una tarea está **muy grande** cuando:
- Toca > 5 archivos no relacionados
- Estimación > 2 horas
- Sus criterios de aceptación requieren ver "todo junto"
→ **Dividir en subtareas**

Una tarea está **muy pequeña** cuando:
- Es solo agregar 1 línea de import
- No tiene criterios de aceptación propios
→ **Fusionar con tarea relacionada**

---

## Tipos de Tareas Estándar

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Entidad** | Crear/modificar entidad TypeORM o modelo Dynamo | `T01: Crear entidad CajaParqueadero` |
| **Repositorio** | Crear repo con queries necesarias | `T02: Crear CajaRepository con findByTenant` |
| **DTO** | Crear request/response DTOs con validaciones | `T03: Crear CreateCajaDto con class-validator` |
| **Handler/Service** | Lógica de negocio principal | `T04: Implementar handler cerrar-caja` |
| **Controller/Lambda** | Endpoint HTTP con guards | `T05: Configurar Lambda con Cognito authorizer` |
| **Tests** | Suite de tests unitarios e integración | `T06: Tests para handler cerrar-caja` |
| **Docs** | Actualizar OpenAPI, README, ADRs | `T07: Actualizar OpenAPI con nuevo endpoint` |
| **Migration** | Script de migración de BD | `T08: Migration: add tabla caja_parqueadero` |

---

## Uso

```
/gd:breakdown
/gd:breakdown [slug]   # para un change específico
```

---

## Integración con Razonamiento

Para priorizar tareas por impacto real con Pareto:

```
/gd:razonar --modelo=pareto [lista de tareas del breakdown]
```

Para descomponer una tarea que todavía parece grande:

```
/gd:razonar --modelo=rlm-descomposicion [descripción de la tarea compleja]
```

---

## Salida Estructurada (agentes ReAct)

Emitir JSON al final según `openspec/templates/react-outputs/breakdown.output.schema.json` (tareas con criterios de aceptación y dependencias).

---

## Siguiente Paso
Después del breakdown, ejecutar `/gd:implement` tarea por tarea siguiendo el orden definido.

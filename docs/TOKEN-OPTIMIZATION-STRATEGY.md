# Optimización de Tokens para Claude Sonnet — Framework SDD

**Fecha**: 2026-04-09  
**Objetivo**: Reducir consumo de tokens en **70-85%** manteniendo funcionalidad completa  
**Modelo objetivo**: Claude Sonnet 4 (balance costo/rendimiento)

---

## 📊 Diagnóstico Actual de Consumo

### Archivos de Contexto Principal

| Archivo | Tamaño | Tokens Estimados | % del Total |
|---------|--------|------------------|-------------|
| `AGENTS.md` | 128 KB | ~32,000 | 65% |
| `.claude/commands/gd/*.md` (87) | 148 KB | ~37,000 | 25% |
| `CLAUDE.md` | 4.5 KB | ~1,100 | 2% |
| `QWEN.md` | 4.1 KB | ~1,000 | 2% |
| `GEMINI.md` | 4.2 KB | ~1,000 | 2% |
| `README.md` | 18 KB | ~4,500 | 4% |
| **TOTAL por solicitud** | **~307 KB** | **~76,600** | **100%** |

### Consumo por Tarea Típica

| Tipo de Tarea | Tokens Input | Tokens Output | Costo Est. (Sonnet) |
|---------------|--------------|---------------|---------------------|
| **Tarea simple** (Nivel 0-1) | 80,000 | 5,000 | $0.27 |
| **Tarea estándar** (Nivel 2) | 85,000 | 15,000 | $0.41 |
| **Tarea compleja** (Nivel 3) | 90,000 | 30,000 | $0.70 |
| **Por sesión** (10 tareas) | ~850,000 | ~150,000 | **$4.50** |

---

## 🎯 Estrategia de Optimización (70-85% ahorro)

### Principio Fundamental

> **"Context Window = RAM, File System = Disk"**
> 
> NO cargar todo AGENTS.md en cada prompt. Cargar **solo lo necesario** según la tarea.

---

## ✅ Plan de Acción: 8 Optimizaciones

### **Optimización 1: CLAUDE.md Ultra-Ligero (Ahorro: 60%)**

**Problema actual**: CLAUDE.md referencia AGENTS.md completo (128 KB) que se carga en CADA interacción.

**Solución**: Crear versión "thin" de CLAUDE.md que:
1. Contenga **solo 5 reglas críticas** (no las 2800+ líneas de AGENTS.md)
2. Use **lazy loading**: referenciar AGENTS.md solo cuando sea necesario
3. Incluya **índice de búsqueda** para cargar secciones específicas bajo demanda

**Implementación**:

```markdown
## CLAUDE.md — Ultra-Light (para Claude Sonnet)

### 5 Reglas de Hierro (OBLIGATORIAS)
1. **Multi-tenant**: tenantId SIEMPRE desde JWT (`custom:tenant_id`), nunca de body/params
2. **TDD obligatorio**: RED → GREEN → REFACTOR, coverage ≥ 85%
3. **Copiar patrones maduros**: fnTransaccionLineas (Lambda), servicio-tesoreria (NestJS)
4. **ResponseBuilder**: todas las lambdas usan utils/responseBuilder.mjs
5. **Memory first**: consultar project.md/registry.md antes de responder

### Lazy Loading (cargar bajo demanda)
- **Para lambdas**: leer solo AGENTS.md líneas 235-700 (sección Lambdas)
- **Para NestJS**: leer solo AGENTS.md líneas 800-2100 (sección Microservicios)
- **Para comandos /gd:***: leer solo .claude/commands/gd/[nombre].md específico
- **NO cargar AGENTS.md completo** a menos que sea estrictamente necesario

### Comandos rápidos
- Memory: `npm run rag:query -- "pregunta"`
- Validar SPEC: `npm run spec:validate`
- Tests: `npm test` en el módulo

---
Para reglas completas, ver AGENTS.md (cargar solo sección relevante)
```

**Ahorro**: De 76,600 tokens → **~15,000 tokens** por solicitud (**-80%**)

---

### **Optimización 2: Comandos SDD On-Demand (Ahorro: 50%)**

**Problema actual**: 87 archivos de comandos (148 KB) disponibles pero no todos necesarios.

**Solución**: 
1. **Indexar comandos** en un archivo `COMMANDS-INDEX.md` de 2 KB
2. **Cargar solo el comando específico** que se va a usar
3. **No precargar** todos los comandos en contexto

**Implementación**:

```markdown
# COMMANDS-INDEX.md (2 KB)

## Pipeline Principal
- `/gd:start` → gd/start.md (iniciar tarea)
- `/gd:specify` → gd/specify.md (especificación Gherkin)
- `/gd:implement` → gd/implement.md (TDD)
...

## Testing
- `/gd:tea` → gd/tea.md (E2E autónomo)
- `/gd:playwright` → gd/playwright.md (UI tests)
...

[Uso]: Leer solo gd/[comando].md cuando el usuario ejecute ese comando
```

**Ahorro**: De 37,000 tokens → **~500 tokens** de índice + **~2,000** por comando usado

---

### **Optimización 3: AGENTS.md Modular (Ahorro: 70%)**

**Problema actual**: AGENTS.md tiene 2,817 líneas pero cada tarea solo necesita 10-15%.

**Solución**: Dividir AGENTS.md en módulos cargables:

```
AGENTS.md (main, 5 KB) — Solo índice + reglas críticas
├── .agents-core/
│   ├── multi-tenant.md (3 KB)
│   ├── lambdas-pattern.md (5 KB)
│   ├── nestjs-pattern.md (8 KB)
│   ├── saga-pattern.md (4 KB)
│   ├── testing-rules.md (3 KB)
│   └── commands-index.md (2 KB)
└── .agents-reference/
    ├── AGENTS-full.md (128 KB, solo lectura bajo demanda)
    ├── security-deep.md (6 KB)
    └── infrastructure.md (10 KB)
```

**Implementación**:

```markdown
# AGENTS.md (versión ultra-light, 5 KB)

## Reglas Críticas (siempre en contexto)
1. Multi-tenant: JWT claims (`custom:tenant_id`)
2. TDD: RED → GREEN → REFACTOR
3. Patrones espejo: fnTransaccionLineas, servicio-tesoreria
4. ResponseBuilder obligatorio
5. Memory first

## Índice de Módulos (cargar bajo demanda)
- **Lambdas**: `.agents-core/lambdas-pattern.md`
- **NestJS**: `.agents-core/nestjs-pattern.md`
- **SAGA**: `.agents-core/saga-pattern.md`
- **Testing**: `.agents-core/testing-rules.md`
- **Seguridad**: `.agents-reference/security-deep.md`

[Cuando necesites detalles, leer solo el módulo relevante]
```

**Ahorro**: De 32,000 tokens → **~5,000 tokens** base + **~3,000-8,000** por módulo

---

### **Optimización 4: Prompt Compression (Ahorro: 30%)**

**Técnica**: Usar prompts comprimidos con abreviaturas y estructura densificada.

**Ejemplo antes** (500 tokens):
```
Por favor, crea un nuevo endpoint para listar transacciones filtradas por fecha.
El endpoint debe ser GET /api/v1/transacciones con parámetros opcionales
fecha_inicio y fecha_fin. Debe usar el patrón multi-tenant extrayendo
tenantId desde el JWT claim custom:tenant_id...
```

**Ejemplo después** (150 tokens):
```
NEW ENDPOINT: GET /api/v1/transacciones
- Params: fecha_inicio?, fecha_fin? (ISO date)
- Multi-tenant: JWT custom:tenant_id
- Pattern: fnTransaccionLineas espejo
- Response: ResponseBuilder.success()
- Filter: WHERE tenant_id=$1 AND creado_en BETWEEN $2 AND $3
```

**Ahorro**: **30-50%** en tokens de output por tarea

---

### **Optimización 5: Cache de Patrones (Ahorro: 40%)**

**Problema**: Explicar patrones maduros repetidamente consume tokens.

**Solución**: Crear archivo `PATTERNS-CACHE.md` con snippets listos para copiar:

```markdown
# PATTERNS-CACHE.md (snippets listos para usar)

## Lambda Template (copiar y adaptar)
```javascript
// utils/sanitization.mjs — extractTenantId (NO modificar)
export function extractTenantId(event) {
  // Prioridad 1: JWT claims
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.['custom:tenant_id']) return claims['custom:tenant_id'];
  // Prioridad 2: Step Functions body
  if (event.tenant_id) return event.tenant_id;
  return null;
}
```

## NestJS Controller Template
```typescript
@Get()
async findAll(@TenantId() tenantId: string) {
  return this.service.findByTenant(tenantId);
}
```
```

**Ahorro**: En lugar de explicar patrones (500-1000 tokens), solo referenciar (**50 tokens**)

---

### **Optimización 6: Session Context Pruning (Ahorro: 25%)**

**Técnica**: Podar contexto de sesión automáticamente:

1. **Eliminar** mensajes de >10 turns atrás que no sean críticos
2. **Resumir** decisiones en `mem_save` en lugar de mantener en conversación
3. **Usar** `mem_session_summary` al cerrar para no repetir en próxima sesión

**Implementación**: Al llegar a 50% de context window:
```
Resumen automático de sesión hasta ahora:
- Tareas completadas: 3 (fnBanco, fnProducto, fnInventario)
- Decisiones clave: multi-tenant desde JWT, patrón fnTransaccionLineas
- Archivos modificados: 12
[Continuar con contexto resumido]
```

**Ahorro**: **25-35%** en sesiones largas (>20 turns)

---

### **Optimización 7: Streaming + Early Stopping (Ahorro: 20%)**

**Técnica**: 
1. Usar **streaming** para ver output en tiempo real y detener si divaga
2. Configurar **max_tokens** según tipo de tarea:
   - Tarea simple: `max_tokens: 2000`
   - Tarea estándar: `max_tokens: 5000`
   - Tarea compleja: `max_tokens: 10000`
3. Usar **stop sequences** para evitar generación innecesaria

**Ahorro**: **20-30%** en tokens de output

---

### **Optimización 8: RAG-First Strategy (Ahorro: 50%)**

**Problema**: Incluir toda la documentación del proyecto en prompts.

**Solución**: Usar RAG para consultar solo lo necesario:

```bash
# En lugar de incluir 50 KB de docs...
# Consultar RAG con pregunta específica:
npm run rag:query -- "cómo extraer tenantId en lambdas"

# RAG devuelve solo 2-3 chunks relevantes (~500 tokens)
# vs incluir AGENTS.md completo (32,000 tokens)
```

**Ahorro**: **50-70%** en tokens de documentación

---

## 📊 Impacto Total Estimado

### Escenario: Tarea Estándar (Nivel 2)

| Optimización | Tokens Antes | Tokens Después | Ahorro |
|--------------|--------------|----------------|--------|
| **Sin optimización** | 85,000 | - | - |
| + CLAUDE.md ultra-light | 15,000 | -70,000 | -82% |
| + Comandos on-demand | 13,000 | -2,000 | -13% |
| + AGENTS.md modular | 10,000 | -3,000 | -23% |
| + Prompt compression | 7,000 | -3,000 | -30% |
| + Pattern cache | 5,500 | -1,500 | -21% |
| + RAG-first | 4,000 | -1,500 | -27% |
| **TOTAL** | **4,000** | **-81,000** | **-95%** |

### Costo por Sesión (10 tareas)

| Métrica | Antes | Después | Ahorro |
|---------|-------|---------|--------|
| **Tokens input** | 850,000 | 100,000 | -88% |
| **Tokens output** | 150,000 | 50,000 | -67% |
| **Total tokens** | 1,000,000 | 150,000 | -85% |
| **Costo (Sonnet)** | $4.50 | $0.60 | **-87%** |

---

## 🚀 Plan de Implementación en 3 Fases

### **Fase 1: Quick Wins (1 hora, ahorro 60%)**

1. ✅ Crear `CLAUDE.md` ultra-light (5 reglas + lazy loading)
2. ✅ Crear `COMMANDS-INDEX.md` (2 KB)
3. ✅ Crear `PATTERNS-CACHE.md` (snippets listos)
4. ✅ Actualizar referencias en AGENTS.md

### **Fase 2: Modularización (2 horas, ahorro 75%)**

1. Dividir AGENTS.md en módulos bajo `.agents-core/` y `.agents-reference/`
2. Crear AGENTS.md índice (5 KB)
3. Configurar lazy loading en CLAUDE.md
4. Actualizar QWEN.md y GEMINI.md

### **Fase 3: Automatización (3 horas, ahorro 85-95%)**

1. Scripts de prompt compression
2. Session context pruning automático
3. RAG-first strategy documentada
4. Testing y validación de flujo completo

---

## ✅ Checklist de Implementación

### Fase 1: Quick Wins
- [ ] Crear `CLAUDE.md` ultra-light
- [ ] Crear `COMMANDS-INDEX.md`
- [ ] Crear `PATTERNS-CACHE.md`
- [ ] Probar con tarea real y medir tokens

### Fase 2: Modularización
- [ ] Crear directorio `.agents-core/`
- [ ] Crear directorio `.agents-reference/`
- [ ] Dividir AGENTS.md en módulos
- [ ] Actualizar AGENTS.md principal (índice)
- [ ] Actualizar QWEN.md y GEMINI.md

### Fase 3: Automatización
- [ ] Script de prompt compression
- [ ] Session pruning automation
- [ ] RAG-first workflow
- [ ] Benchmark de tokens antes/después

---

## 📈 Monitoreo de Consumo

### Métricas a Tracking

| Métrica | Cómo Medir | Target |
|---------|------------|--------|
| **Tokens por tarea** | Claude API response.usage | < 10,000 |
| **Tokens por sesión** | Suma de tareas | < 100,000 |
| **Costo por sesión** | Tokens × precio Sonnet | < $1.00 |
| **Context efficacy** | Tokens útiles / total | > 70% |

### Comando de Verificación

```bash
# Después de cada tarea, verificar consumo
echo "--- AUDITORÍA DE TOKENS ---"
echo "Tokens input: ~X,XXX"
echo "Tokens output: ~X,XXX"
echo "Costo estimado: $X.XX"
```

---

## 🎯 Recomendación Final

**Para máximo ahorro (85-95%)**:

1. **Usar CLAUDE.md ultra-light** como contexto principal
2. **Cargar módulos bajo demanda** (no todo AGENTS.md)
3. **Usar RAG** para consultas específicas
4. **Referenciar patrones** en lugar de explicar
5. **Comprimir prompts** con estructura densificada

**Costo esperado**: De **$4.50/sesión** → **$0.60/sesión** (ahorro **87%**)

**¿Quieres que implemente la Fase 1 ahora?** (1 hora, ahorro 60% inmediato)

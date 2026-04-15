# /gd:doctor — Diagnosticar y Reparar el Framework

## Propósito
Diagnosticar y reparar problemas del framework, entorno o configuración. Ejecuta una batería de chequeos de salud y propone reparaciones concretas para cada problema encontrado.

---

## Cómo Funciona

1. **Ejecutar chequeos** por categoría (ver abajo)
2. **Clasificar issues** por severidad: CRITICAL, WARNING, INFO
3. **Proponer fix** para cada issue encontrado
4. **Aplicar reparaciones automáticas** cuando es seguro hacerlo
5. **Emitir reporte** con estado del framework

---

## Categorías de Diagnóstico

### 1. Entorno de Desarrollo
```bash
node --version          # debe ser >= 20
npm --version
ls node_modules/        # debe existir
test -f .env && echo "OK" || echo "MISSING .env"
aws sts get-caller-identity   # AWS CLI configurado
```

**Chequeos**:
- [ ] Node.js >= 20 instalado
- [ ] `node_modules/` presente (ejecutar `npm install` si falta)
- [ ] `.env` existe con las variables requeridas
- [ ] AWS CLI configurado

---

### 2. Framework SDD

```
openspec/
├── config.yaml     — configuración del framework
├── registry.md     — historial de changes
├── specs/          — specs principales del proyecto
├── changes/        — changes activos
└── templates/      — plantillas de artefactos
```

**Chequeos**:
- [ ] `openspec/config.yaml` existe y es YAML válido
- [ ] `openspec/registry.md` existe
- [ ] `openspec/changes/` no tiene más de 5 changes activos simultáneos
- [ ] No hay changes sin slug o con slug duplicado
- [ ] Todos los changes activos tienen al menos una spec

---

### 3. Comandos /gd:*

```bash
ls .claude/commands/gd/ | wc -l   # debe ser >= 80
```

**Chequeos**:
- [ ] `.claude/commands/gd/` existe con >= 80 archivos
- [ ] Pipeline core presente: specify, clarify, plan, breakdown, implement, review, verify, archive
- [ ] Comandos PraisonAI presentes: flow, guardrail, eval, checkpoint, research, route, policy
- [ ] Sin comandos con contenido vacío (stubs de 0 líneas)

---

### 4. Orquestador

```bash
ls packages/sdd-agent-orchestrator/src/
```

**Chequeos**:
- [ ] `packages/sdd-agent-orchestrator/` existe
- [ ] `src/graph/sdd-gd-cycle-graph.mjs` existe
- [ ] `src/middleware/` tiene los 6 módulos de middleware
- [ ] `npm install` en el paquete del orquestador está al día

---

### 5. Git

```bash
git status
git log --oneline -5
```

**Chequeos**:
- [ ] Repositorio Git inicializado
- [ ] Rama actual no es `main`/`master` directamente
- [ ] Sin archivos en conflicto sin resolver
- [ ] Últimos commits tienen mensajes descriptivos

---

### 6. Memoria Engram

**Chequeos**:
- [ ] Sesión de Engram activa o puede iniciarse
- [ ] Últimas observaciones recuperables (`mem_context`)
- [ ] Sin sesiones abiertas sin cerrar de más de 7 días

---

## Formato de Reporte

```markdown
## Doctor — Diagnóstico del Framework
**Fecha**: [YYYY-MM-DD HH:mm]
**Estado general**: ✅ HEALTHY | ⚠️ WARNINGS | ❌ CRITICAL ISSUES

### Resumen

| Categoría | Estado | Issues |
|-----------|--------|--------|
| Entorno | ✅ OK | — |
| Framework SDD | ⚠️ Warning | 1 warning |
| Comandos /gd:* | ✅ OK | — |
| Orquestador | ❌ Error | 1 critical |
| Git | ✅ OK | — |
| Engram | ✅ OK | — |

### Issues Encontrados

#### CRITICAL
- **[ORQ-01]** `packages/sdd-agent-orchestrator/node_modules/` no existe
  - Fix: `cd packages/sdd-agent-orchestrator && npm install`

#### WARNING
- **[SDD-01]** 3 changes activos sin spec (directorios vacíos)
  - Fix: Ejecutar `/gd:specify` o eliminar el directorio

### Reparaciones Automáticas Disponibles
- [ ] Aplicar `npm install` donde falten node_modules
- [ ] Eliminar directorios de changes vacíos (confirmación requerida)
```

---

## Uso

```
/gd:doctor                   # diagnóstico completo
/gd:doctor --fix             # diagnosticar y aplicar reparaciones automáticas seguras
/gd:doctor --category=sdd    # solo el framework SDD
/gd:doctor --category=env    # solo el entorno de desarrollo
/gd:doctor --category=git    # solo Git
```

---

## Reparaciones Automáticas (con --fix)

| Issue | Reparación automática |
|-------|----------------------|
| `node_modules/` faltante | `npm install` |
| `.env` faltante | Copiar de `.env.example` con alerta |
| Stubs de 0 líneas | Alertar (no borrar automáticamente) |

---

## Siguiente Paso
Si el framework está HEALTHY, continuar con el trabajo normal.
Si hay CRITICAL issues, resolverlos antes de ejecutar cualquier comando del pipeline.
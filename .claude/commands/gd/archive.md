# /gd:archive — Sincronizar Delta Specs a Specs Principales y Archivar Cambio

## Propósito
Finalizar el ciclo SDD sincronizando las especificaciones delta con las specs principales y archivando el cambio completado. Produce un registro histórico inmutable del trabajo realizado.

## Alias
- `/gd:archivar`

---

## Prerrequisitos (todos obligatorios)

- [ ] `/gd:review` pasado con veredicto `PASS`
- [ ] `/gd:verify` pasado con veredicto `VERIFY PASS`
- [ ] `/gd:close` pasado con veredicto `READY FOR ARCHIVE`
- [ ] `/gd:release` aprobado si el change genera versión o salida operativa
- [ ] `/gd:deploy` validado si el change requiere despliegue real
- [ ] Suite de tests completa en verde (`npm test`)
- [ ] Código commiteado a la rama de trabajo
- [ ] Documentación actualizada (OpenAPI, README, `CONSUMO.md`, `EVIDENCE.md` y CHANGELOG si aplica)

---

## Cómo Funciona

1. **Validar prerrequisitos** — no archivar si hay gates pendientes
2. **Confirmar cierre formal** — `CONSUMO.md`, `EVIDENCE.md` y documentación final deben estar completos
3. **Copiar delta specs** de `openspec/changes/[slug]/specs/` a `openspec/specs/`
4. **Actualizar `project.md`** con el resumen del cambio completado
5. **Agregar entrada a `registry.md`** con número secuencial y metadata
6. **Crear carpeta de archivo** en `openspec/changes/archive/[fecha]-[slug]/`
7. **Mover artefactos** de trabajo a la carpeta de archivo
8. **Guardar evidencia en Engram** (`mem_session_summary`)
9. **Emitir resumen** de qué se archivó y dónde queda

---

## Proceso Paso a Paso

### Paso 1: Verificar prerrequisitos

```bash
# Tests pasando
npm test

# Verificar que no hay cambios sin commitear
git status
```

Si algo falla → resolver antes de continuar.

### Paso 2: Sincronizar delta specs a specs principales

```bash
# Copiar specs del change a specs principales del proyecto
cp openspec/changes/[slug]/specs/*.md openspec/specs/

# O para proyectos con specs por módulo:
cp openspec/changes/[slug]/specs/[modulo].spec.md openspec/specs/modules/[modulo]/
```

### Paso 3: Actualizar registry.md

Agregar entrada con el siguiente número secuencial:

```markdown
## C-[NNN] [Nombre del Change]

- **Slug**: [slug-del-change]
- **Fecha**: [YYYY-MM-DD]
- **Nivel**: [0-4]
- **Estado**: ARCHIVED
- **Resumen**: [1-2 oraciones describiendo qué se implementó]
- **Archivos clave**: [lista de archivos principales creados/modificados]
- **Tests**: [N tests agregados, coverage X%]
- **Archive**: `openspec/changes/archive/[fecha]-[slug]/`
```

### Paso 4: Mover artefactos a archivo

```bash
mkdir -p openspec/changes/archive/[YYYY-MM-DD]-[slug]
mv openspec/changes/[slug]/ openspec/changes/archive/[YYYY-MM-DD]-[slug]/
```

### Paso 5: Actualizar project.md

Agregar al historial de cambios:

```markdown
## Historial de Cambios

### [YYYY-MM-DD] [Nombre del Change] (C-[NNN])
- [Qué se implementó — punto 1]
- [Qué se implementó — punto 2]
- **Impacto**: [módulos afectados]
```

### Paso 6: Guardar en Engram

```
mem_session_summary — incluir:
- Qué se construyó
- Decisiones de arquitectura tomadas
- Archivos principales modificados
- Problemas encontrados y cómo se resolvieron
```

---

## Output del Comando

```markdown
## Cambio Archivado: [nombre del change]

**ID**: C-[NNN]
**Fecha**: [YYYY-MM-DD]
**Slug**: [slug]
**Nivel**: [0-4]

### Specs sincronizadas
- [N] archivos copiados a `openspec/specs/`

### Artefactos archivados
- `openspec/changes/archive/[fecha]-[slug]/`
  - specs/ ([N] archivos)
  - tasks.md
  - design.md (si existe)
  - proposal.md (si existe)
  - EVIDENCE.md
  - referencias de contrato/consumo y release notes

### Registry actualizado
- Entrada agregada en `openspec/registry.md` como C-[NNN]

### Evidencia de cierre
- Review: PASS
- Verify: PASS
- Close: READY FOR ARCHIVE
- Release: APPROVED (si aplica)
- Deploy: APPROVED/VALIDATED (si aplica)
- CHANGELOG: actualizado

El ciclo SDD está completo y auditado. El siguiente cambio puede iniciar con `/gd:start`.
```

---

## Uso

```
/gd:archive
/gd:archive [slug]   # archivar un change específico por slug
```

---

## Estructura del Directorio de Archivo

```
openspec/changes/archive/
└── [YYYY-MM-DD]-[slug]/
    ├── specs/
    │   └── [feature].spec.md
    ├── tasks.md          # tasks completadas con evidencia
    ├── design.md         # plan técnico (si existía)
    ├── proposal.md       # propuesta inicial (si existía)
    ├── EVIDENCE.md       # resumen de evidencia de tests y gates
    └── ARCHIVED.md       # metadata de archivo con fechas y links
```

---

## Siguiente Paso
Ciclo SDD completado. El próximo cambio puede comenzar con `/gd:start`.

Para ver el historial de cambios archivados: revisar `openspec/registry.md`.

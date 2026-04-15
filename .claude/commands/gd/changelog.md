# /gd:changelog — Generar Release Notes y Changelog de Cierre

## Propósito
Generar un registro de cambios estructurado, trazable y listo para cierre o release. Este comando no solo resume cambios: también debe consolidar release notes, contratos impactados y evidencia del spec ya verificado.

---

## Cómo Funciona

1. **Leer `openspec/registry.md`** para obtener los changes cerrados o archivados
2. **Leer el historial Git** (`git log --oneline`) para complementar con commits
3. **Cruzar la información** con evidencias, contratos y documentación de cierre
4. **Categorizar cambios** por tipo (Feature, Fix, Refactor, Breaking Change, Security)
5. **Generar release notes** orientadas a operación, negocio y consumo técnico
6. **Escribir o actualizar** `CHANGELOG.md` en la raíz del proyecto

---

## Requisitos para usarlo en cierre formal

Antes de ejecutar este comando como parte del cierre o la release:
- el change debe haber pasado `review`, `verify` y `close`;
- la documentación contractual debe estar actualizada;
- los breaking changes y notas de compatibilidad deben estar explícitos;
- las notas de despliegue o rollback deben estar disponibles si aplican.

---

## Formato de Output (Keep a Changelog)

```markdown
# Changelog

Todos los cambios notables de este proyecto están documentados aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

### Agregado
- [Feature] Descripción del cambio orientada al usuario final

---

## [v2.1.0] — 2026-04-14

### Agregado
- Módulo de parqueaderos: registro de entrada, salida y cobro automático (C-042)
- API endpoint `GET /api/reportes/caja` con filtros por fecha y tenant (C-041)

### Cambiado
- Mejorado rendimiento de consultas de transacciones con índices en `tenant_id` (C-040)

### Corregido
- Fix: transacciones duplicadas en cierre de caja de parqueaderos (C-039)
- Fix: monto de cierre no se guardaba correctamente en BD (C-038)

### Seguridad
- Validación de tenant_id extraído exclusivamente de JWT en todos los endpoints (C-037)

---

## [v2.0.0] — 2026-03-15

### Breaking Changes
- Migración de sesiones a JWT — requiere re-autenticación de todos los usuarios
```

---

## Uso

```
/gd:changelog                          # generar changelog desde el último tag
/gd:changelog --version=v2.1.0         # para una versión específica
/gd:changelog --from=C-035 --to=C-042  # rango de changes
/gd:changelog --format=technical       # con detalles técnicos (archivos, tests)
/gd:changelog --format=business        # lenguaje de negocio para stakeholders
/gd:changelog --unreleased             # solo cambios sin versión asignada
```

---

## Categorías de Cambios

| Categoría | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Agregado** | Nueva funcionalidad | Nuevo endpoint, nuevo módulo |
| **Cambiado** | Modificación de funcionalidad existente | Nuevo comportamiento en endpoint existente |
| **Deprecado** | Funcionalidad que se eliminará en versión futura | Parámetro `userId` deprecado |
| **Eliminado** | Funcionalidad removida | Endpoint `/api/v1/` eliminado |
| **Corregido** | Bug fix | Fix en cálculo de total de caja |
| **Seguridad** | Patch de seguridad | Validación de inputs en login |
| **Breaking** | Cambio incompatible hacia atrás | Cambio de esquema de BD sin backward migration |

---

## Reglas de Redacción

1. **Orientado al usuario**: "Módulo de reportes de caja" — no "CajaService con método generateReport"
2. **Incluir referencia al change**: `(C-042)` al final para trazabilidad
3. **Breaking changes primero** dentro de su versión
4. **Una línea por cambio**
5. **Fecha exacta** en formato ISO 8601: `YYYY-MM-DD`

---

## Integración con Releases

```bash
# Actualizar CHANGELOG.md
/gd:changelog --version=v2.1.0

# Crear tag de git
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
```

---

## Archivos que Lee

| Archivo | Uso |
|---------|-----|
| `openspec/registry.md` | Lista de changes con metadata |
| `CHANGELOG.md` | Archivo existente para actualizar |
| `git log --oneline` | Commits sin change asociado |
| `openspec/changes/archive/*/ARCHIVED.md` | Metadata detallada de cada change |

---

## Siguiente Paso
Después de generar el changelog:
- usar `/gd:release` para evaluar la salida formal de la versión;
- usar `/gd:deploy` si la release fue aprobada;
- usar `/gd:archive` cuando el change quede completamente cerrado y auditado.
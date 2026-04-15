# /gd:stub-detect — Detectar Código No Implementado y Placeholders

## Propósito
Detectar y reportar código no implementado, TODOs, stubs, placeholders y "slop" en el codebase. Asegura que el código entregado sea funcional y no contenga implementaciones falsas o incompletas antes del review y archive.

---

## Cómo Funciona

1. **Escanear el código** del change activo o del directorio especificado
2. **Detectar patrones** de código no implementado (ver categorías abajo)
3. **Clasificar por severidad**: BLOCKER, WARNING, INFO
4. **Generar reporte** con ubicación exacta (archivo:línea)
5. **Bloquear el pipeline** si hay BLOCKERs antes de `/gd:review`

---

## Categorías de Stubs Detectados

### BLOCKER — Impide el merge/archive

```typescript
// throw new Error('Not implemented')
// throw new Error('TODO')
throw new Error('Not implemented');

// Cuerpos de función vacíos en código de producción
async function procesarPago(data: any): Promise<void> {
  // TODO: implementar
}

// Return de valores hardcodeados en producción
function calcularTotal(): number {
  return 0; // placeholder
}

// Métodos abstractos sin implementación concreta
abstract procesarSolicitud(): Promise<any>; // sin clase que lo implemente
```

### WARNING — Debe revisarse antes del merge

```typescript
// TODO/FIXME en código de negocio
const total = precio * cantidad; // TODO: aplicar descuentos

// console.log sin propósito de debugging
console.log('llegué aquí'); // debugging olvidado

// any en TypeScript donde debería haber tipo
async function guardar(data: any): Promise<any> {

// Campos opcionales que deberían ser requeridos
@Column({ nullable: true }) // ¿es realmente nullable?
nombreCliente: string;
```

### INFO — Registro para tracking

```typescript
// @deprecated sin fecha de remoción
/** @deprecated */
function metodoAntiguo() {

// HACK / WORKAROUND documentado
// HACK: workaround por bug en librería X — eliminar cuando actualicen a v2.0

// Configuración hardcodeada que debería ser env var
const API_URL = 'https://api.dev.example.com'; // debería ser process.env.API_URL
```

---

## Patrones de Búsqueda

```bash
# Lo que detecta el scanner:
grep -rn "TODO\|FIXME\|HACK\|WORKAROUND\|Not implemented\|placeholder\|// TODO" src/
grep -rn "throw new Error.*TODO\|throw new Error.*Not implemented" src/
grep -rn "return null; // TODO\|return \[\]; // TODO\|return {}; // TODO" src/
grep -rn ": any\b" src/ --include="*.ts"  # TypeScript any sospechoso
grep -rn "console\.log" src/ --include="*.ts"  # logs de debug en producción
```

---

## Uso

```
/gd:stub-detect                     # escanear el change activo
/gd:stub-detect --path=src/         # escanear un directorio específico
/gd:stub-detect --severity=blocker  # solo mostrar BLOCKERs
/gd:stub-detect --fix               # sugerir fixes automáticos para WARNINGs obvios
/gd:stub-detect --commands          # detectar stubs en los comandos /gd:* (meta-uso)
```

---

## Formato de Reporte

```markdown
## Stub Detection — [nombre del change]
**Fecha**: [YYYY-MM-DD HH:mm]
**Archivos escaneados**: N
**Veredicto**: ✅ CLEAN | ⚠️ WARNINGS | ❌ BLOCKERS FOUND

### BLOCKERs (impiden el archive)

| # | Archivo | Línea | Patrón | Código |
|---|---------|-------|--------|--------|
| 1 | src/modules/caja/caja.service.ts | 87 | `throw new Error('Not implemented')` | `calcularComision()` |
| 2 | src/handlers/reportes.handler.ts | 34 | Cuerpo vacío | `async generarReporte() { }` |

### Warnings

| # | Archivo | Línea | Patrón | Código |
|---|---------|-------|--------|--------|
| 1 | src/modules/caja/caja.service.ts | 45 | TODO | `// TODO: aplicar IVA` |
| 2 | src/dto/create-caja.dto.ts | 12 | `any` type | `monto: any` |

### Info

| # | Archivo | Línea | Patrón |
|---|---------|-------|--------|
| 1 | src/config/database.ts | 3 | URL hardcodeada (debería ser env var) |

### Resumen

- BLOCKERs: 2 — **Pipeline bloqueado hasta resolverlos**
- Warnings: 2 — Revisar antes del merge
- Info: 1 — Tracking para seguimiento

### Acciones Requeridas

1. **[BLOCKER-1]** Implementar `calcularComision()` en `caja.service.ts:87`
2. **[BLOCKER-2]** Implementar cuerpo de `generarReporte()` en `reportes.handler.ts:34`
```

---

## Auto-detección de Stubs en Comandos /gd:*

Este comando puede ejecutarse sobre sí mismo para detectar comandos del framework que siguen siendo stubs:

```
/gd:stub-detect --commands
```

Genera una lista de comandos en `.claude/commands/gd/` con menos de 20 líneas (probables stubs).

---

## Integración en el Pipeline

`/gd:stub-detect` se ejecuta automáticamente como parte de `/gd:gate review` (D4 — Arquitectura).

Para ejecución manual antes del review:

```bash
# Escaneo rápido
/gd:stub-detect --severity=blocker

# Si 0 BLOCKERs → continuar con /gd:review
# Si BLOCKERs > 0 → corregir y re-escanear
```

---

## Siguiente Paso
- Si `CLEAN` o solo `INFO/WARNINGS` → continuar con `/gd:review`
- Si `BLOCKERS FOUND` → implementar los stubs detectados y re-ejecutar `/gd:stub-detect`

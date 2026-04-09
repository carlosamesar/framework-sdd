# AGENTS.md — Ultra-Light Index

**Versión**: 4.0 (Modular) | **Fecha**: 2026-04-09  
**Tokens**: ~3,000 (vs 32,000 del AGENTS.md completo)

---

## 5 Reglas de Hierro (OBLIGATORIAS, sin excepciones)

| # | Regla | Aplicación |
|---|-------|------------|
| **I** | **TDD obligatorio** | RED → GREEN → REFACTOR, coverage ≥ 85% |
| **II** | **Multi-tenant desde JWT** | `tenant_id` SIEMPRE de JWT, NUNCA de body/params |
| **III** | **Copiar patrones maduros** | `fnTransaccionLineas` (Lambda), `servicio-tesoreria` (NestJS) |
| **IV** | **Desarrollo bajo `/develop`** | Todo código dentro de `develop/` |
| **V** | **Evidencia antes que afirmaciones** | Tests pasando > "Creo que funciona" |

---

## Lazy Loading Index

**NO cargar este archivo completo**. Cargar solo el módulo necesario según la tarea:

| Tarea | Módulo | Tokens | Cuándo cargar |
|-------|--------|--------|---------------|
| **Multi-tenant / Auth** | `.agents-core/multi-tenant.md` | ~2,500 | Lambdas o NestJS con auth |
| **Crear Lambda** | `.agents-core/lambdas-pattern.md` | ~4,000 | Nueva lambda o modificar existente |
| **Crear NestJS** | `.agents-core/nestjs-pattern.md` | ~6,000 | Nuevo módulo o controlador NestJS |
| **Tests** | `.agents-core/testing-rules.md` | ~2,500 | Escribir o ejecutar tests |
| **SAGA / Orquestador** | `.agents-core/saga-pattern.md` | ~3,000 | Lambdas que participen en SAGA |
| **Comando /gd:*** | `COMMANDS-INDEX.md` | ~2,000 | Usuario ejecuta comando SDD |
| **Snippets** | `PATTERNS-CACHE.md` | ~3,000 | Copiar patrones sin explicar |

**Total base**: ~3,000 tokens  
**Con 1 módulo**: ~5,500-9,000 tokens  
**VS antes**: 32,000-70,000 tokens (**-70-90%**)

---

## Memory Protocol (Resumen)

- **Guardar**: `mem_save` después de decisiones, completados, descubrimientos
- **Buscar**: `mem_search` cuando pregunten sobre cosas pasadas
- **Cerrar sesión**: `mem_session_summary` (obligatorio)
- **Datos**: `engineering-knowledge-base/` con sync via git

**Detalle completo**: `AGENTS.md` § "Memoria Persistente" (buscar con RAG si necesario)

---

## Flujo SDD (6 Fases)

```
Specify → Clarify → Plan → Break Down → Implement → Review → Verify → Archive
```

| Nivel | Complejidad | Fases |
|-------|-------------|-------|
| **0 (Atomic)** | 1 archivo, < 30 min | Implement → Verify |
| **1 (Micro)** | 1-3 archivos | Specify (light) → Implement → Review |
| **2 (Standard)** | Múltiples archivos, 1-3 días | Todas las 6 fases |
| **3 (Complex)** | Multi-módulo, 1-2 semanas | 6 fases + pseudocódigo |
| **4 (Product)** | Nuevo sistema, 2+ semanas | 6 fases + constitución + propuesta |

**Comando**: `/gd:start "tarea"` → detecta nivel automáticamente

---

## Referencias de Dominio

### Lambdas
- **Madura**: `lib/lambda/transacciones/fnTransaccionLineas/`
- **Docs**: `lib/lambda/INICIO-RAPIDO.md`

### NestJS
- **Maduro**: `servicio-tesoreria/src/`
- **Contabilidad**: `servicio-contabilidad/src/`

### Cognito User Pools
| Tipo | User Pool ID | Servicios |
|------|--------------|-----------|
| NestJS | `us-east-1_gmre5QtIx` | servicio-contabilidad, servicio-tesoreria |
| Lambdas | `us-east-1_fQl9BKSxq` | lib/lambda/* |

---

## AGENTS.md Completo

El archivo completo tiene 2,872 líneas (~32,000 tokens).

**Para consultar**:
1. Identificar la sección necesaria (ver tabla de Lazy Loading)
2. Leer solo esa sección de `AGENTS.md`
3. O usar RAG: `npm run rag:query -- "pregunta específica"`

**Secciones principales**:
- Líneas 1-115: Memoria y configuración
- Líneas 116-230: Leyes de hierro, flujo SDD, complejidad
- Líneas 231-330: Seguridad y multi-tenant
- Líneas 331-700: Lambdas en lib/lambda
- Líneas 701-1100: Pruebas y TDD
- Líneas 1101-2100: Microservicios NestJS
- Líneas 2101-2600: Reglas severas para implementaciones
- Líneas 2601-2872: Comandos SDD, agentes, checklists

---

## Documentación Adicional

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Guía ultra-light para Claude Sonnet |
| `COMMANDS-INDEX.md` | Índice de 87 comandos SDD |
| `PATTERNS-CACHE.md` | 7 snippets listos para copiar |
| `docs/TOKEN-OPTIMIZATION-STRATEGY.md` | Estrategia de optimización de tokens |
| `docs/COMANDOS-GD-CREADOS.md` | Documentación de comandos creados |

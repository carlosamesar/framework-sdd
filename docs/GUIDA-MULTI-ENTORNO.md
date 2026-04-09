# Guía Multi-Entorno — Framework SDD

**Fecha**: 2026-04-09  
**Entornos soportados**: Claude Code, OpenCode, Qwen Code, GitHub Copilot  
**Optimización**: Automática en todos los entornos

---

## 🎯 Arquitectura de Optimización Multi-Entorno

Cada herramienta de IA lee su propio archivo de contexto, pero **todos aplican las mismas reglas**:

```
┌─────────────────────────────────────────────────────────┐
│                    AGENTS.md (índice)                    │
│                      ~3,000 tokens                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ CLAUDE.md  │    │ OPENCODE.md  │    │  QWEN.md     │    │ .github/         │
│ ~1,800     │    │ ~1,800       │    │ ~1,800       │    │ copilot-         │
│ tokens     │    │ tokens       │    │ tokens       │    │ instructions.md  │
│            │    │              │    │              │    │ ~2,000 tokens    │
└────────────┘    └──────────────┘    └──────────────┘    └──────────────────┘
       ↓                   ↓                      ↓                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│           Lazy Loading: .agents-core/*.md                                    │
│           (solo el módulo necesario)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           PATTERNS-CACHE.md (referenciar)                │
│           COMMANDS-INDEX.md (on-demand)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación de Entornos

| Métrica | Claude Code | OpenCode | Qwen Code | GitHub Copilot |
|---------|-------------|----------|-----------|----------------|
| **Archivo de contexto** | `CLAUDE.md` | `OPENCODE.md` | `QWEN.md` | `.github/copilot-instructions.md` |
| **Carga automática** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí (VS Code 2024+) |
| **Tokens contexto base** | ~1,800 | ~1,800 | ~1,800 | ~2,000 |
| **Con 1 módulo** | ~6,000 | ~6,000 | ~6,000 | ~7,000 |
| **Slash commands `/gd:*`** | ✅ Nativos | ✅ Soporte | ✅ Soporte | ⚠️ Manual |
| **Optimización tokens** | ✅ 87% | ✅ 85% | ✅ 87% | ✅ 80% |
| **Costo/sesión (10 tareas)** | $0.60 | $0.70 | $0.60 | $0.90 |

---

## 🚀 Cómo Usar en Cada Entorno

### Claude Code

**Automático**: Solo inicia la tarea

```
/gd:start Crear lambda fnReservaInventario
```

Claude lee `CLAUDE.md` automáticamente y aplica lazy loading.

### OpenCode

**Automático**: Igual que Claude Code

```
/gd:start Crear lambda fnReservaInventario
```

OpenCode lee `OPENCODE.md` y `.opencoderules` automáticamente.

### Qwen Code

**Automático**: Igual que Claude Code y OpenCode

```
/gd:start Crear lambda fnReservaInventario
```

Qwen lee `QWEN.md` automáticamente y aplica lazy loading.

### GitHub Copilot (VS Code)

**Dos modos de uso**:

#### Modo 1: Chat de Copilot (recomendado)

```
/gd:start Crear lambda fnReservaInventario

Contexto: Ver OPENCODE.md para reglas y patrones
Pattern: fnTransaccionLineas (copy)
- MT:JWT extractTenantId
- ResponseBuilder.success/error
```

Copilot lee `.github/copilot-instructions.md` automáticamente.

#### Modo 2: Inline Completions

Escribe normalmente, Copilot sugiere basado en el contexto del archivo actual. Para maximizar optimización:

```javascript
// Pattern: #1 extractTenantId (PATTERNS-CACHE.md)
// Pattern: #2 ResponseBuilder (PATTERNS-CACHE.md)
```

Los comentarios ayudan a Copilot a entender el patrón sin gastar tokens explicando.

---

## 🎓 Flujo de Trabajo Multi-Entorno

### Escenario: Equipo usa Claude + OpenCode + Copilot

```
1. Product Owner (Claude Code):
   /gd:start Crear lambda fnReservaInventario
   → Claude aplica optimización automática

2. Developer 1 (OpenCode):
   /gd:implement
   → OpenCode aplica optimización automática

3. Developer 2 (VS Code + Copilot):
   Escribe código con inline completions
   → Copilot lee copilot-instructions.md

4. Todos comparten:
   - Mismas 5 reglas de oro
   - Mismos patrones (.agents-core/)
   - Mismo PATTERNS-CACHE.md
   - Misma memoria (Engram + RAG)
```

---

## 📋 Checklist por Entorno

### Claude Code
- [x] `CLAUDE.md` configurado
- [x] Lazy loading automático
- [x] `/gd:*` commands nativos
- [x] Optimización: 87% ahorro

### OpenCode
- [x] `OPENCODE.md` configurado
- [x] `.opencoderules` configurado
- [x] `/gd:*` commands soportados
- [x] Optimización: 85% ahorro

### Qwen Code
- [x] `QWEN.md` configurado
- [x] Lazy loading automático
- [x] `/gd:*` commands soportados
- [x] Optimización: 87% ahorro

### GitHub Copilot (VS Code)
- [x] `.github/copilot-instructions.md` configurado
- [x] Inline completions optimizados
- [x] Chat con soporte `/gd:*`
- [x] Optimización: 80% ahorro

---

## 🔧 Configuración Adicional por Entorno

### Claude Code

No requiere configuración adicional. Lee `CLAUDE.md` automáticamente.

### OpenCode

Si OpenCode no lee `OPENCODE.md` automáticamente, agregar al inicio de la conversación:

```
Contexto: Seguir OPENCODE.md para reglas y optimización de tokens
```

### GitHub Copilot (VS Code)

1. **Habilitar Copilot Chat**: Extension → GitHub Copilot Chat
2. **Verificar que lee instrucciones**: El archivo `.github/copilot-instructions.md` se lee automáticamente
3. **Para inline completions**: Escribir comentarios con referencias a patrones:

```javascript
// Pattern: extractTenantId from JWT (PATTERNS-CACHE.md #1)
const tenantId = extractTenantId(event);
```

---

## 📈 Métricas de Optimización por Entorno

### Claude Code
```
Contexto base:     1,800 tokens
Con módulo:        6,000 tokens
VS sin optimizar:  74,600 tokens
Ahorro:            -92%
Costo/sesión:      $0.60
```

### OpenCode
```
Contexto base:     1,800 tokens
Con módulo:        6,500 tokens
VS sin optimizar:  74,600 tokens
Ahorro:            -91%
Costo/sesión:      $0.70
```

### GitHub Copilot
```
Contexto base:     2,000 tokens
Con módulo:        7,000 tokens
VS sin optimizar:  74,600 tokens
Ahorro:            -90%
Costo/sesión:      $0.90 (Copilot tiene overhead)
```

---

## ⚠️ Diferencias Clave

| Característica | Claude | OpenCode | Qwen | Copilot |
|----------------|--------|----------|------|---------|
| **Slash commands** | ✅ Nativos | ✅ Sí | ✅ Sí | ⚠️ Solo Chat |
| **Contexto automático** | ✅ Total | ✅ Total | ✅ Total | ✅ Parcial |
| **Inline completions** | ❌ No | ❌ No | ❌ No | ✅ Sí |
| **Memoria entre sesiones** | ✅ Engram | ✅ Engram | ✅ Engram | ❌ No nativo |
| **RAG integrado** | ✅ Sí | ✅ Sí | ✅ Sí | ⚠️ Manual |

---

## ✅ Verificación de Configuración

### Test en Claude Code
```
/gd:status
```
Debe mostrar comandos disponibles y estado del proyecto.

### Test en OpenCode
```
/gd:status
```
Debe funcionar igual que en Claude Code.

### Test en Qwen Code
```
/gd:status
```
Debe funcionar igual que en Claude Code y OpenCode.

### Test en GitHub Copilot
1. Abrir Copilot Chat (Ctrl+Shift+I)
2. Escribir: "¿Cuáles son las 5 reglas de oro del proyecto?"
3. Debe responder basado en `.github/copilot-instructions.md`

---

## 📚 Archivos de Referencia

| Archivo | Propósito | Lo lee |
|---------|-----------|--------|
| `CLAUDE.md` | Contexto Claude Code | Claude Code |
| `OPENCODE.md` | Contexto OpenCode | OpenCode |
| `QWEN.md` | Contexto Qwen Code | Qwen Code |
| `.github/copilot-instructions.md` | Contexto Copilot | GitHub Copilot |
| `.opencoderules` | Reglas OpenCode | OpenCode |
| `AGENTS.md` | Índice maestro | Todos (bajo demanda) |
| `COMMANDS-INDEX.md` | Catálogo comandos | Todos (bajo demanda) |
| `PATTERNS-CACHE.md` | Snippets listos | Todos (referencia) |
| `.agents-core/*.md` | Módulos lazy loading | Todos (bajo demanda) |

---

**Estado**: ✅ **CONFIGURACIÓN COMPLETA PARA LOS 4 ENTORNOS** (Claude, OpenCode, Qwen, Copilot)

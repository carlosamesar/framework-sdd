# Ejemplo: Usando el Framework GAF con OpenCode

Este documento muestra cómo utilizar los comandos del Framework SDD desde OpenCode para desarrollar una nueva funcionalidad.

---

## Escenario de Ejemplo

**Contexto:** Agregar módulo de reportes de ventas al servicio de contabilidad.

**Usuario:** "/gd:start Necesito agregar un módulo de reportes de ventas al servicio de contabilidad"

---

## Flujo de Trabajo SDD con Comandos

### 1. Iniciar Tarea - Detectar Complejidad

```
Usuario en OpenCode:
/gd:start "Agregar módulo de reportes de ventas al servicio de contabilidad"
```

**Qué hace el comando:**
- Analiza la tarea
- Detecta automáticamente el nivel de complejidad
- Genera SPEC inicial basada en AGENTS.md
- Asigna el perfil appropriate (Phantom Coder, Architect, etc.)

**Resultado esperado:**
```
🔍 Complejidad detectada: Nivel 2 (Standard)
📋 Múltiples archivos, 1-3 días estimado
📝 Ejecutando flujo SDD completo: Specify → Clarify → Plan → Break Down → Implement → Review
```

---

### 2. Especificar - Convertir Idea en Spec

```
/gd:specify "
Módulo de Reportes de Ventas para el servicio de contabilidad.
El módulo debe permitir:
- Generar reportes de ventas por período (diario, semanal, mensual)
- Filtrar por cliente, producto, vendedor
- Exportar a PDF y Excel
- Vista de gráficos con tendencias
"
```

**Qué hace el comando:**
- Convierte la idea en especificación Gherkin
- Genera escenarios de prueba (Given/When/Then)
- Define prioridades (P0, P1, P2)
- Crea esquema DBML preliminar

**Resultado esperado:**
```gherkin
Feature: Generación de Reportes de Ventas

  Scenario: Generar reporte de ventas por período
    Given el usuario está autenticado con tenant válido
    And existen transacciones de venta en el período
    When el usuario solicita reporte de ventas con período "2026-01"
    Then el sistema retorna resumen de ventas con totales por cliente
    And el reporte incluye gráficos de tendencias
```

---

### 3. Clarificar - Detectar Ambigüedades

```
/gd:clarify
```

**Qué hace el comando:**
- Análisis automático de la SPEC
- Detecta ambigüedades y contradicciones
- Pide clarificación sobre puntos vagos
- Valida que la SPEC sea medible y no ambigua

**Ejemplo de detección:**
```
⚠️ Ambigüedad detectada: "Exportar a PDF y Excel"
   - ¿Qué formato específico de PDF? ¿A4, carta?
   - ¿Excel .xlsx o .csv?
   - ¿Plantilla predefinida o dinámica?
   
✅ Suggestion: Especificar formatos exactos en la SPEC
```

---

### 4. Planificar - Blueprint Técnico

```
/gd:tech-plan
```

**Qué hace el comando:**
- Genera blueprint técnico
- Define arquitectura del módulo
- Contratos API (endpoints, métodos, payloads)
- Esquema de base de datos final
- Define tecnologías a usar (NestJS, TypeORM, etc.)

**Resultado esperado:**
```
📐 ARQUITECTURA DEL MÓDULO

├── servicio-contabilidad/src/reportes/
│   ├── controladores/reporte-ventas.controller.ts
│   ├── servicios/reporte-ventas.service.ts
│   ├── entidades/reporte-ventas.entidad.ts
│   ├── dto/
│   └── repositorios/

├── Endpoints:
│   POST /api/contabilidad/reportes/ventas/generar
│   GET  /api/contabilidad/reportes/ventas/:id
│   GET  /api/contabilidad/reportes/ventas
│   GET  /api/contabilidad/reportes/ventas/exportar/formato/:formato
```

---

### 5. Desglosar - Tareas Concretas

```
/gd:breakdown
```

**Qué hace el comando:**
- Divide el plan en tareas específicas
- Define orden de ejecución
- Identifica paralelismo posible
- Asigna criterios de aceptación

**Resultado esperado:**
```
📋 TAREA 1: Crear entidad ReporteVentaEntidad
   - Criteria: Entidad con campos tenant_id, periodo, datos JSON
   - Estimate: 1 hora
   - Dependencies: Ninguna
   - Status: pending

📋 TAREA 2: Crear DTOs (GenerarReporteDto, FiltrosDto)
   - Criteria: DTOs con validaciones class-validator
   - Estimate: 30 min
   - Dependencies: Tarea 1
   - Status: pending

📋 TAREA 3: Implementar servicio ReporteVentasService
   - Criteria: Métodos generarReporte(), exportarPDF(), exportarExcel()
   - Estimate: 4 horas
   - Dependencies: Tarea 2
   - Status: pending

... (continúa con más tareas)
```

---

### 6. Implementar - TDD Estricto

```
/gd:implement
```

**Qué hace el comando:**
- Activa modo TDD: RED → GREEN → REFACTOR
- Para cada tarea:
  1. Escribe el test primero (RED)
  2. Implementa hasta que pase (GREEN)
  3. Refactoriza el código (REFACTOR)
- Verifica coverage ≥ 85%

**Ejemplo de flujo:**
```typescript
// PRIMERO: Escribir el test (RED)
describe('ReporteVentasService', () => {
  it('debe generar reporte de ventas por período', async () => {
    const resultado = await service.generarReporte('2026-01', tenantId);
    expect(resultado).toHaveProperty('total');
    expect(resultado.clientes).toBeDefined();
  });
});

// LUEGO: Implementar (GREEN)
async generarReporte(periodo: string, tenantId: string) {
  const transacciones = await this.repo.find({
    where: { tenantId, periodo, tipo: 'venta' }
  });
  return this.calcularResumen(transacciones);
}

// FINAL: Refactorizar (REFACTOR)
- Extraer método calcularResumen()
- Agregar logger
- Documentar
```

---

### 7. Review - Peer Review Automático

```
/gd:review
```

**Qué hace el comando:**
-Ejecuta review en 7 dimensiones:
  1. Funcionalidad
  2. Tests
  3. Rendimiento
  4. Arquitectura
  5. Seguridad
  6. Mantenibilidad
  7. Documentación
- Verifica compliance con SPEC
- Detecta code smells

**Resultado esperado:**
```
🔍 REVISION AUTOMÁTICA - Módulo Reportes de Ventas

✅ Funcionalidad: 95%
   - Todos los escenarios de SPEC implementados
   - Faltan tests de edge cases

✅ Tests: 88%
   - Coverage: 88% (≥85% requerida)
   - Tests de integración pasando

⚠️ Seguridad: 85%
   - Falta sanitización en endpoint de exportación
   - Suggestion: Validar formato antes de procesar

✅ Arquitectura: 92%
   - SOLID aplicado correctamente
   - Patrones de NestJS seguidos

📝 Recomendaciones:
   - Agregar logs en método exportarPDF()
   - Documentar DTOs con Swagger
```

---

### 8. Verificar - Validar Contra Spec

```
/gd:verify
```

**Qué hace el comando:**
- Valida que la implementación coincide con SPEC
- Verifica que todas las tareas fueron completadas
- Confirma que los quality gates pasaron
- Ejecuta tests de regresión

**Resultado esperado:**
```
✅ SPEC Gate: PASSED
✅ TDD Gate: PASSED (coverage 88%)
✅ OWASP Gate: PASSED (0 vulnerabilidades)
✅ Architecture Gate: PASSED
✅ Docs Gate: PASSED

📋 Tareas completadas: 8/8
🎯 Estado: LISTO PARA DEPLOY
```

---

### 9. Archivar - Finalizar Cambio

```
/gd:archive
```

**Qué hace el comando:**
- Sincroniza delta specs a specs principales
- Archiva el cambio en registry
- Genera changelog automático
- Actualiza project.md con el nuevo estado

---

## Comandos de Análisis (Usados Durante el Proceso)

### Explorar Códigobase
```
/gd:explore "Buscar cómo están implementados los reportes en otros servicios"
```
- Escanea el codebase
- Identifica patrones existentes
- Encuentra referencias útiles

### Estimar Esfuerzo
```
/gd:estimate
```
- Usa 4 modelos de estimación:
  - Function Points
  - COCOMO
  - Planning Poker
  - Historical data

### Mesa Técnica (Análisis Multi-Perspectiva)
```
/gd:tech-panel
```
- Simula panel de expertos:
  - Tech Lead
  - Backend Developer
  - Frontend Developer
  - Architect

---

## Comandos de Razonamiento (15 Modelos)

### 5 Porqués - Análisis de Causa Raíz
```
/gd:razonar:5-porques "¿Por qué el reporte tarda 30 segundos en generarse?"
```

### Pre-mortem - Anticipar Fallos
```
/gd:razonar:pre-mortem "Antes de desplegar el módulo de reportes, ¿qué podría fallar en producción?"
```

### Pareto - Focus 80/20
```
/gd:razonar:pareto "¿Qué 20% de funcionalidades del módulo generan 80% del valor para el usuario?"
```

---

## Resumen de Comandos Disponibles

| Fase | Comando | Alias |
|------|---------|-------|
| Iniciar | `/gd:start` | `/gd:comenzar` |
| Especificar | `/gd:specify` | `/gd:especificar` |
| Clarificar | `/gd:clarify` | `/gd:clarificar` |
| Planificar | `/gd:plan` | `/gd:tech-plan`, `/gd:diseñar` |
| Desglosar | `/gd:breakdown` | `/gd:desglosar` |
| Implementar | `/gd:implement` | `/gd:aplicar` |
| Revisar | `/gd:review` | `/gd:auditar` |
| Verificar | `/gd:verify` | `/gd:validar` |
| Archivar | `/gd:archive` | `/gd:archivar` |

### Comandos de Análisis
- `/gd:explore` - Explorar codebase
- `/gd:estimate` - Estimar esfuerzo
- `/gd:roundtable` - Mesa-redonda multi-perspectiva
- `/gd:tech-panel` - Panel de expertos
- `/gd:security-audit` - Auditoría OWASP
- `/gd:poc` - Proof of Concept

### Modelos de Razonamiento
- `/gd:razonar:primeros-principios`
- `/gd:razonar:5-porques`
- `/gd:razonar:pareto`
- `/gd:razonar:inversion`
- `/gd:razonar:segundo-orden`
- `/gd:razonar:pre-mortem`
- `/gd:razonar:minimizar-arrepentimiento`
- `/gd:razonar:costo-oportunidad`
- `/gd:razonar:circulo-competencia`
- `/gd:razonar:mapa-territorio`
- `/gd:razonar:probabilistico`
- `/gd:razonar:reversibilidad`
- `/gd:razonar:rlm-verificacion`
- `/gd:razonar:rlm-cadena-pensamiento`
- `/gd:razonar:rlm-descomposicion`

---

## Notas

1. **Todos los comandos funcionan en OpenCode** - Son texto plano, no requieren configuración especial
2. **El Framework detecta complejidad automáticamente** - No todas las tareas necesitan las 6 fases completas
3. **TDD es obligatorio** - El comando `/gd:implement` enforce RED → GREEN → REFACTOR
4. **Los quality gates son bloqueantes** - No se puede avanzar sin pasar las verificaciones
5. **La memoria es persistente** - Usar `project.md` y `registry.md` para mantener estado

Para más información, consultar `AGENTS.md` en `~/.claude/gaf/AGENTS.md`
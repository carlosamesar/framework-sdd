# Plan ejecutable — evolución a Agentic Engineering en Framework-SDD

**Fecha:** 2026-04-15  
**Alcance:** repo Framework-SDD, comandos gd:*, orquestador, memoria, RAG, verify y CI

---

## 1. Diagnóstico actual

### Estado verificado

- **Madurez global del framework:** aproximadamente **4.0 / 5**
- **Madurez del catálogo gd:*:** **4.01 / 5**
- **Nivel operativo real:** **alto**, pero todavía **no plenamente agentic**

### Interpretación ejecutiva

El framework ya tiene una base muy sólida en:

- pipeline estructurado;
- validación y evidencia;
- smoke tests y gates;
- orquestación inicial;
- memoria y RAG funcionales.

El salto pendiente no es “tener más comandos”, sino lograr que el sistema sea:

1. **más autónomo**,
2. **más verificable**,
3. **más observable**,
4. **más gobernable en producción**.

---

## 2. Meta objetivo

### Objetivo a 30 días

Subir el framework desde un estado **operativo maduro** a un estado **agentic operacional**.

### Definición práctica de éxito

Se considerará alcanzado el objetivo cuando el framework pueda:

- tomar una tarea y enrutarla por el flujo gd sin ambigüedad;
- ejecutar validaciones reales antes de declarar cierre;
- dejar evidencia automática de cada fase;
- usar memoria y contexto recuperable entre sesiones;
- operar con guardrails claros y trazabilidad auditable.

### Meta de madurez

| Dimensión | Hoy | Meta 30 días |
|---|---:|---:|
| Pipeline y comandos gd | 4.0 | 4.5 |
| Verificación y evidencia | 4.1 | 4.8 |
| Runtime agentic | 4.3 | 4.7 |
| Memoria y RAG | 3.2 | 4.3 |
| Observabilidad y gobierno | 3.5 | 4.5 |
| **Promedio global** | **4.0** | **4.6+** |

---

## 3. Plan de trabajo ejecutable

## Fase 1 — Baseline y enforcement

**Prioridad:** P0  
**Duración sugerida:** 2 a 3 días

### Objetivo

Convertir la disciplina actual en un gate obligatorio y medible.

### Tareas

- endurecer el criterio de “no cierre sin evidencia” en todo el flujo gd;
- revisar que review, verify y close queden explícitamente encadenados;
- asegurar que la documentación y los prompts estén sincronizados;
- dejar evidencia inicial del estado real del framework.

### Comandos de ejecución

```bash
npm install
npm run framework:test
npm run react:smoke
npm run token:check
npm run memory:daemons:health
```

### Evidencia esperada

- salida verde de pruebas;
- smoke del runner ReAct operativo;
- gate de tokens aprobado;
- estado saludable de memoria/daemons.

### Criterio de terminado

- ningún flujo crítico gd puede declararse terminado sin verify;
- existe un reporte base de estado actual.

---

## Fase 2 — De comando guiado a ejecución autónoma segura

**Prioridad:** P0  
**Duración sugerida:** 5 días

### Objetivo

Hacer que los comandos gd pasen de orientación textual a ejecución controlada con salida verificable.

### Tareas

- reforzar los comandos que aún están en nivel operativo y no plenamente integrado;
- priorizar endurecimiento de doctor, gate, status, audit-trail y threshold;
- asegurar que cada comando devuelva:
  - objetivo,
  - acción,
  - evidencia,
  - siguiente paso;
- conectar mejor el catálogo gd con el orquestador central.

### Comandos de verificación

```bash
npm run orchestrator:test
npm run orchestrator:pipeline
npm run orchestrator:gd-catalog
```

### Entregables

- catálogo gd uniforme;
- menor variabilidad entre comandos;
- flujo de ejecución más predecible.

### Criterio de terminado

- los comandos priorizados quedan al menos en nivel maduro;
- el pipeline orquestado deja salidas consistentes y trazables.

---

## Fase 3 — Memoria operativa y contexto persistente

**Prioridad:** P1  
**Duración sugerida:** 4 días

### Objetivo

Evitar que el agente improvise o “olvide” decisiones relevantes entre tareas.

### Tareas

- definir qué memorias son obligatorias para cada tipo de trabajo;
- formalizar uso de memoria de sesión, repo y conocimiento base;
- endurecer el fallback local de RAG como comportamiento estándar;
- documentar cuándo el agente debe consultar memoria antes de actuar.

### Comandos de verificación

```bash
npm run rag:index
npm run rag:query
npm run rag:test
npm run memory:daemons:start
npm run memory:daemons:health
```

### Evidencia esperada

- retrieval funcional;
- salud de daemons validada;
- consultas útiles con contexto del repo.

### Criterio de terminado

- el agente recupera contexto técnico antes de decisiones importantes;
- la memoria ya no es opcional para flujos de alta complejidad.

---

## Fase 4 — Observabilidad, auditoría y gobierno

**Prioridad:** P1  
**Duración sugerida:** 4 días

### Objetivo

Poder responder con evidencia qué hizo el agente, por qué lo hizo y con qué resultado.

### Tareas

- consolidar logs por fase;
- enlazar ejecución con artefactos verificables;
- registrar fallos, retries y motivo de rechazo;
- definir un checklist estándar de auditoría para corridas gd.

### Comandos de verificación

```bash
npm run issue:evidence-smoke
npm run issue:retry-smoke
npm run framework:ci
```

### Entregables

- trazabilidad por fase;
- evidencia reutilizable para soporte y revisión;
- auditoría operativa repetible.

### Criterio de terminado

- toda ejecución crítica deja rastro auditable;
- soporte puede diagnosticar fallos sin reconstrucción manual.

---

## Fase 5 — Productivización controlada

**Prioridad:** P2  
**Duración sugerida:** 5 días

### Objetivo

Poner el framework en una modalidad realmente utilizable como sistema agentic en operación continua.

### Tareas

- validar el flujo completo en escenarios reales del equipo;
- fijar un conjunto de tareas piloto de principio a fin;
- documentar runbooks de operación y fallback;
- definir una política de uso: qué puede hacer el agente solo y qué requiere aprobación humana.

### Comandos de verificación

```bash
npm run framework:platform-smoke
npm run issue:smoke
npm run issue:config-smoke
```

### Criterio de terminado

- existe un piloto real ejecutado con evidencia;
- el marco de control humano queda definido.

---

## 4. Backlog priorizado inmediato

## P0 — esta semana

- endurecer verify-before-close en el flujo completo;
- subir comandos críticos a nivel maduro homogéneo;
- consolidar evidencia automática de ejecución;
- correr baseline y publicar resultados.

## P1 — siguiente semana

- hacer memoria/RAG parte del flujo estándar;
- mejorar observabilidad y auditoría;
- reducir diferencias entre comandos auxiliares.

## P2 — después

- productivizar con pilotos reales;
- cerrar brechas de gobierno y rollout.

---

## 5. Secuencia mínima recomendada de trabajo

Ejecutar en este orden:

1. correr baseline técnico;
2. corregir gaps del pipeline gd crítico;
3. endurecer verify y evidencia;
4. formalizar memoria y recuperación de contexto;
5. auditar observabilidad;
6. lanzar piloto controlado.

---

## 6. Checklist ejecutivo

- [ ] baseline del framework ejecutado
- [ ] smoke ReAct verificado
- [ ] tokens dentro de presupuesto
- [ ] memoria y RAG saludables
- [x] review y verify obligatorios
- [ ] comandos críticos endurecidos
- [ ] evidencia por fase disponible
- [ ] piloto real ejecutado

---

## 7. Conclusión

Framework-SDD **ya no está en fase conceptual**. Está en una etapa donde el siguiente salto depende de **enforcement, autonomía segura, memoria operativa y observabilidad**.

La recomendación es trabajar este plan en modo **P0 → P1 → P2**, con evidencia objetiva al cierre de cada fase. Ese camino es el más corto para convertir el framework en una plataforma de **agentic engineering real y gobernable**.

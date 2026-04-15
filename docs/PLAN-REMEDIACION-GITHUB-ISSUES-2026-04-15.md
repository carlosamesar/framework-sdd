# Plan de remediación priorizado — automatización con GitHub Issues

**Fecha:** 2026-04-15  
**Base:** evaluación operativa de la automatización de GitHub Issues en el framework SDD.

---

## Objetivo

Llevar la automatización actual desde un estado de **prototipo funcional parcial** a un estado **operativo, confiable y auditable** para uso real.

---

## Meta de madurez

| Horizonte | Meta | Nivel esperado |
|---|---|---|
| **Corto plazo** | Recuperar operatividad mínima | 3/5 |
| **Medio plazo** | Estabilizar y asegurar el flujo | 4/5 |
| **Largo plazo** | Productivizar con observabilidad y gobierno | 5/5 |

---

## Priorización general

| Prioridad | Acción | Impacto | Esfuerzo | Estado deseado |
|---|---|---:|---:|---|
| **P0** | Corregir autenticación, permisos y repositorio destino | Muy alto | Bajo-Medio | Flujo vuelve a operar |
| **P0** | Crear workflow real de GitHub Actions para eventos de issues | Muy alto | Medio | Automatización nativa por eventos |
| **P1** | Añadir pruebas smoke y validaciones end-to-end | Alto | Medio | Confianza operativa |
| **P1** | Persistir estado e idempotencia | Alto | Medio | Evitar reprocesos y duplicados |
| **P1** | Externalizar configuración y endurecer seguridad | Alto | Medio | Menor riesgo operacional |
| **P2** | Mejorar observabilidad, métricas y auditoría | Medio-Alto | Medio | Soporte productivo |
| **P2** | Eliminar duplicidades y simplificar scripts | Medio | Bajo | Mantenibilidad |

---

## Fase 0 — Contención inmediata

**Objetivo:** evitar ejecuciones inconsistentes mientras se corrige la base.

### Acciones

1. Declarar el flujo actual como **experimental** en la documentación.
2. Restringir su uso a modo manual o dry-run.
3. Evitar que usuarios dependan del resultado actual como proceso de producción.

### Entregable

- Mensaje de estado actualizado en la documentación principal y guía operativa.

---

## Fase 1 — Recuperar funcionamiento mínimo viable

**Prioridad:** **P0**  
**Objetivo:** hacer que el flujo pueda abrir y procesar issues reales de forma confiable.

### 1.1 Corregir autenticación y alcance del token

**Problema detectado:** las llamadas a GitHub devolvieron error 404 al listar o crear issues.

### Tareas

- validar que el repositorio objetivo existe y es accesible desde el token;
- confirmar permisos mínimos de `issues:write`, `contents:read` y, si aplica, `pull_requests:write`;
- revisar si el token pertenece al owner correcto y tiene acceso al repositorio privado o público correspondiente;
- centralizar la validación de credenciales al inicio del flujo.

### Criterio de éxito

- el sistema puede listar issues abiertos;
- el sistema puede crear un issue de prueba controlado;
- el sistema devuelve errores explícitos si faltan permisos.

---

### 1.2 Sustituir polling por workflow nativo de GitHub

**Problema detectado:** el runner actual usa polling en bucle infinito, lo cual no es ideal para producción.

### Tareas

- crear workflow en `.github/workflows/` para eventos `issues`, `issue_comment` o `workflow_dispatch`;
- definir filtros por labels, plantilla o comando disparador;
- ejecutar el runner solo cuando el issue cumpla condiciones válidas.

### Criterio de éxito

- un issue etiquetado correctamente dispara el flujo sin intervención manual;
- la ejecución deja trazabilidad en logs del workflow.

---

### 1.3 Validación previa de entorno

### Tareas

- comprobar token, repo, owner y presencia de variables requeridas al inicio;
- abortar de forma segura si falta configuración crítica;
- añadir modo dry-run oficial.

### Criterio de éxito

- el sistema falla rápido y con mensajes claros;
- no intenta operaciones destructivas si el entorno no es válido.

---

## Fase 2 — Estabilización operativa

**Prioridad:** **P1**  
**Objetivo:** evitar duplicados, mejorar confiabilidad y garantizar repetibilidad.

### 2.1 Persistencia de estado e idempotencia

**Problema detectado:** el runner actual guarda los issues procesados solo en memoria.

### Tareas

- sustituir el `Set()` en memoria por almacenamiento persistente;
- registrar `issue_number`, fecha, estado, último intento y resultado;
- impedir doble procesamiento del mismo issue;
- soportar reintentos controlados.

### Criterio de éxito

- reiniciar el proceso no causa duplicados;
- un issue ya procesado no vuelve a ejecutar el pipeline salvo acción explícita.

---

### 2.2 Pruebas automáticas específicas

### Tareas

- crear smoke tests del flujo de creación/listado/comentarios;
- agregar pruebas de regresión para permisos faltantes, body inválido y duplicados;
- integrar estas pruebas al pipeline CI.

### Criterio de éxito

- el pipeline valida la automatización antes de liberar cambios;
- existe cobertura mínima del flujo crítico.

---

### 2.3 Manejo de errores robusto

### Tareas

- clasificar errores por autenticación, permisos, red, rate limit y validación;
- añadir retries con backoff solo donde corresponda;
- mejorar mensajes de error y comentarios en issue.

### Criterio de éxito

- los errores son accionables;
- el sistema se recupera de fallos transitorios sin intervención manual innecesaria.

---

## Fase 3 — Seguridad y configuración gobernada

**Prioridad:** **P1**  
**Objetivo:** endurecer el flujo para operación segura y multi-entorno.

### 3.1 Externalización de configuración

### Tareas

- mover owner, repo, labels, ramas y reglas de activación a archivos de configuración o variables de entorno;
- evitar valores hardcodeados en scripts;
- separar configuración por entorno local, CI y producción.

### 3.2 Controles de acceso

### Tareas

- permitir ejecución solo para autores aprobados o labels autorizados;
- exigir plantilla mínima de issue para disparar automatización;
- registrar cada intento rechazado con motivo.

### Criterio de éxito

- solo issues válidos y autorizados activan el flujo;
- el comportamiento es consistente entre entornos.

---

## Fase 4 — Observabilidad y auditoría productiva

**Prioridad:** **P2**  
**Objetivo:** facilitar soporte, monitoreo y mejora continua.

### Tareas

- agregar logs estructurados por issue;
- medir duración, éxito, fallo y reintentos por ejecución;
- generar evidencias en carpeta de reportes o knowledge base;
- enlazar el resultado con la trazabilidad SDD.

### Criterio de éxito

- cada ejecución deja un rastro auditable;
- se puede responder quién ejecutó qué, cuándo y con qué resultado.

---

## Fase 5 — Simplificación y mantenibilidad

**Prioridad:** **P2**  
**Objetivo:** reducir deuda técnica.

### Tareas

- unificar [scripts/auto-issue-runner.cjs](scripts/auto-issue-runner.cjs) y [scripts/auto-issue-runner.js](scripts/auto-issue-runner.js);
- definir una sola entrada oficial para automatización de issues;
- documentar el flujo operativo y el procedimiento de soporte.

### Criterio de éxito

- existe una implementación única, clara y soportada.

---

## Orden recomendado de ejecución

### Sprint 1

1. Corregir token/permisos/repositorio
2. Crear workflow real en GitHub Actions
3. Añadir validación de entorno y dry-run

### Sprint 2

4. Persistencia de estado e idempotencia
5. Tests smoke y regresión
6. Manejo robusto de errores

### Sprint 3

7. Externalizar configuración
8. Endurecer reglas de acceso
9. Añadir observabilidad y reportes

### Sprint 4

10. Simplificación final y documentación operativa

---

## Indicadores de éxito

| Indicador | Meta mínima |
|---|---:|
| Issues procesados sin error | ≥ 95% |
| Duplicados por reinicio | 0 |
| Tiempo de diagnóstico de fallo | < 15 min |
| Cobertura de flujo crítico | ≥ 80% |
| Tiempo de disparo desde issue | < 2 min |

---

## Recomendación final

La remediación debe comenzar por **P0**: acceso real a GitHub y activación nativa mediante workflows. Sin eso, cualquier mejora posterior seguirá apoyándose en una base no operativa.

Una vez superado ese punto, el siguiente foco debe ser **idempotencia + pruebas + observabilidad**, que son los tres elementos que convierten una demo en un servicio confiable.

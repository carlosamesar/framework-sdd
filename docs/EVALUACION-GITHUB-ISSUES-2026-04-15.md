# Evaluación de automatización con GitHub Issues

**Fecha:** 2026-04-15  
**Repositorio evaluado:** framework-sdd  
**Objetivo:** determinar el nivel de madurez y funcionalidad real de la automatización basada en GitHub Issues.

---

## Resumen ejecutivo

**Veredicto:** la automatización existe como **prototipo funcional parcial**, pero **no está madura para producción** en su estado actual.

### Nivel de madurez estimado

**Nivel 2 de 5 — Prototipo funcional**

Esto significa que:
- hay componentes implementados para crear/listar issues y disparar flujos;
- existe una intención clara de orquestación SDD desde tickets;
- pero faltan hardening, wiring real de GitHub, pruebas específicas, observabilidad e idempotencia.

---

## Evidencia revisada

### Componentes existentes

- `packages/sdd-ticket-management/index.cjs`
  - expone `createIssue`, `updateIssue`, `listIssues` usando Octokit.
- `bin/gd-create-issue.cjs`
  - script de ejemplo para crear un issue.
- `bin/gd-orchestrate.cjs`
  - ejemplo de orquestación que valida SDD, crea ticket y delega tareas.
- `scripts/auto-issue-runner.cjs`
  - polling cada 60 segundos de issues abiertos y comentario automático.
- `scripts/auto-issue-runner.js`
  - duplicado funcional del archivo anterior.

### Validación operativa realizada

#### 1. Consulta read-only a GitHub Issues
Resultado:
- **falló con 404 Not Found** al listar issues del repo.

#### 2. Ejecución del orquestador
Resultado:
- el flujo llegó al intento de crear issue en GitHub;
- **falló con 404 Not Found** en `POST /repos/carlosamesar/framework-sdd/issues`.

#### 3. Integración GitHub Actions / workflows
Resultado:
- **no se encontró carpeta `.github/` ni workflows activos** en el workspace evaluado.
- por tanto, la automatización no está conectada de forma nativa a eventos reales de GitHub.

#### 4. Cobertura de pruebas
Resultado:
- **no se encontraron tests dedicados** para la automatización de issues, ticketing u orquestación GitHub.

---

## Evaluación por dimensión

| Dimensión | Estado | Observación |
|---|---|---|
| Creación/listado de issues | Parcial | API wrapper simple con Octokit |
| Disparo automático desde issue | Parcial | existe runner por polling, no workflow real |
| Integración end-to-end | Fallando | la creación real de issues devuelve 404 |
| Seguridad/configuración | Básica | depende de `GITHUB_TOKEN`, sin validaciones robustas |
| Idempotencia | Baja | usa `Set()` en memoria; se pierde al reiniciar |
| Observabilidad | Baja | pocos logs, sin métricas ni dashboard |
| Pruebas automáticas | Baja | sin test suite específica |
| Preparación para producción | Baja | no hay webhooks/workflows activos |

---

## Hallazgos clave

### Fortalezas

1. La arquitectura conceptual está clara y alineada con el framework SDD.
2. Existe separación modular entre:
   - gestión SDD,
   - ticketing,
   - delegación,
   - mensajería.
3. Los scripts son comprensibles y permiten una demostración rápida.

### Debilidades

1. **No hay integración real con GitHub Actions/webhooks** en el repositorio evaluado.
2. **La ejecución real falla** al intentar operar contra GitHub Issues.
3. El runner usa **polling infinito** en vez de eventos nativos de GitHub.
4. Hay **configuración hardcodeada** de owner/repo.
5. No existe persistencia real del estado procesado.
6. No hay retries, cola, lock distribuido ni control de concurrencia.
7. No hay tests de regresión ni smoke tests específicos del flujo GitHub Issues.

---

## Diagnóstico final

### Funcionalidad actual

**Sí funciona a nivel de estructura y código base**, pero solo como base inicial o demo técnica.

### Madurez real

**Madurez media-baja**. No es todavía una automatización operativa confiable para producción.

---

## Recomendaciones prioritarias

### Prioridad alta

1. Crear workflows reales en GitHub Actions para eventos de `issues`, `issue_comment` o `workflow_dispatch`.
2. Corregir autenticación/permisos/repositorio destino para eliminar el error 404.
3. Añadir tests automáticos del flujo de ticketing.
4. Sustituir el `Set()` en memoria por persistencia real.

### Prioridad media

5. Externalizar owner/repo/labels a configuración.
6. Añadir retries con backoff, timeout y manejo de rate limit.
7. Agregar trazabilidad y métricas por issue procesado.

### Prioridad baja

8. Unificar `auto-issue-runner.js` y `auto-issue-runner.cjs`.
9. Añadir un modo dry-run formal para auditorías seguras.

---

## Conclusión

La automatización con GitHub Issues en `framework-sdd` está en **fase prototipo**. Tiene una base útil y modular, pero **todavía no alcanza un nivel de madurez productivo** por fallos de integración real, ausencia de workflows y falta de pruebas específicas.

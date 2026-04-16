# Plan de trabajo secuencial — piloto controlado agentic

**Fecha:** 2026-04-16  
**Objetivo:** iniciar el tramo final hacia operación controlada y acercamiento a 5.0

---

## Secuencia de ejecución

### Paso 1 — Validar plataforma base
**Objetivo:** confirmar que el framework sigue sano antes del piloto.

**Comando:**
```bash
npm run framework:platform-smoke
```

**Criterio de salida:**
- framework OK
- ReAct smoke OK

---

### Paso 2 — Validar configuración del flujo de issues
**Objetivo:** confirmar que la configuración del flujo controlado es usable.

**Comando:**
```bash
npm run issue:config-smoke
```

**Criterio de salida:**
- configuración válida
- rutas y parámetros mínimos correctos

---

### Paso 3 — Validar evidencia y reintentos
**Objetivo:** asegurar trazabilidad y manejo de fallos.

**Comandos:**
```bash
npm run issue:evidence-smoke
npm run issue:retry-smoke
```

---

### Paso 4 — Ejecutar piloto controlado
**Objetivo:** correr el flujo en modo seguro sin pérdida de control humano.

**Comando sugerido:**
```bash
npm run issue:dry-run
```

---

### Paso 5 — Cierre y reporte
**Objetivo:** registrar evidencia y decisión de siguiente iteración.

**Entregables esperados:**
- reporte del piloto
- estado final
- próximos riesgos y acciones

---

## Estado actual

- Paso 1: completado
- Paso 2: completado
- Paso 3: completado
- Paso 4: iniciado y verificado en modo controlado dry-run
- Paso 5: pendiente de cierre operativo final

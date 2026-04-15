# Actualización Operativa — Endurecimiento de `/gd:start`

**Fecha**: 2026-04-15  
**Estado**: Aplicado y verificado

---

## Resumen

Se endureció el comportamiento del comando `/gd:start` para reducir ambigüedad, evitar búsquedas innecesarias y forzar una ejecución más precisa sobre la estructura real de los proyectos GoodERP.

---

## Cambios principales

### 1. Frontend estricto

Cuando el trabajo pertenece a Angular:
- se usa la estructura real de `develop/frontend/gooderp-client`;
- se identifica la ruta exacta antes de implementar;
- se obliga a seguir el patrón espejo de `modules/`, `features/`, `shared/`, `core/` o `component/`.

### 2. Backend estricto

Cuando el trabajo pertenece a backend:
- se usa la estructura real de `develop/backend/gooderp-orchestation`;
- las Lambdas HTTP se resuelven primero dentro de `lib/lambda/**`;
- se refuerzan CORS, API Gateway, AWS deploy y certificación funcional.

### 3. Routing directo por endpoint

Si el prompt menciona un endpoint como:
- `/api/v1/sedes`
- `https://4j950zl6na.execute-api.us-east-1.amazonaws.com/dev/api/v1/sedes`

el flujo debe abrir primero la Lambda correspondiente, por ejemplo:
- `/api/v1/sedes` → `lib/lambda/core/fnSede/`

### 4. Cambios transversales

Si el requerimiento impacta varias capas a la vez, el cambio se reclasifica como **fullstack transversal**.

El orden obligatorio es:
1. BD
2. backend / consumos
3. frontend / integración
4. certificación

---

## Certificación obligatoria

La certificación ya no es opcional ni parcial. Debe incluir:
- pruebas unitarias;
- pruebas de consumos backend;
- validación de integración frontend;
- Playwright E2E del flujo afectado.

Sin esta cadena, el cambio no puede declararse como certificado.

---

## Artefactos actualizados

- `README.md`
- `docs/INDICE-DOCUMENTACION-FRAMEWORK.md`
- `docs/COMANDOS-GD-CREADOS.md`
- `docs/GUIA-DESARROLLADORES.md`
- `project.md`
- `registry.md`
- `.claude/commands/gd/start.md`
- `.claude/commands/gd/start-frontend.md`
- `.claude/commands/gd/start-backend.md`
- `openspec/config.yaml`

---

## Resultado esperado

A partir de esta actualización, el framework debe responder con:
- menos exploración innecesaria;
- más precisión por stack;
- secuencia correcta en cambios transversales;
- certificación técnica y funcional completa.

# /gd:start-backend — Inicio Estricto para Backend GoodERP Orchestation

## Propósito
Iniciar tareas de backend con contexto real del proyecto `develop/backend/gooderp-orchestation`, obligando a trabajar sobre la estructura existente de Lambdas y servicios NestJS, con despliegue AWS y certificación funcional en mente desde el inicio.

---

## Proyecto objetivo obligatorio

- Proyecto: `develop/backend/gooderp-orchestation`
- Lambdas: `lib/lambda/**`
- Microservicios: `servicio-**`
- API Gateway base para Lambdas: `https://4j950zl6na.execute-api.us-east-1.amazonaws.com/dev/api/v1/`
- Despliegue guía: `lib/lambda/INICIO-RAPIDO.md`

## Preparación Git obligatoria

Antes de implementar en el repo backend:
- identificar la rama base correspondiente del equipo;
- crear una rama `fix/<slug-del-cambio>`;
- trabajar exclusivamente en esa rama;
- dejar el PR listo hacia la rama base correcta antes de cerrar o liberar.

Ejemplo:

```bash
git checkout microservicios
git pull
git checkout -b fix/ajuste-endpoint-sedes
```

---

## Mapa real del backend

```text
gooderp-orchestation/
├── lib/lambda/                 Lambdas por dominio con router HTTP y utils compartidas
├── servicio-contabilidad/      microservicio NestJS
├── servicio-tesoreria/         microservicio NestJS
├── servicio-core/
├── servicio-inventarios/
├── servicio-logistica/
├── servicio-nomina/
├── servicio-parqueaderos/
├── servicio-reportes/
├── servicio-saga/
├── servicio-transacciones/
├── lambda-deploy/              soporte de despliegue
├── terraform/                  infraestructura AWS
├── scripts/                    utilidades operativas y validación
└── tests/                      validación y evidencia
```

---

## Regla de clasificación obligatoria

Antes de implementar, el pedido DEBE clasificarse en una sola vía principal:

| Tipo de cambio | Ubicación correcta |
|---|---|
| CRUD/API Lambda expuesta | `lib/lambda/<dominio>/fn<Nombre>/` |
| Handler HTTP faltante | `handlers/create.mjs`, `list.mjs`, `getById.mjs`, `update.mjs`, `delete.mjs` |
| CORS / Response / sanitización | `utils/responseBuilder.mjs`, `utils/sanitization.mjs`, `index.mjs` |
| Lógica de negocio NestJS | `servicio-<nombre>/src/<modulo>/` |
| Guardas/decoradores multi-tenant | `servicio-<nombre>/src/common/` |
| Despliegue o AWS | `scripts/`, `lambda-deploy/`, `terraform/` |
| Certificación funcional | reportes, scripts de prueba y evidencia del servicio afectado |

---

## Reglas estrictas de ejecución

- NO crear lambdas fuera del patrón `lib/lambda/<dominio>/fn<NombreCamelCase>/`.
- NO crear microservicios fuera del patrón `servicio-<nombre>/src/**`.
- SIEMPRE buscar primero una lambda o servicio espejo existente y seguir ese diseño.
- En Lambdas expuestas por API Gateway, revisar obligatoriamente `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`.
- `OPTIONS` debe resolverse primero y CORS debe quedar habilitado en todos los métodos y respuestas.
- Si el requerimiento implica CRUD y falta un método, debe completarse siguiendo el patrón real.
- Usar `ResponseBuilder` para respuestas de Lambdas, nunca respuestas crudas.
- Extraer `tenant_id` desde JWT con `extractTenantId()` o `@TenantId()`, nunca desde body o params del usuario.
- En NestJS, seguir `JwtTenantGuard` global, módulos, controladores, servicios, entidades y DTOs ya existentes.
- Si el cambio requiere migración SQL, esta debe ejecutarse con **Node.js** usando la configuración del archivo `.env` ya mapeado dentro de la solución.
- No usar como vía principal ejecuciones manuales ad hoc fuera del repositorio para aplicar cambios de esquema.
- Considerar desde el inicio si el cambio requiere despliegue AWS, validación sobre API Gateway y certificación funcional.

## Resolución directa por URL o endpoint

Si el requerimiento incluye una URL o path de API Gateway como:
- `https://4j950zl6na.execute-api.us-east-1.amazonaws.com/dev/api/v1/sedes`
- `/api/v1/sedes`

el análisis DEBE:
1. extraer el recurso final (`sedes`);
2. asumir primero que se trata de una **Lambda HTTP** y no de un servicio NestJS;
3. buscar **solo dentro de `lib/lambda/**`** como primera vía;
4. abrir primero el folder espejo correspondiente y revisar `index.mjs`, `handlers/` y `utils/`;
5. ampliar la búsqueda al resto del repo solo si la ruta no existe o si el problema apunta explícitamente a infraestructura compartida.

### Ejemplos de resolución rápida

- `/api/v1/sedes` → `lib/lambda/core/fnSede/`
- `/api/v1/empresas` → `lib/lambda/core/fnEmpresa/`
- `/api/v1/usuarios` → `lib/lambda/core/fnUsuario/`
- `/api/v1/terceros` → `lib/lambda/terceros/fnTercero/`

> Para un error 500 en `/sedes`, el punto de entrada correcto es `lib/lambda/core/fnSede/` y no una búsqueda global por todo el proyecto.

---

## Patrón de precisión obligatorio

La salida de inicio DEBE incluir:

```text
🎯 Stack: backend
📁 Proyecto: develop/backend/gooderp-orchestation
🧩 Tipo: [lambda | nestjs | aws-deploy | certificacion]
📍 Ruta exacta: [path real]
🪞 Patrón espejo: [lambda o servicio existente]
🌐 Endpoint base: https://4j950zl6na.execute-api.us-east-1.amazonaws.com/dev/api/v1/
🔀 Métodos a revisar: [GET|POST|PUT|DELETE|OPTIONS]
🚦 Decisión: [implementar | clarificar primero]
```

Si no se puede llenar con precisión, se debe pedir una sola aclaración concreta antes de tocar código.

---

## Anti-patrones prohibidos

- responder con una solución genérica de Node o NestJS sin aterrizarla al repo real;
- omitir `OPTIONS` o dejar CORS parcial en una lambda HTTP;
- cambiar solo un método y olvidar el resto del CRUD requerido;
- crear utilidades paralelas cuando ya existen `ResponseBuilder`, `sanitization`, guards o decoradores;
- cerrar el trabajo sin considerar despliegue AWS ni certificación funcional cuando el cambio lo exige.

---

## Cierre esperado

Cuando el cambio sea funcionalmente relevante, el flujo debe dejar previsto:
- despliegue o validación sobre AWS;
- prueba contra el endpoint real o entorno controlado;
- evidencia de certificación funcional.

## Certificación obligatoria

La certificación siempre debe incluir, según la capa impactada:
- pruebas unitarias;
- pruebas de backend/consumos al endpoint o lambda;
- validación de integración con frontend;
- Playwright E2E del flujo completo.

Sin esta cadena de verificación, no se debe considerar el cambio como terminado ni certificado.

---

## Siguiente paso

Una vez fijada la ubicación exacta:
- cambio pequeño y claro → `/gd:implement`
- cambio con riesgo o alcance medio/alto → `/gd:specify` → `/gd:clarify` → `/gd:plan`

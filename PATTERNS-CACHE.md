# PATTERNS-CACHE

Uso: referenciar o copiar y adaptar. No reexplicar patrones maduros si este archivo resuelve la duda.

## 1) extractTenantId
```js
export function extractTenantId(event = {}) {
  const claims = event.requestContext?.authorizer?.claims ?? event.claims ?? {};
  return claims['custom:tenant_id'] ?? event.tenant_id ?? null;
}
```
Regla: JWT primero. Nunca leer tenantId desde body, query o params.

## 2) Lambda response builder
```js
return buildResponse(200, { ok: true, data });
return buildResponse(400, { ok: false, message, details });
```
Regla: no devolver respuestas crudas.

## 3) API Gateway router
```js
switch (method) {
  case 'OPTIONS': return corsResponse();
  case 'GET': return handleGet(event);
  case 'POST': return handlePost(event);
  case 'PUT': return handlePut(event);
  case 'DELETE': return handleDelete(event);
  default: return buildResponse(405, { ok: false, message: 'Method not allowed' });
}
```
Regla: cubrir GET, POST, PUT, DELETE y OPTIONS con CORS coherente.

## 4) NestJS tenant guard
```ts
@UseGuards(JwtTenantGuard)
@Get()
findAll(@TenantId() tenantId: string) {
  return this.service.findAll(tenantId);
}
```
Regla: el tenant siempre sale del JWT.

## 5) TDD mínimo
1. Escribir prueba RED.
2. Implementar cambio mínimo GREEN.
3. Refactorizar sin romper pruebas.

## 6) Deploy Lambda ZIP
1. identificar lambdaPath
2. empaquetar ZIP
3. desplegar con GitHub Actions o AWS CLI
4. validar smoke test

# AGENTS.md — Ultra-Light Index

Toda acción debe pasar por el orquestador SDD y dejar evidencia verificable.

## 6 reglas de hierro
1. TDD: RED → GREEN → REFACTOR.
2. `tenantId` solo desde JWT (`custom:tenant_id`).
3. Reutilizar patrones maduros: `fnTransaccionLineas` y `servicio-tesoreria`.
4. Código dentro de `develop/`; en Lambdas usar ResponseBuilder + GET/POST/PUT/DELETE/OPTIONS + CORS.
5. Evidencia antes que afirmaciones; no existe PASS parcial.
6. Implementar en rama `fix/*` y cerrar con PR.

## Flujo obligatorio
`/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:release → /gd:deploy → /gd:archive`

## Carga mínima recomendada
- base: este archivo + archivo del agente;
- auth: `.agents-core/multi-tenant.md`;
- lambda: `.agents-core/lambdas-pattern.md`;
- nest: `.agents-core/nestjs-pattern.md`;
- testing: `.agents-core/testing-rules.md`;
- saga: `.agents-core/saga-pattern.md`;
- snippets: `PATTERNS-CACHE.md`;
- comandos: `COMMANDS-INDEX.md` y luego solo el comando específico;
- dudas puntuales: `npm run rag:query -- "pregunta"`.

## Reglas operativas
- si la tarea es ambigua, enrutar primero por `/gd:start`;
- no declarar completado sin pruebas o validación real;
- `CONSUMO.md` y `EVIDENCE.md` son obligatorios cuando el cambio impacta entrega;
- no inventar arquitectura paralela si ya existe patrón espejo en el repo.

## Referencias de dominio
- Lambda madura: `lib/lambda/transacciones/fnTransaccionLineas/`
- NestJS maduro: `servicio-tesoreria/src/`
- Lambdas API Gateway: cubrir métodos completos y CORS.
- Cognito NestJS: `us-east-1_gmre5QtIx`
- Cognito Lambdas: `us-east-1_fQl9BKSxq`

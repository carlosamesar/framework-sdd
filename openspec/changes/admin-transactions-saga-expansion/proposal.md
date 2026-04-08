# Proposal: SAGA — Admin Transaction Types Expansion

## Estado

DRAFT — alineado con `design.md` y `specs/saga/spec.md`.

## Intención

Extender el orquestador de transacciones unificadas para soportar cuatro tipos administrativos nuevos (**Ingreso/Egreso Administrativo General** y **Ingreso/Egreso Administrativo Contable**), con activación condicional del dominio Contabilidad y extracción de `tenant_id` canónica (prioridades 1–4) en lambdas hijas invocadas sin authorizer JWT.

## Alcance

- Guard en orquestador: omitir paso Contabilidad para tipos “General”; ejecutarlo para tipos “Contable”.
- Sustituir `extractTenantId` no canónico por copia literal desde `fnTransaccionLineas` en las lambdas hijas en alcance del change.
- Sin nuevas tablas ni nuevas lambdas de dominio; respuestas con `ResponseBuilder` canónico.

## Fuera de alcance

- Refactor a módulo compartido único de `extractTenantId` (explícitamente excluido por AGENTS.md para este enfoque).
- Cambios de contratos certificados sin rutas de compatibilidad.

## Riesgos

- Regresión en flujos SAGA existentes si el guard de tipo no cubre todos los códigos de `tipo_transaccion`.
- Invocaciones Step Functions sin JWT: deben seguir propagando `tenant_id` en body.

## Criterios de aceptación (resumen)

- Escenarios R1–R8 de `specs/saga/spec.md` verificables en implementación y pruebas.
- Cero fuga de datos entre tenants; rollback coherente ante fallo de dominio.

## Aprobación

Revisión técnica → estado APPROVED en frontmatter del spec antes de considerar IMPL completo.

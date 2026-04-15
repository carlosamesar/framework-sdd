# /gd:deploy — Despliegue AWS Estricto con Gates de Release y Cero Errores

## Propósito
Automatizar y validar despliegues de microservicios y funciones en AWS bajo un criterio severo de readiness. Este comando no debe desplegar por intuición: solo puede avanzar cuando el change ya pasó review, verify, close documental y está listo operativamente.

---

## ¿Cuándo usar?
- Al desplegar nuevas versiones de microservicios o funciones.
- Para validar infraestructura como código (IaC) y pipelines de despliegue.
- Antes de pasar a producción o ambientes de QA/staging.
- Solo cuando el cambio ya tiene evidencia suficiente de calidad y rollback preparado.

---

## Prerrequisitos obligatorios

- `/gd:review` = `PASS`
- `/gd:verify` = `VERIFY PASS`
- `/gd:close` = `READY FOR ARCHIVE` o readiness operativo equivalente
- build, lint y pruebas aplicables en verde
- variables de entorno, permisos IAM, CORS, multi-tenant y healthchecks validados
- rollback definido y documentado

Si alguno falla, el despliegue debe bloquearse.

---

## Funcionamiento
1. Analiza el contexto del proyecto y la configuración AWS (CloudFormation, CDK, Terraform, serverless.yml, etc).
2. Valida readiness técnico, seguridad, health checks y consistencia del artefacto.
3. Sugiere o ejecuta despliegues en AWS Lambda, ECS, ECR y ALB.
4. Verifica seguridad, permisos IAM, variables de entorno, multi-tenant, observabilidad y escalabilidad.
5. Confirma plan de rollback y evidencia post-deploy.
6. Reporta estado final y deja trazabilidad operativa.

## Flujo real para Lambda ZIP en GitHub Actions

Para Lambdas Node.js, el flujo estándar queda integrado así:
- `actions/setup-node@v4` con Node 20;
- `npm ci` para instalar dependencias;
- `npm run build` solo si el proyecto o lambda lo requiere;
- empaquetado ZIP mediante `scripts/package-lambda-zip.mjs`;
- autenticación segura con `aws-actions/configure-aws-credentials@v4`;
- despliegue con `aws lambda update-function-code`.

El workflow canónico del repo es `.github/workflows/deploy-post-merge.yml`.

---

## Quality Gates de Deploy

No se debe desplegar si:
- hay errores de compilación o pruebas en rojo;
- existe cualquier BLOCKER de seguridad o contratos API;
- faltan variables de entorno, secrets, permisos o health checks;
- no existe rollback definido;
- la documentación operativa no coincide con el artefacto real.

---

## Ejemplo de uso
```text
/gd:deploy --target lambda --function transaccionesHandler
/gd:deploy --target ecs --service gooderp-api --image latest
/gd:deploy --validate --env staging
```

---

## Integración
- Usar después de `/gd:release` o con readiness equivalente ya aprobado.
- Compatible con despliegues automatizados y manuales.
- Documenta resultados, rollback y validaciones post-deploy en la evidencia del change.

---

## Resultado esperado

```markdown
## Deployment Readiness
**Target**: lambda | ecs
**Estado**: DEPLOY APPROVED | BLOCKED

### Gates
- Review: PASS
- Verify: PASS
- Close: READY FOR ARCHIVE
- Rollback: definido
- Post-deploy checks: OK

### Decisión
- Si todo está verde → desplegar
- Si existe cualquier riesgo crítico → BLOCKED
```

---

## Notas
- Soporta despliegue seguro, rollback y validación post-deploy.
- Puede integrarse con GitHub Actions, CodePipeline u otros pipelines IaC.
- Ideal para microservicios multi-tenant y arquitecturas serverless con criterio productivo alto.

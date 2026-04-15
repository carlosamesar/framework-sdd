# GitHub Actions + AWS Lambda ZIP — Guía Operativa

Guía rápida para dejar operativo el workflow de despliegue AWS por ZIP en el repo y validarlo de forma manual con `workflow_dispatch`.

---

## 1. Qué workflow usa el repo

El workflow canónico es:
- `.github/workflows/deploy-post-merge.yml`

Este flujo:
1. prepara Node.js 20;
2. ejecuta `npm ci`;
3. compila si existe script `build`;
4. empaqueta la lambda con `scripts/package-lambda-zip.mjs`;
5. autentica contra AWS;
6. ejecuta `aws lambda update-function-code`.

---

## 2. Importante sobre `.env`

Tener variables en el archivo `.env` local **sirve para pruebas locales y scripts Node del workspace**, pero **GitHub Actions no lee automáticamente tu `.env` local**.

Para que el workflow despliegue desde GitHub, los valores deben existir como:
- **Repository Secrets**, o
- **Environment Secrets** (`staging` / `production`).

---

## 3. Secrets requeridos

### Opción recomendada — OIDC

Configurar:
- `AWS_LAMBDA_DEPLOY_ROLE_ARN`

Opcional:
- `AWS_REGION`

Ventaja:
- no se guardan access keys permanentes en GitHub.

### Opción alternativa — Access Keys

Configurar:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (recomendado, aunque el workflow acepta `us-east-1` por defecto)

---

## 4. Dónde configurarlos en GitHub

Ruta sugerida:
1. abrir el repositorio en GitHub;
2. ir a **Settings**;
3. entrar a **Secrets and variables** → **Actions**;
4. crear los secrets anteriores.

Si quieres separar por ambiente:
1. ir a **Settings** → **Environments**;
2. crear `staging` y/o `production`;
3. definir allí los mismos secrets.

---

## 5. Cómo probar el workflow manualmente

### Desde la UI de GitHub

1. Ir a la pestaña **Actions**.
2. Abrir el workflow **AWS Lambda ZIP Deploy**.
3. Pulsar **Run workflow**.
4. Seleccionar la rama deseada.
5. Completar los inputs.

### Inputs esperados

- `lambda_path`: ruta relativa a la lambda dentro del repo
- `function_name`: nombre exacto de la función en AWS Lambda
- `aws_region`: región objetivo, por ejemplo `us-east-1`
- `target_environment`: `staging` o `production`

### Ejemplo real

- `lambda_path`: `develop/backend/gooderp-orchestation/lib/lambda/core/fnSede`
- `function_name`: `fnSede`
- `aws_region`: `us-east-1`
- `target_environment`: `staging`

---

## 6. Validación local previa recomendada

Antes de disparar el workflow, conviene validar localmente:

```bash
node scripts/package-lambda-zip.mjs --lambda-path develop/backend/gooderp-orchestation/lib/lambda/core/fnSede --output tmp/fnSede-deploy.zip
node bin/gd-deploy.js --target lambda --function fnSede --lambda-path develop/backend/gooderp-orchestation/lib/lambda/core/fnSede --env AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,AWS_REGION
```

Esto confirma:
- que la lambda se puede empaquetar correctamente;
- que el plan de deploy esperado por el framework está bien resuelto.

---

## 7. Reglas de seguridad

- No commitear secretos en `.env`, YAML o scripts.
- No copiar access keys dentro del repo.
- Preferir OIDC cuando GitHub y la cuenta AWS ya estén preparados.
- Mantener `production` con aprobación manual vía GitHub Environments si aplica.

---

## 8. Relación con el flujo gd

- `/gd:start` debe identificar la ruta real de la lambda y el nombre de función AWS.
- `/gd:review` y `/gd:verify` deben pasar antes del despliegue.
- `/gd:deploy` usa este workflow como camino canónico para Lambdas ZIP.

---

## 9. Checklist rápido

- [ ] Lambda path identificado
- [ ] Function name validado
- [ ] Secrets configurados en GitHub
- [ ] `npm ci` funcional
- [ ] ZIP generado localmente o en CI
- [ ] `aws lambda update-function-code` autorizado por IAM
- [ ] post-deploy checks definidos

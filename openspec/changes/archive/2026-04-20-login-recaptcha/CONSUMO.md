# CONSUMO — login-recaptcha

## Descripción

Integración de reCAPTCHA v3 (invisible, score-based) en el formulario de login de gooderp-client. El token se obtiene en background al hacer submit — no hay widget visible para el usuario.

## Contrato de uso

### Flujo en runtime

1. El usuario completa email + contraseña y hace submit.
2. `LoginComponent.onSubmit()` llama `executeRecaptcha()` que invoca `ReCaptchaV3Service.execute('login')`.
3. Google retorna un token v3 (string). Este se asigna a `captchaToken`.
4. Se procede con `AuthService.login(email, password)`.
5. Si el login falla, `captchaToken` se resetea a `null`.

### Badge visual

Google reCAPTCHA v3 muestra un badge en la esquina inferior derecha de la página. Es un requisito legal de Google y no debe ocultarse.

```css
/* styles.scss global — no mover ni eliminar */
.grecaptcha-badge {
  visibility: visible !important;
}
```

## Configuración requerida

### Variables de entorno

| Variable | Archivo | Valor |
|----------|---------|-------|
| `recaptchaSiteKey` | `environment.ts` / `environment.prod.ts` | Site key v3 de Google reCAPTCHA |

### Provider de inyección

`RECAPTCHA_V3_SITE_KEY` debe estar registrado en **`app.config.ts`** (nivel raíz), no en el componente:

```typescript
// app.config.ts
import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';
import { environment } from '../environments/environment';

providers: [
  { provide: RECAPTCHA_V3_SITE_KEY, useValue: environment.recaptchaSiteKey }
]
```

### Dominio autorizado

El site key debe tener registrado el dominio en la consola de Google reCAPTCHA:
- `localhost` (desarrollo)
- Dominio de producción (e.g. `app.thegooderp.com`)

## Dependencias externas

- `ng-recaptcha@13.2.1` (instalado con `--legacy-peer-deps`)
- Google reCAPTCHA v3 API: `www.google.com/recaptcha/api.js`

## Notas de uso

- El site key `6LfXK...` es v3 (score-based). Usar un site key v2 causa el error `"El tipo de clave no es válido"`.
- `ReCaptchaV3Service` es un singleton raíz — requiere `RECAPTCHA_V3_SITE_KEY` en el injector raíz, no en providers del componente.
- En tests, mockear `ReCaptchaV3Service` con `{ execute: () => of('fake-token') }` y proveer `RECAPTCHA_V3_SITE_KEY` con `'test-site-key'`.

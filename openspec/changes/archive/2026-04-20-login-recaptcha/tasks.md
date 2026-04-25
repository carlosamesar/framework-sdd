# Tasks — login-recaptcha

## Phase 1: Setup

- [x] 1.1 Instalar `ng-recaptcha` con `--legacy-peer-deps`
- [x] 1.2 Crear rama `fix/login-recaptcha`

## Phase 2: Implementation

- [x] 2.1 Agregar `recaptchaSiteKey` a `environment.ts`
- [x] 2.2 Importar `RecaptchaModule` en `login.component.ts`
- [x] 2.3 Agregar propiedad `captchaToken` y `recaptchaSiteKey`
- [x] 2.4 Agregar métodos `onCaptchaResolved` y `onCaptchaExpired`
- [x] 2.5 Agregar guard `!captchaToken` en `onSubmit`
- [x] 2.6 Reset `captchaToken = null` en login fallido y error
- [x] 2.7 Agregar widget `<re-captcha>` en template con condición en botón

## Phase 3: Testing

- [x] 3.1 Agregar 5 specs de reCAPTCHA en `login.component.spec.ts`
- [x] 3.2 Ejecutar suite completa: 27/27 PASS
- [x] 3.3 Commit `a569cd354`

## Phase 4: Gates

- [x] 4.1 /gd:review — PASS
- [x] 4.2 /gd:verify — VERIFY PASS
- [x] 4.3 /gd:close — READY FOR ARCHIVE

**Tasks**: 14/14 (100%)

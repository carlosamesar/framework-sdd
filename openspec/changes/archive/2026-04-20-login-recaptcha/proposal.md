# Proposal — login-recaptcha

**Change**: login-recaptcha
**Date**: 2026-04-20
**Type**: feature
**Scope**: `develop/frontend/gooderp-client/src/app/auth/login/`

## Intent

Agregar reCAPTCHA v2 (checkbox "No soy un robot") al formulario de login para prevenir ataques automatizados de fuerza bruta.

## Scope

- `login.component.ts` — importar RecaptchaModule, añadir captchaToken, handlers y guard en onSubmit
- `login.component.html` — widget `<re-captcha>` y condición `!captchaToken` en el botón
- `environments/environment.ts` — agregar `recaptchaSiteKey`
- `login.component.spec.ts` — 5 nuevos tests de reCAPTCHA

## Approach

Usar `ng-recaptcha@13` con `RecaptchaModule` (standalone). El token se asigna en `onCaptchaResolved`, se limpia en `onCaptchaExpired` y se resetea al fallar el login.

## Rollback Plan

Revertir commit `a569cd354`. Eliminar `ng-recaptcha` de `package.json`.

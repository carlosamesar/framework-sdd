# Verify Report — login-recaptcha

**Veredicto**: VERIFY PASS
**Fecha**: 2026-04-20 (actualizado tras migración a v3)

## Cobertura de Spec

| ID | Escenario | Test | Estado |
|----|-----------|------|--------|
| E01 | captchaToken null al inicializar | `captchaToken debe ser null al inicializar` | ✅ |
| E02 | onCaptchaResolved asigna token | `onCaptchaResolved asigna token` | ✅ |
| E03 | Token reset al expirar | `onCaptchaExpired limpia el token` | ✅ |
| E04 | Token reset tras login fallido | `tras login fallido captchaToken queda null` | ✅ |
| E05 | Site key del environment | `recaptchaSiteKey viene del environment` | ✅ |

## Implementación final

- **Tipo**: reCAPTCHA v3 invisible (score-based) — NO v2 checkbox
- **Módulo**: `RecaptchaV3Module` + `ReCaptchaV3Service` + `RECAPTCHA_V3_SITE_KEY`
- **Flujo**: token obtenido en `onSubmit()` via `executeRecaptcha()` (sin widget visible)
- **Site key**: inyectado desde `environment.recaptchaSiteKey`

## Tests

- Suite: `login.component.spec.ts`
- Total: 16 specs
- Passed: 16 ✅
- Failed: 0

## TypeScript

- 0 errores en archivos del change

## Commits

- `a569cd354` — feat(auth): add reCAPTCHA v2 to login form (revertido implícitamente)
- `553f3f066` — feat(auth): migrate reCAPTCHA from v2 checkbox to v3 invisible


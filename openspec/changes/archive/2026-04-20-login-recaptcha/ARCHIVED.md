# ARCHIVED — login-recaptcha

**ID**: C-003
**Slug**: login-recaptcha
**Fecha de archivo**: 2026-04-20
**Rama**: fix/login-recaptcha
**PR**: mergeado — commit `f00c54f08`

## Gates completados

| Gate | Veredicto | Fecha |
|------|-----------|-------|
| verify | VERIFY PASS | 2026-04-20 |
| close | CLOSE PASS | 2026-04-20 |
| deploy | N/A — change de código frontend | — |

## Commits del change

| Hash | Descripción |
|------|-------------|
| `a569cd354` | feat(auth): add reCAPTCHA v2 to login form (punto de partida) |
| `553f3f066` | feat(auth): migrate reCAPTCHA from v2 checkbox to v3 invisible |
| `b342dbd0f` | fix(auth): move RECAPTCHA_V3_SITE_KEY provider to app-level config |
| `5b77f4495` | fix(auth): force grecaptcha-badge visibility for reCAPTCHA v3 |

## Decisiones clave

1. **v3 sobre v2**: El site key del cliente es v3 (score-based). Usar con v2 causaba `"El tipo de clave no es válido"`.
2. **Provider en app.config.ts**: `ReCaptchaV3Service` es singleton raíz — necesita `RECAPTCHA_V3_SITE_KEY` en el injector raíz, no en el componente.
3. **Badge visible**: Requisito legal de Google — `.grecaptcha-badge { visibility: visible !important }` en `styles.scss`.

## Artefactos

- `specs/auth/spec.md` — spec final v3
- `tasks.md` — tareas completadas
- `proposal.md` — propuesta inicial
- `design.md` — diseño técnico
- `verify-report.md` — reporte de verificación
- `EVIDENCE.md` — evidencia de gates
- `CONSUMO.md` — contrato de uso

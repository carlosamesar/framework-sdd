# EVIDENCE — login-recaptcha

## Gate: verify — VERIFY PASS — 2026-04-20

- Specs E01–E05 cubiertas: ✅
- Tests: 16/16 SUCCESS
- TypeScript: 0 errores en archivos del change
- Commit: `553f3f066`

## Gate: close — PASS — 2026-04-20

- CONSUMO.md completo: ✅
- TASKS.md todas las tareas [x]: ✅
- Tests finales: 16/16 SUCCESS ✅
- Rama: `fix/login-recaptcha`
- PR: mergeado — commit `f00c54f08`

## Fixes post-verify incluidos en el close

| Commit | Descripción |
|--------|-------------|
| `b342dbd0f` | fix(auth): move RECAPTCHA_V3_SITE_KEY provider to app-level config |
| `5b77f4495` | fix(auth): force grecaptcha-badge visibility for reCAPTCHA v3 |

## Notas

- La migración de v2 → v3 fue necesaria porque el site key del cliente es v3 (score-based).
- El provider de `RECAPTCHA_V3_SITE_KEY` debe estar en `app.config.ts` (injector raíz), no en el componente standalone.
- El badge `.grecaptcha-badge` requiere `visibility: visible !important` en `styles.scss` para cumplir los términos de servicio de Google.

# Registry — gooderp-client changes

## C-001 bodega-tipo-responsables

- **Slug**: bodega-tipo-responsables
- **Fecha**: 2026-04-17
- **Estado**: ARCHIVED
- **Resumen**: Implementación de tipos y responsables en módulo de bodegas.
- **Archive**: `openspec/changes/archive/2026-04-17-bodega-tipo-responsables/`

---

## C-002 login-password-fix

- **Slug**: login-password-fix
- **Fecha**: 2026-04-20
- **Estado**: ARCHIVED
- **Resumen**: Corrección de validadores de contraseña en el formulario de login — rango 8-25 caracteres, eliminación de validadores de complejidad y patrón IA.
- **Archivos clave**: `src/app/auth/login/login.component.ts`, `login.component.spec.ts`
- **Tests**: 8 tests agregados
- **Archive**: `openspec/changes/archive/2026-04-20-login-password-fix/`

---

## C-003 login-recaptcha

- **Slug**: login-recaptcha
- **Fecha**: 2026-04-20
- **Estado**: ARCHIVED
- **Resumen**: Integración de reCAPTCHA v3 invisible en el formulario de login. Migración desde v2 checkbox debido a que el site key del cliente es score-based (v3). El token se obtiene en background al hacer submit sin widget visible.
- **Archivos clave**: `src/app/auth/login/login.component.ts`, `src/app/app.config.ts`, `src/styles.scss`, `src/environments/environment.ts`, `src/environments/environment.prod.ts`
- **Tests**: 5 tests de reCAPTCHA (E01–E05), 16 total en suite
- **PR**: mergeado — commit `f00c54f08`
- **Archive**: `openspec/changes/archive/2026-04-20-login-recaptcha/`

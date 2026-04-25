# Proposal — login-password-fix

**Change**: login-password-fix
**Date**: 2026-04-20
**Type**: bugfix
**Scope**: `develop/frontend/gooderp-client/src/app/auth/login/`

## Intent

El botón "Iniciar sesión" no se habilitaba con contraseñas válidas porque los validadores del campo `password` eran excesivamente restrictivos (`passwordComplexityValidator` + `aiPasswordValidator`), bloqueando prácticamente cualquier contraseña real.

## Scope

- `login.component.ts` — validadores del control `password`
- `login.component.html` — mensajes de error del campo `password`

## Approach

Reemplazar los validadores complejos por: `Validators.required`, `Validators.minLength(8)`, `Validators.maxLength(25)`.

## Rollback Plan

Revertir commit `a2c3faedd` si se detecta regresión.

## Affected Modules

- `src/app/auth/login/`

# Design — login-password-fix

**Change**: login-password-fix
**Date**: 2026-04-20

## Architecture Decision

Remove overly strict custom validators from the `password` FormControl.

### Before
```typescript
password: ['', [
  Validators.required,
  Validators.minLength(6),
  this.passwordComplexityValidator.bind(this),
  this.aiPasswordValidator.bind(this)
]]
```

### After
```typescript
password: ['', [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(25)
]]
```

### Rationale

- `passwordComplexityValidator` required 2 of: uppercase/lowercase/numbers/special chars — too strict for a login form that just needs to forward credentials to Cognito.
- `aiPasswordValidator` blocked common patterns (1234, asdf, qwerty) — login forms should not validate password content, only format.
- Cognito handles actual password policy enforcement on the backend.

## Files Modified

- `login.component.ts:459-468` — FormControl validators
- `login.component.html:100-112` — error message for minlength/maxlength

# Tasks — login-password-fix

## Phase 1: Implementation

- [x] 1.1 Simplify `password` FormControl validators in `login.component.ts`
  - Remove `passwordComplexityValidator` and `aiPasswordValidator`
  - Set `minLength(8)` and `maxLength(25)`
  - Commit: `a2c3faedd`

- [x] 1.2 Update error message in `login.component.html`
  - Show "La contraseña debe tener entre 8 y 25 caracteres" for minlength/maxlength errors

## Phase 2: Testing

- [x] 2.1 Create `login.component.spec.ts` with 11 Jasmine tests (TD-01)
  - Password validation: empty, short, exact 8, valid range, exact 25, too long
  - Validator removal: no passwordComplexity error, no aiPassword error
  - Submit button: disabled when invalid, enabled when valid

## Phase 3: Verification & Close

- [x] 3.1 `/gd:review` — PASS
- [x] 3.2 `/gd:verify` — VERIFY PASS (11 scenarios covered)
- [x] 3.3 `/gd:close` — READY FOR ARCHIVE

**Tasks**: 5/5 (100%)

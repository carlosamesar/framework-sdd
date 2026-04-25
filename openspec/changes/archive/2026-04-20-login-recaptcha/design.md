# Design — login-recaptcha

**Change**: login-recaptcha
**Date**: 2026-04-20

## Architecture Decision

Use `ng-recaptcha` standalone `RecaptchaModule` — no FormsModule dependency, works with Angular 19 standalone components.

## Changes

### environment.ts
```typescript
recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // test key
```

### login.component.ts
```typescript
imports: [..., RecaptchaModule]
public recaptchaSiteKey: string = environment.recaptchaSiteKey;
public captchaToken: string | null = null;

onCaptchaResolved(token): void { this.captchaToken = token; }
onCaptchaExpired(): void      { this.captchaToken = null; }

// onSubmit guard:
if (!this.captchaToken) { return; }

// on failure:
this.captchaToken = null;
```

### login.component.html
```html
<re-captcha [siteKey]="recaptchaSiteKey"
  (resolved)="onCaptchaResolved($event)"
  (errored)="onCaptchaExpired()">
</re-captcha>
<button [disabled]="loginForm.invalid || isLoading || !captchaToken">
```

## Rationale

- reCAPTCHA v2 is the most widely understood UX pattern — user sees the checkbox explicitly
- Site key from environment: no hardcoded values in source
- Reset on failure: prevents token reuse after a failed attempt
- Cognito still validates credentials — reCAPTCHA is an additional frontend guard

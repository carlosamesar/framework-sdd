# Spec — login-recaptcha / auth

**Domain**: auth
**Change**: login-recaptcha

## Feature: Login Form — reCAPTCHA v3 (invisible)

### Requirement: reCAPTCHA v3 integration

- The login form MUST integrate reCAPTCHA v3 (score-based, invisible — no checkbox widget).
- The reCAPTCHA token MUST be obtained in background on submit via `ReCaptchaV3Service.execute('login')`.
- The submit button MUST NOT be disabled due to reCAPTCHA state (v3 is invisible).
- If the token cannot be obtained, the error MUST be handled gracefully and `captchaToken` reset to null.
- The reCAPTCHA token MUST be reset to null after a failed login attempt.
- The site key MUST be read from `environment.recaptchaSiteKey` — never hardcoded.
- `RECAPTCHA_V3_SITE_KEY` MUST be provided at the root injector level (app.config.ts), not in the component.
- The reCAPTCHA badge MUST be visible in the page (`.grecaptcha-badge { visibility: visible !important }`).

### Scenarios

**Scenario E01**: captchaToken null on init
```
Given the login form is rendered
Then captchaToken is null
```

**Scenario E02**: onCaptchaResolved assigns token
```
Given the component is initialized
When onCaptchaResolved is called with a token string
Then captchaToken equals that token
```

**Scenario E03**: Token cleared on expiry
```
Given captchaToken has a value
When onCaptchaExpired is called
Then captchaToken is null
```

**Scenario E04**: Token reset after failed login
```
Given the user submits the form with valid credentials
When the login fails
Then captchaToken is null
```

**Scenario E05**: Site key from environment
```
Given the component is rendered
Then recaptchaSiteKey equals environment.recaptchaSiteKey
```

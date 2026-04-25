# Spec — login-password-fix / auth

**Domain**: auth
**Change**: login-password-fix

## Feature: Login Form — Password Validation

### Requirement: Password Range

- The password field MUST accept passwords between 8 and 25 characters (inclusive).
- The password field MUST reject empty input (`required`).
- The password field MUST NOT enforce character complexity rules (uppercase, numbers, symbols).
- The password field MUST NOT enforce AI pattern detection.

### Scenarios

**Scenario E01**: Empty password
```
Given the login form is rendered
When the password field is empty
Then the field is invalid with error "required"
And the submit button is disabled
```

**Scenario E02**: Password too short (< 8 chars)
```
Given the login form is rendered
When the user enters a password with 7 or fewer characters
Then the field is invalid with error "minlength"
And the error message "La contraseña debe tener entre 8 y 25 caracteres" is shown
```

**Scenario E03**: Password within valid range
```
Given the login form is rendered
When the user enters a password with 8 to 25 characters
Then the field is valid
And no password-related error is shown
```

**Scenario E04**: Password too long (> 25 chars)
```
Given the login form is rendered
When the user enters a password with 26 or more characters
Then the field is invalid with error "maxlength"
And the error message "La contraseña debe tener entre 8 y 25 caracteres" is shown
```

**Scenario E05**: Simple password (no complexity required)
```
Given the login form is rendered
When the user enters a simple 8-char password (e.g. "simplepwd")
Then the field is valid
And no "passwordComplexity" error exists
```

**Scenario E06**: Common pattern password (no AI blocking)
```
Given the login form is rendered
When the user enters "12345678"
Then the field is valid
And no "aiPassword" error exists
```
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

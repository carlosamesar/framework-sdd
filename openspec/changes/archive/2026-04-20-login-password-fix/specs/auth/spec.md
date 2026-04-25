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

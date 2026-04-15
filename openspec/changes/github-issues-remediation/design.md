# Diseño — github-issues-remediation

## Alcance técnico

La remediación se divide en cuatro bloques:

### 1. Acceso y autenticación
- validación temprana de token, owner, repo y permisos;
- mensajes de error explícitos para permisos insuficientes o repositorio inaccesible.

### 2. Disparo por eventos nativos
- reemplazar el modelo de polling por GitHub Actions con eventos de issues, comentarios o ejecución manual;
- soportar filtros por label, autor o plantilla.

### 3. Confiabilidad operativa
- persistencia del estado procesado;
- reintentos controlados y prevención de duplicados;
- dry-run seguro para auditoría.

### 4. Gobierno y trazabilidad
- logs estructurados;
- evidencia por ejecución;
- pruebas smoke y de regresión en CI.

## Criterios de aceptación

- se puede listar y crear un issue de prueba en entorno válido;
- un evento válido dispara el flujo sin polling manual;
- reinicios del proceso no reejecutan el mismo issue sin autorización;
- el pipeline genera evidencia utilizable para soporte y auditoría.

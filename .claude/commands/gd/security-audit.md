# /gd:security-audit — Auditoría Estática OWASP Top 10

## Propósito
Realizar una auditoría estática de seguridad basada en el OWASP Top 10 para identificar vulnerabilidades potenciales en el código antes de que lleguen a producción.

## Cómo Funciona

1. **Mapeo OWASP Top 10**: Evalúa el código contra las 10 categorías más críticas de seguridad:
   - A01:2021 - Broken Access Control
   - A02:2021 - Cryptographic Failures
   - A03:2021 - Injection
   - A04:2021 - Insecure Design
   - A05:2021 - Security Misconfiguration
   - A06:2021 - Vulnerable and Outdated Components
   - A07:2021 - Identification and Authentication Failures
   - A08:2021 - Software and Data Integrity Failures
   - A09:2021 - Security Logging and Monitoring Failures
   - A10:2021 - Server-Side Request Forgery

2. **Análisis Estático**: Usa herramientas de análisis estático de seguridad (SAST) para:
   - Detectar patrones de código inseguros
   - Identificar validaciones de entrada faltantes o insuficientes
   - Encontrar manejo inadecuado de secrets y credenciales
   - Descubrir configuraciones de seguridad defectuosas
   - Identificar uso de componentes vulnerables

3. **Validación Específica**: Para este proyecto, incluye verificaciones adicionales:
   - Multi-tenant: Confirma extracción de tenant desde JWT, no desde body/params
   - JWT Validation: Verifica correcta validación de tokens
   - SQL Injection: Chequeo específico para inyecciones SQL
   - Path Traversal: Detección de intentos de traversal de paths
   - XSS: Validación de escapes adecuados en outputs

## Salida del Comando

- **Resumen General**: Score de seguridad (0-100) y nivel de riesgo (Bajo, Medio, Alto, Crítico)
- **Detalles por Categoría**: Findings específicos para cada uno de los 10 puntos OWASP
- **Severidad**: Cada finding clasificado como Crítico, Alto, Medio, Bajo
- **Ubicación Exacta**: Archivo y número de línea donde se encontró cada vulnerabilidad
- **Descripción**: Explicación clara de por qué es una vulnerabilidad y cómo explotarla
- **Recomendación de Fix**: Pasos específicos para resolver cada issue encontrado
- **Referencias**: Enlaces a documentación OWASP y mejores prácticas

## Uso

```
/gd:security-audit [path o alcance a auditar]
```

## Alias
- `/gd:auditar-seguridad`

## Parámetros Opcionales

- `--severity=nivel`: Filtrar findings por nivel mínimo (low, medium, high, critical)
- `--format=salida`: Formato del reporte (markdown, json, sarif, html)
- `--exclude=patrones`: Excluir ciertos archivos o patrones del escaneo
- `--fail-on=umbral`: Fallar el comando si se encuentran issues por encima del umbral

## Ejemplos

```
/gd:security-audit src/
/gd:security-audit lib/lambda/transacciones/ --severity=medium
/gd:security-audit servicio-contabilidad/src/ --format=json
```

## Criterios de Aprobación

Para pasar la auditoría de seguridad:
- ✅ **Score General**: ≥ 90/100
- ✅ **Issues Críticos**: 0 findings de severidad crítica
- ✅ **Issues Altos**: Máximo 2 findings de severidad alta (con plan de mitigación)
- ✅ **Multi-Tenant Validado**: Confirmado que tenant se extrae solo desde JWT
- ✅ **SQL Injection**: 0 findings de inyección SQL potencial
- ✅ **Secrets Exposure**: 0 findings de credenciales o secrets en código

## Siguiente Paso
Si la auditoría encuentra issues, abordarlos según prioridad de severidad y volver a ejecutar `/gd:security-audit` hasta alcanzar los criterios de aprobación.
# /gd:specify — Convertir Idea en Especificación Gherkin

## Propósito
Convertir una idea o requerimiento en una especificación formal en formato Gherkin con escenarios de prueba, prioridades y esquema de base de datos.

## Cómo Funciona

1. **Análisis de Requerimiento**: Lee la idea y la convierte en escenarios Gherkin
2. **Escenarios de Prueba**: Genera Given/When/Then para cada caso de uso
3. **Priorización**: Asigna prioridad (P0-P3) a cada escenario
4. **DBML**: Genera esquema de base de datos si aplica

## Formato Gherkin

```gherkin
Feature: Nombre del feature

  Scenario: Escenario principal
    Given condición inicial
    When acción del usuario
    Then resultado esperado

  @priority:P0
  Scenario: Escenario crítico
    ...
```

## Uso

```
/gd:specify [descripción de la idea o requerimiento]
```

## Ejemplo

```
/gd:specify Sistema de gestión de usuarios con autenticación JWT y roles
```

## Alias
- `/gd:especificar`

## Salida estructurada (agentes ReAct)

Opcional: además del Markdown, emitir un bloque JSON que cumpla `openspec/templates/react-outputs/specify.output.schema.json` para que un orquestador parsee escenarios y preguntas abiertas.

## Siguiente Paso
Después de especificar, usar `/gd:clarify` para validar la especificación.
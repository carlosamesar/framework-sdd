# /gd:specify — Convertir Idea en Especificación Gherkin

## Propósito
Convertir una idea o requerimiento en una especificación formal en formato Gherkin con escenarios de prueba, prioridades y esquema de base de datos. Es la primera fase del ciclo SDD.

## Alias
- `/gd:especificar`

---

## Cómo Funciona

1. **Detectar nivel de complejidad** (0-4) antes de especificar — determina la profundidad de la spec
2. **Extraer actores y contexto**: ¿Quién hace qué, cuándo y por qué?
3. **Generar escenarios Gherkin**: Happy path + edge cases + errores
4. **Asignar prioridades P0-P3** a cada escenario
5. **Generar DBML** si hay cambios de esquema de BD
6. **Identificar preguntas abiertas** que requieren clarificación

---

## Plantilla de Output Obligatoria

```markdown
# SPEC: [Nombre del cambio]

## Metadata
- **Change**: [slug-del-change]
- **Nivel**: [0-4]
- **Fecha**: [YYYY-MM-DD]
- **Estado**: DRAFT | CLARIFIED | APPROVED

## Contexto
[2-3 oraciones explicando el problema de negocio]

## Actores
- **[Actor 1]**: [rol en el sistema]
- **[Actor 2]**: [rol en el sistema]

## Escenarios

### Happy Path

```gherkin
Feature: [Nombre del feature]

  @priority:P0
  Scenario: [Escenario principal exitoso]
    Given [estado inicial del sistema]
    And   [precondición adicional si aplica]
    When  [acción del actor]
    Then  [resultado observable]
    And   [efecto secundario esperado]
```

### Edge Cases

```gherkin
  @priority:P1
  Scenario: [Caso límite]
    Given [estado con datos en el límite]
    When  [acción del actor]
    Then  [comportamiento específico para el límite]
```

### Errores y Validaciones

```gherkin
  @priority:P1
  Scenario: [Error esperado]
    Given [condición inválida]
    When  [acción que debería fallar]
    Then  [mensaje de error específico]
    And   [estado del sistema no cambia]
```

## Esquema de Base de Datos (si aplica)

```dbml
Table [nombre_tabla] {
  id          uuid [pk, default: `uuid_generate_v4()`]
  tenant_id   uuid [not null, note: 'FK → tenants.id — NUNCA de body']
  [campo]     [tipo] [nota]
  created_at  timestamp [default: `now()`]
}
```

## Preguntas Abiertas
- [ ] [Pregunta 1 sobre comportamiento no especificado]
- [ ] [Pregunta 2 sobre regla de negocio ambigua]

## Criterios de Aceptación de la Spec
- [ ] Todos los actores identificados
- [ ] Al menos 1 escenario P0 (happy path)
- [ ] Todos los P0 tienen Given/When/Then completos
- [ ] Edge cases cubiertos para P0
- [ ] DBML completo si hay cambio de esquema
- [ ] Sin preguntas abiertas críticas
```

---

## Uso

```
/gd:specify [descripción de la idea o requerimiento]
```

## Ejemplos

```
/gd:specify Sistema de autenticación con JWT y roles: admin, operador, viewer
```

```
/gd:specify Módulo de parqueaderos: registrar entrada, salida y cobro automático
```

```
/gd:specify API endpoint GET /api/reportes/caja que filtra por fecha y tenant
```

---

## Reglas Críticas

1. **Multi-tenant**: Si hay entidades de BD, SIEMPRE incluir `tenant_id` extraído de JWT en la spec — nunca de body o params
2. **P0 primero**: Los escenarios P0 son los mínimos para que el cambio sea útil — deben estar 100% completos
3. **Measurable**: Cada `Then` debe ser verificable mecánicamente (no "sistema funciona" sino "sistema retorna HTTP 201 con body `{ id, status }`")
4. **No sobrespecificar**: Niveles 0-1 no necesitan DBML ni edge cases exhaustivos

---

## Salida Estructurada (agentes ReAct)

Emitir JSON al final según `openspec/templates/react-outputs/specify.output.schema.json` para que el orquestador parsee escenarios y preguntas abiertas.

---

## Siguiente Paso
Después de especificar, usar `/gd:clarify` para detectar ambigüedades antes de planificar.

# `/gd:testing` — Definir y Ejecutar la Estrategia de Testing

## Propósito
Alinear el trabajo con una estrategia de pruebas verificable: unitarias, integración, contrato, e2e, regresión y smoke. Debe ayudar a decidir qué probar primero y qué evidencia se necesita para aprobar el cambio.

---

## Principios

- TDD cuando el cambio lo permita;
- cobertura suficiente en lógica de negocio;
- pruebas de integración en flujos críticos;
- smoke tests mínimos antes de cerrar o liberar.

---

## Uso

```bash
/gd:testing
/gd:testing --unit
/gd:testing --integration
/gd:testing --e2e
```

---

## Resultado esperado

```markdown
## Testing Strategy
**Prioridad actual**: alta | media | baja

### Casos críticos
- [caso 1]
- [caso 2]

### Suite recomendada
- unit
- integration
- regression

### Evidencia requerida
- [test o comando]
```

---

## Criterios de calidad

- las pruebas deben validar comportamiento real;
- evitar tests frágiles basados en mocks irreales;
- no cerrar un cambio con rutas críticas sin cubrir.

## Inputs recomendados

- tipo de cambio y riesgo asociado
- rutas críticas a proteger
- entorno de prueba disponible
- evidencia mínima requerida para aprobar

## Output esperado

- estrategia de testing priorizada
- suites recomendadas por nivel
- riesgos de cobertura insuficiente
- siguiente validación sugerida

## Integración sugerida

- usar desde el inicio del cambio y no al final
- conectar con thresholds y verify para decisiones objetivas
- conservar evidencia de las pruebas más relevantes

## Anti-patrones a evitar

- añadir tests solo para cumplir números
- depender de mocks que no representan el sistema real
- omitir smoke o integración en flujos críticos
- declarar “listo” sin pruebas suficientes

## Ejemplo de solicitud

```text
/gd:testing definir pruebas para runner de automatización con fallback local
```

---

## Siguiente paso

Para aprobar el resultado, combinar con `/gd:verify` y `/gd:metrics`.
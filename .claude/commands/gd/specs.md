# `/gd:specs` — Consultar y Mantener las Specs del Proyecto

## Propósito
Servir como punto de entrada para revisar, actualizar o alinear los escenarios y reglas de comportamiento del sistema con el trabajo en curso.

---

## Qué debe cubrir

- escenarios vigentes;
- reglas de negocio clave;
- cambios pendientes respecto de implementación;
- trazabilidad entre spec, tasks y evidencia.

---

## Formato esperado

```markdown
## Specs Status
- spec activa
- escenarios cubiertos
- escenarios pendientes
- desviaciones detectadas
```

---

## Inputs recomendados

- spec o módulo que se desea revisar
- change asociado o comportamiento esperado
- dudas sobre cobertura o vigencia
- criterio para considerar la spec alineada

## Output esperado

- estado de alineación de la spec
- escenarios cubiertos y pendientes
- desviaciones visibles
- acción recomendada para corregirlas

## Integración sugerida

- revisar antes de implementar cambios sensibles
- usar como puente entre specify, review y verify
- mantener trazabilidad entre escenario y evidencia

## Criterios de calidad

- lectura fiel del comportamiento esperado
- distinción clara entre spec vigente y deuda pendiente
- foco en cambios con impacto funcional
- utilidad inmediata para decidir siguiente paso

## Anti-patrones a evitar

- tratar la spec como documento decorativo
- ignorar escenarios no cubiertos por presión de tiempo
- mezclar cambios implementados con intención futura
- cerrar el cambio con drift no declarado

## Ejemplo de solicitud

```text
/gd:specs revisar cobertura de escenarios de facturación
```

## Siguiente paso

Si hay desalineación, usar `/gd:clarify`, `/gd:review` o `/gd:verify`.
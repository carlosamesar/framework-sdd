# `/gd:update` — Actualizar el Framework y sus Capacidades de Forma Segura

## Propósito
Guiar la actualización del framework, dependencias internas o componentes asociados minimizando riesgo funcional y manteniendo compatibilidad operativa.

---

## Flujo recomendado

1. identificar versión actual y objetivo;
2. revisar breaking changes o notas de migración;
3. ejecutar actualización en entorno controlado;
4. validar smoke tests y gates mínimos;
5. documentar impacto y rollback.

---

## Salida esperada

```markdown
## Update Plan
- versión actual
- versión objetivo
- riesgos esperados
- validaciones requeridas
- decisión final: aplicar o posponer
```

---

## Regla

Nunca actualizar por inercia; siempre debe existir una razón, validación y plan de reversión.

---

## Inputs recomendados

- componente o capability a actualizar
- versión actual y objetivo
- impacto esperado en el ecosistema
- validaciones mínimas requeridas

## Output esperado

- plan breve de actualización
- riesgos y compatibilidad visibles
- necesidad o no de rollback
- siguiente paso del flujo técnico

## Integración sugerida

- revisar versiones y notas de cambio antes de actualizar
- coordinar con verify si la actualización toca lógica o dependencias críticas
- dejar evidencia si cambia el estándar del framework

## Criterios de calidad

- objetivo de actualización bien justificado
- impacto técnico comprendido
- plan de reversión disponible
- verificación posterior no omitida

## Anti-patrones a evitar

- actualizar por impulso o moda
- mezclar demasiadas actualizaciones simultáneas
- ignorar compatibilidad del entorno
- cerrar sin validar el resultado

## Ejemplo de solicitud

```text
/gd:update revisar actualización del runner oficial de issues
```

## Siguiente paso

Si el cambio es mayor, complementar con `/gd:upgrade` y `/gd:verify`.
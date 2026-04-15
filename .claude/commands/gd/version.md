# `/gd:version` — Consultar Versiones Activas del Framework, Agentes y Proyecto

## Propósito
Mostrar de forma rápida y confiable el estado de versionado del entorno actual para reducir confusión operativa y facilitar soporte, upgrades o auditorías.

---

## Qué informa

- versión del framework;
- versión del proyecto o módulo actual;
- componentes desalineados;
- necesidad de actualización o compatibilidad.

---

## Salida esperada

```markdown
## Version Report
- framework: x.y.z
- proyecto: x.y.z
- estado: alineado | revisar | desfasado
```

---

## Inputs recomendados

- componente o módulo a consultar
- entorno o rama relevante
- versión esperada o de referencia
- motivo de la comprobación

## Output esperado

- versiones detectadas con claridad
- diferencias relevantes entre componentes
- señal de compatibilidad o desalineación
- recomendación de acción posterior

## Integración sugerida

- revisar antes de upgrades o releases
- usar en diagnósticos de comportamiento extraño
- incorporar a auditorías o handovers técnicos

## Criterios de calidad

- información confiable y fácil de comparar
- foco en impacto operativo real
- consistencia entre entorno y documentación
- siguiente paso evidente si hay drift

## Anti-patrones a evitar

- asumir versión por costumbre
- mezclar estados de ramas distintas
- ignorar incompatibilidades menores acumuladas
- no documentar cambios de versión relevantes

## Ejemplo de solicitud

```text
/gd:version revisar alineación entre framework y proyecto activo
```

## Siguiente paso

Si existe desalineación importante, continuar con `/gd:update` o `/gd:upgrade`.
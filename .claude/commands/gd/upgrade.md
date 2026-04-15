# `/gd:upgrade` — Gestionar Upgrades Mayores de Dependencias o Servicios

## Propósito
Coordinar cambios de versión con impacto significativo, especialmente cuando existen breaking changes, migraciones de configuración o ajustes de compatibilidad.

---

## Qué debe incluir

- versiones origen y destino;
- análisis de compatibilidad;
- pasos de migración;
- pruebas mínimas y rollback.

---

## Salida esperada

```markdown
## Upgrade Assessment
- impacto: bajo | medio | alto
- cambios requeridos
- riesgos principales
- decisión recomendada
```

---

## Inputs recomendados

- componente a actualizar
- versión origen y destino
- breaking changes conocidos
- ventana o tolerancia al riesgo

## Output esperado

- evaluación del impacto del upgrade
- tareas técnicas necesarias
- riesgos y mitigaciones definidas
- decisión recomendada de avance

## Integración sugerida

- revisar versiones y changelog antes de ejecutar
- coordinar con testing y release para cambios mayores
- documentar rollback y compatibilidades temporales

## Criterios de calidad

- comprensión clara del impacto
- foco en compatibilidad y continuidad operativa
- validaciones suficientes antes de avanzar
- trazabilidad de la decisión tomada

## Anti-patrones a evitar

- hacer upgrades por impulso o moda
- ignorar breaking changes documentados
- mezclar varios upgrades mayores al mismo tiempo
- omitir rollback o entorno de validación

## Ejemplo de solicitud

```text
/gd:upgrade evaluar salto de versión del servicio de orquestación
```

## Siguiente paso

Si el upgrade se aprueba, ejecutar validaciones con `/gd:verify` y revisar readiness con `/gd:release`.
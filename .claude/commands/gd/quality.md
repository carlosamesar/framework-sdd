# `/gd:quality` — Auditoría de Calidad Técnica y Arquitectónica

## Propósito
Evaluar la calidad real de una implementación desde varias dimensiones: corrección, legibilidad, mantenibilidad, alineación con patrones maduros, deuda técnica y riesgo de regresión.

---

## Qué revisa

- claridad y cohesión del código;
- complejidad accidental y duplicación;
- uso correcto de patrones existentes del repositorio;
- cumplimiento de reglas de seguridad y multi-tenant;
- separación entre dominio, infraestructura y presentación;
- manejo de errores y observabilidad.

---

## Uso

```bash
/gd:quality
/gd:quality --module [ruta]
/gd:quality --change [slug]
```

---

## Salida esperada

```markdown
## Quality Report
**Estado**: pass | conditional | fail

### Fortalezas
- [fortaleza 1]

### Hallazgos
- [hallazgo 1]
- [hallazgo 2]

### Riesgos
- [riesgo 1]

### Recomendación
- aprobar
- corregir antes de merge
```

---

## Reglas

- no declarar calidad alta sin evidencia concreta;
- toda crítica debe vincularse a un riesgo o a una mejora accionable;
- priorizar defectos estructurales sobre detalles cosméticos.

---

## Siguiente paso

Si se detectan hallazgos críticos, continuar con `/gd:review` o volver a `/gd:implement`.
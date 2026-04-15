# `/gd:release` — Preparar, Validar y Publicar una Release

## Propósito
Coordinar el cierre técnico y operativo de una versión para salida a producción o entorno controlado. Este comando verifica si el sistema está realmente listo para liberarse con riesgo aceptable.

---

## Cuándo usarlo

Úsalo cuando:
- un change ya pasó implementación y review;
- se necesita preparar una versión candidata;
- hay que consolidar changelog, verificación y checklist de despliegue.

---

## Flujo recomendado

1. confirmar que `/gd:verify` terminó en PASS;
2. revisar riesgos abiertos y deuda técnica tolerable;
3. validar versión, rama objetivo y artefactos;
4. ejecutar gate pre-release;
5. documentar contenido de la versión y rollback.

---

## Checklist pre-release

- [ ] tests críticos en verde
- [ ] verify PASS
- [ ] changelog actualizado
- [ ] artefactos o imágenes generadas
- [ ] rollback definido
- [ ] riesgos conocidos documentados

---

## Output esperado

```markdown
## Release Readiness
**Versión**: vX.Y.Z
**Estado**: ready | blocked | conditional

### Incluye
- [feature 1]
- [feature 2]

### Bloqueos
- [bloqueo si existe]

### Recomendación
- desplegar ahora
- corregir antes de release
```

---

## Criterios de bloqueo

No se debe liberar si:
- hay fallos en tests críticos;
- existe riesgo de seguridad bloqueante;
- no hay rollback mínimo;
- los contratos públicos cambiaron sin documentación.

---

## Integración con el pipeline

Normalmente se usa después de:
- `/gd:review`
- `/gd:verify`
- `/gd:changelog`

---

## Siguiente paso

Si la release está lista, continuar con el procedimiento de despliegue del proyecto. Si no, volver a `/gd:implement` o `/gd:review` según el tipo de bloqueo.
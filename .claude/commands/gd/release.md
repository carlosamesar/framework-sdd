# /gd:release — Gate de Release Estricto y Publicación con Madurez Alta

## Skill Enforcement (Obligatorio)

1. Cargar `skill("gd-command-governance")`.
2. Cargar skill especializado para `/gd:release` desde `.claude/commands/gd/SKILL-ROUTING.md`.
3. Si falta evidencia, skill requerido, o hay `BLOCKED`/`UNVERIFIED` critico: `FAIL` inmediato.


## Propósito
Coordinar el cierre técnico y operativo de una versión para salida a producción o entorno controlado, con criterios severos de readiness. Este comando debe decidir si una release es verdaderamente liberable o si debe bloquearse sin excepciones.

---

## Cuándo usarlo

Úsalo cuando:
- un change ya pasó implementación, review, verify y close;
- se necesita preparar una versión candidata;
- hay que consolidar changelog, evidencia, contratos y checklist de despliegue.

---

## Flujo obligatorio

1. confirmar que `/gd:review` terminó en `PASS`;
2. confirmar que `/gd:verify` terminó en `VERIFY PASS`;
3. confirmar que `/gd:close` dejó el change en `READY FOR ARCHIVE`;
4. validar versión, rama objetivo, artefactos, changelog y rollback;
5. ejecutar gate pre-release severo;
6. ejecutar gate automático de evidencia para transición RELEASE → DEPLOY;
7. si todo pasa, habilitar `/gd:deploy`.

Gate obligatorio (bloqueante):

```bash
cd rag
npm run evidence:gate -- --change=<change-slug> --transition=CLOSE_RELEASE
npm run evidence:gate -- --change=<change-slug> --transition=RELEASE_DEPLOY
```

Si cualquiera falla, la release queda bloqueada.

---

## Checklist pre-release

- [ ] build y tests críticos en verde
- [ ] review PASS
- [ ] verify PASS
- [ ] close READY FOR ARCHIVE
- [ ] PR creado desde la rama `fix/**` hacia la rama base correcta
- [ ] changelog actualizado
- [ ] artefactos o imágenes generadas
- [ ] rollback definido
- [ ] riesgos conocidos documentados
- [ ] contratos públicos actualizados y consistentes con CONSUMO.md/OpenAPI

---

## Output esperado

```markdown
## Release Readiness
**Versión**: vX.Y.Z
**Estado**: RELEASE APPROVED | BLOCKED

### Evidencia
- Review: PASS
- Verify: PASS
- Close: READY FOR ARCHIVE
- Changelog: actualizado
- Rollback: definido

### Bloqueos
- [bloqueo si existe]

### Recomendación
- continuar con /gd:deploy
- corregir antes de release
```

---

## Criterios de bloqueo

No se debe liberar si:
- hay fallos en build, tests críticos o verificación final;
- existe riesgo de seguridad bloqueante;
- no hay rollback mínimo;
- los contratos públicos cambiaron sin documentación;
- el close documental no está completo.

---

## Integración con el pipeline

Normalmente se usa después de:
- `/gd:review`
- `/gd:verify`
- `/gd:close`
- `/gd:changelog`

Y antes de:
- `/gd:deploy`

---

## Siguiente paso

Si la release está lista, continuar con `/gd:deploy`. Si no, volver a `/gd:implement`, `/gd:review` o `/gd:close` según el bloqueo detectado.

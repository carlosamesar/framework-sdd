# /gd:close — Cerrar el Spec con Evidencia, Contrato y Certificación Total

## Propósito
Cerrar formalmente un change o spec cuando la solución ya fue implementada, revisada, verificada y certificada al 100%. Este comando consolida la evidencia final, obliga la documentación contractual de consumo y deja el cambio listo para archivado sin ambigüedad.

## Alias
- `/gd:cerrar`
- `/gd:finalizar-spec`

---

## Cuándo usarlo

Usa este comando únicamente cuando:
- la implementación está completa;
- la certificación funcional está al 100%;
- `/gd:review` devolvió `PASS`;
- `/gd:verify` devolvió `VERIFY PASS`;
- no existen BLOCKERs, warnings críticas ni pruebas fallando.

Si falta cualquiera de esos puntos, el cierre debe ser rechazado.

---

## Rol dentro del ciclo de vida

`/gd:close` es el gate documental y operativo previo al archivado.

Flujo obligatorio:

```text
/gd:start → /gd:implement → /gd:review → /gd:verify → /gd:close → /gd:archive
```

Su responsabilidad es asegurar que el spec quede cerrado con trazabilidad completa, no solo con código funcionando.

---

## Prerrequisitos obligatorios

- [ ] implementación funcional terminada al 100%
- [ ] certificación funcional aprobada al 100%
- [ ] build, lint, unit, integración, consumos y E2E en verde según aplique
- [ ] cobertura mínima cumplida
- [ ] `EVIDENCE.md` actualizado con resultados verificables
- [ ] `CONSUMO.md` actualizado con contrato de uso real
- [ ] documentación técnica asociada actualizada (OpenAPI, README, notas operativas)
- [ ] sin gaps P0 ni deuda crítica abierta

---

## Qué debe hacer

1. Identificar el change o spec activo.
2. Confirmar el estado final real de implementación y certificación.
3. Consolidar evidencias técnicas y funcionales.
4. Validar que `CONSUMO.md` tenga contrato completo y vigente.
5. Preparar el handoff documental para soporte, QA, frontend y futuros agentes.
6. Marcar el change como listo para archivado.

---

## Contrato obligatorio en CONSUMO.md

El cierre NO es válido si `CONSUMO.md` no documenta, como mínimo:

- contexto del servicio o feature;
- URL base y ambientes;
- autenticación y reglas multi-tenant;
- matriz de endpoints o flujos consumibles;
- headers requeridos;
- payloads de request;
- respuestas esperadas;
- códigos de error y manejo de fallos;
- ejemplos reales de consumo;
- dependencias, precondiciones y notas de compatibilidad;
- evidencia de certificación funcional asociada.

---

## Checklist de cierre estricto

- [ ] spec implementado completamente
- [ ] tasks cerradas al 100%
- [ ] evidencia real enlazada y consistente
- [ ] `CONSUMO.md` completo y alineado al contrato final
- [ ] endpoints, payloads y respuestas validados
- [ ] riesgos residuales declarados o marcados como cero
- [ ] siguiente estado del change = listo para `/gd:archive`

---

## Output esperado

```markdown
## Cierre Formal del Spec
**Estado**: READY FOR ARCHIVE | REJECTED
**Certificación funcional**: 100%
**Review**: PASS
**Verify**: VERIFY PASS

### Evidencia consolidada
- Build: OK
- Lint: OK
- Unit tests: OK
- Backend/consumos: OK
- Integración: OK
- Playwright E2E: OK

### Documentación obligatoria
- EVIDENCE.md: completo
- CONSUMO.md: completo
- OpenAPI/README: actualizados

### Veredicto
- Si todo está completo → ejecutar /gd:archive
- Si falta contrato o evidencia → REJECTED y volver a completar documentación
```

---

## Política de severidad

- no cerrar con certificación parcial;
- no cerrar con evidencia incompleta;
- no cerrar con contratos desactualizados;
- no cerrar si el comportamiento real no coincide con lo documentado.

El estándar es: cierre formal, auditable y reproducible.

---

## Siguiente paso

- Si el resultado es `READY FOR ARCHIVE` y el cambio requiere salida controlada → ejecutar `/gd:release`
- Si el resultado es `READY FOR ARCHIVE` y no requiere despliegue/versionado → ejecutar `/gd:archive`
- Si el resultado es `REJECTED` → corregir implementación, evidencia o documentación y re-ejecutar `/gd:close`
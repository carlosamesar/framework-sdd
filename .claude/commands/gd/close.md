# `/gd:close` — Cerrar Sesión con Resumen, Riesgos y Handover

## Propósito
Cerrar una sesión de trabajo sin perder contexto operativo, decisiones importantes, bloqueos, próximos pasos y evidencia generada. Debe dejar la base lista para que el mismo agente o un agente distinto pueda continuar sin fricción.

---

## Cuándo usarlo

Usa este comando cuando:
- terminas una tarea o subfase del pipeline SDD;
- necesitas pausar por horas o hasta el día siguiente;
- vas a transferir el trabajo a otro agente o a otro integrante del equipo;
- acabas de completar una implementación sensible y quieres dejar trazabilidad.

---

## Cómo funciona

1. Identifica el change o tarea activa.
2. Resume qué se completó y qué quedó pendiente.
3. Registra riesgos, decisiones y estado de validación.
4. Consolida próximos pasos accionables en orden de prioridad.
5. Deja un handover claro para la siguiente sesión.

---

## Checklist de cierre

- [ ] estado actual del change documentado
- [ ] archivos principales modificados identificados
- [ ] tests ejecutados y resultado anotado
- [ ] bloqueos pendientes declarados
- [ ] siguiente acción recomendada definida
- [ ] evidencia o reportes enlazados

---

## Salida esperada

```markdown
## Cierre de sesión
**Estado general**: en progreso | listo para review | bloqueado

### Completado
- [lista breve de entregables]

### Pendiente
- [lista breve de pendientes]

### Riesgos / bloqueos
- [riesgo 1]
- [riesgo 2]

### Próximo paso recomendado
- ejecutar /gd:[comando-siguiente]
```

---

## Reglas de calidad

- no cerrar una sesión sin próximos pasos claros;
- no omitir fallos de pruebas o restricciones conocidas;
- si hay deuda técnica, debe quedar visible;
- si el cambio está listo, debe indicarse el criterio objetivo de “listo”.

---

## Integración con el flujo SDD

Comúnmente se usa después de:
- `/gd:implement`
- `/gd:review`
- `/gd:verify`
- `/gd:release`

---

## Siguiente paso

Si otra persona retomará el trabajo, complementar con `/gd:traspasar`.
Si la sesión seguirá luego, usar `/gd:continue` al reabrir el contexto.
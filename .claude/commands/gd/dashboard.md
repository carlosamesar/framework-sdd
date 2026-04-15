# `/gd:dashboard` — Vista Ejecutiva de Salud, Riesgo y Progreso

## Propósito
Ofrecer una visión resumida y accionable del estado del proyecto o change: progreso, calidad, deuda técnica, bloqueos, readiness y evolución reciente.

---

## Qué consolida

- métricas del pipeline;
- estado de tareas y cambios abiertos;
- calidad técnica general;
- riesgos y bloqueos principales;
- readiness para review o release.

---

## Uso

```bash
/gd:dashboard
/gd:dashboard --change [slug]
/gd:dashboard --summary
```

---

## Formato sugerido

```markdown
## Dashboard del Change
**Estado general**: verde | amarillo | rojo

| Área | Estado | Nota |
|------|--------|------|
| Implementación | ✅ | estable |
| Calidad | ⚠️ | faltan ajustes |
| Verificación | ✅ | smoke OK |
| Riesgo | ⚠️ | vigilar integración |
```

---

## Reglas

- debe resumir, no saturar con detalle irrelevante;
- toda alerta debe señalar la siguiente acción recomendada;
- debe servir tanto para técnica como para coordinación.

---

## Inputs recomendados

- change, módulo o periodo a visualizar
- audiencia principal del resumen
- tipo de riesgo que se quiere monitorear
- nivel de detalle esperado

## Output esperado

- estado general del trabajo en una vista rápida
- alertas y riesgos priorizados
- señales de readiness o bloqueo
- recomendación clara para profundizar

## Integración sugerida

- usar en checkpoints o revisiones de avance
- complementar con métricas detalladas al detectar alertas
- compartir como resumen ejecutivo del estado técnico

## Criterios de calidad

- información escaneable y accionable
- foco en cambios de estado importantes
- equilibrio entre síntesis y utilidad real
- próximos pasos evidentes por cada alerta

## Anti-patrones a evitar

- convertir el dashboard en un dump de datos
- mostrar métricas sin interpretación
- ocultar riesgos relevantes bajo demasiado resumen
- usarlo como sustituto de verify o review

## Ejemplo de solicitud

```text
/gd:dashboard resumen del estado del change activo
```

## Siguiente paso

Para profundizar en una alerta específica, usar `/gd:metrics`, `/gd:quality`, `/gd:review` o `/gd:release`.
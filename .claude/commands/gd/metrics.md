# `/gd:metrics` — Consultar Métricas de Calidad, Flujo y Entrega

## Propósito
Mostrar métricas objetivas del trabajo en curso: cobertura, tests, gates, deuda técnica, ritmo de avance y estado general del ciclo SDD. Es el punto de consulta para medir progreso real y no percepciones.

---

## Métricas recomendadas

- tests pasando vs fallando;
- cobertura por módulo o servicio;
- porcentaje de tareas completadas;
- gates aprobados vs pendientes;
- issues críticos abiertos;
- tiempo estimado restante;
- drift entre spec e implementación.

---

## Uso

```bash
/gd:metrics
/gd:metrics --change [slug]
/gd:metrics --module [ruta]
/gd:metrics --trend
```

---

## Formato de salida

```markdown
## Métricas del Change
**Fecha**: [YYYY-MM-DD HH:mm]

| Indicador | Valor | Estado |
|-----------|-------|--------|
| Tests | 42/42 | ✅ |
| Coverage | 87% | ✅ |
| Tasks | 6/8 | ⚠️ |
| Gates | 3/5 | ⚠️ |
| Issues críticos | 0 | ✅ |
```

---

## Interpretación sugerida

- verde: progreso suficiente para seguir;
- amarillo: revisar calidad o tiempos;
- rojo: no avanzar sin correcciones.

---

## Reglas

- siempre preferir métricas verificadas por ejecución real;
- no inferir cobertura o calidad sin evidencia;
- diferenciar claramente entre bloqueos funcionales y cosméticos.

---

## Siguiente paso

Si las métricas caen por debajo del umbral deseado, ejecutar `/gd:gate`, `/gd:quality` o `/gd:review`.
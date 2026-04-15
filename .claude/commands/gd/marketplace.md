# `/gd:marketplace` — Descubrir Capacidades, Integraciones y Skills Reutilizables

## Propósito
Explorar el ecosistema disponible para incorporar soluciones ya probadas, reducir esfuerzo repetido y acelerar la adopción de buenas prácticas.

---

## Qué buscar

- skills útiles por dominio;
- integraciones compatibles;
- patrones maduros reutilizables;
- componentes que reduzcan riesgo o tiempo.

---

## Regla

No incorporar una capacidad externa sin revisar compatibilidad, mantenimiento y seguridad.

---

## Inputs recomendados

- necesidad concreta a cubrir
- dominio técnico involucrado
- restricciones de compatibilidad o seguridad
- criterio para aceptar una integración externa

## Output esperado

- opciones o capacidades relevantes
- evaluación breve de conveniencia
- riesgos o dependencias asociadas
- recomendación priorizada y accionable

## Integración sugerida

- validar compatibilidad con el framework antes de adoptar
- preferir componentes ya maduros y mantenidos
- registrar la decisión si impacta el estándar del proyecto

## Criterios de calidad

- selección basada en utilidad real
- seguridad y mantenimiento considerados
- alineación con patrones del repositorio
- siguiente paso claro tras la exploración

## Anti-patrones a evitar

- incorporar por moda o novedad
- ignorar costo de mantenimiento futuro
- sumar herramientas redundantes
- omitir validación de compatibilidad

## Ejemplo de solicitud

```text
/gd:marketplace buscar skill para auditoría de seguridad de APIs
```

## Siguiente paso

Si una capacidad es adecuada, combinar con `/gd:skill` o `/gd:update`.
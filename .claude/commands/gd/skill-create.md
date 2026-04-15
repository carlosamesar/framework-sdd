# `/gd:skill-create` — Diseñar una Nueva Skill Reutilizable para el Framework

## Propósito
Convertir una práctica valiosa y repetida en una skill formal, fácil de invocar y mantener. Sirve para capturar experiencia que ya demostró aportar calidad.

---

## Qué debe definir

- objetivo de la skill;
- cuándo aplica y cuándo no;
- pasos o reglas internas;
- ejemplos de entrada y salida;
- mantenimiento futuro.

---

## Checklist mínimo

- [ ] alcance claro
- [ ] restricciones explícitas
- [ ] ejemplo de uso real
- [ ] criterio de mantenimiento
- [ ] validación en un caso práctico

## Inputs recomendados

- problema recurrente bien identificado
- patrón reusable que ya demostró valor
- contexto donde la skill debería activarse
- criterio para evaluar su efectividad

## Output esperado

- skill con propósito claro
- pasos y límites bien definidos
- ejemplo concreto de activación
- decisión sobre adopción o iteración posterior

## Criterios de calidad

- utilidad real en más de un escenario
- descripción fácil de descubrir por el agente
- instrucciones accionables y mantenibles
- validación sobre un caso verdadero

## Anti-patrones a evitar

- crear skills demasiado genéricas
- duplicar capacidades ya existentes
- omitir cuándo no debe usarse
- publicar sin probar en un flujo real

## Ejemplo de solicitud

```text
/gd:skill-create skill para revisión multi-tenant en lambdas
```

---

## Siguiente paso

Validar la skill en un caso real y luego documentarla en el catálogo correspondiente.